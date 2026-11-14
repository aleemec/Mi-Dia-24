import { useCallback, useEffect, useState } from 'react';
import { Bookmark, CalendarDays, NotebookPen } from 'lucide-react';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { PaperSheetView } from './components/PaperSheetView';
import { SaveReplicateModal } from './components/SaveReplicateModal';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import {
  addDays,
  DayTasksMap,
  DayTemplate,
  formatDateKey,
  MAX_TASK_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TEMPLATES,
  PlannerView,
  ReplicationStrategy,
  TemplateSlot,
  TimeFormat,
} from './types/planner';
import {
  DaysStore,
  loadInitialPlannerData,
  saveDaysStore,
  saveTemplatesStore,
  saveTimeFormatPreference,
} from './utils/storage';

export default function App() {
  const todayKey = formatDateKey(new Date());

  const [initialData] = useState(() => loadInitialPlannerData());
  const [days, setDays] = useState<DaysStore>(initialData.days);
  const [templates, setTemplates] = useState<DayTemplate[]>(initialData.templates);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(initialData.timeFormat);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [activeView, setActiveView] = useState<PlannerView>('day');
  const [mobileShowTemplates, setMobileShowTemplates] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'save' | 'replicate'>('save');
  const [modalTemplateId, setModalTemplateId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saveDaysStore(days)) {
      setFeedbackMessage('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado');
    }
  }, [days]);

  useEffect(() => {
    if (!saveTemplatesStore(templates)) {
      setFeedbackMessage('No se pudieron guardar las plantillas: almacenamiento lleno o bloqueado');
    }
  }, [templates]);

  useEffect(() => {
    saveTimeFormatPreference(timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  const showToast = useCallback((msg: string) => {
    setFeedbackMessage(msg);
  }, []);

  const handleUpdateTask = useCallback(
    (hour: number, rawText: string) => {
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;
      const text = rawText.slice(0, MAX_TASK_LENGTH);
      setDays((prev) => {
        const existingDay = prev[selectedDateKey];
        const existingTasks = existingDay?.tasks ?? {};
        const prevHourTask = existingTasks[hour];
        const nextTasks: DayTasksMap = { ...existingTasks };

        if (text.length === 0) {
          delete nextTasks[hour];
        } else {
          nextTasks[hour] = {
            hour,
            text,
            completed: prevHourTask?.completed ?? false,
          };
        }

        return {
          ...prev,
          [selectedDateKey]: {
            dateKey: selectedDateKey,
            tasks: nextTasks,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [selectedDateKey]
  );

  const handleToggleTask = useCallback(
    (hour: number) => {
      setDays((prev) => {
        const existingDay = prev[selectedDateKey];
        const target = existingDay?.tasks[hour];
        if (!target || target.text.trim().length === 0) return prev;

        return {
          ...prev,
          [selectedDateKey]: {
            dateKey: selectedDateKey,
            tasks: {
              ...existingDay.tasks,
              [hour]: {
                ...target,
                completed: !target.completed,
              },
            },
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [selectedDateKey]
  );

  const handleDeleteTask = useCallback(
    (hour: number) => {
      setDays((prev) => {
        const existingDay = prev[selectedDateKey];
        if (!existingDay || !existingDay.tasks[hour]) return prev;
        const nextTasks = { ...existingDay.tasks };
        delete nextTasks[hour];
        return {
          ...prev,
          [selectedDateKey]: {
            dateKey: selectedDateKey,
            tasks: nextTasks,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [selectedDateKey]
  );

  const handleClearDay = useCallback(() => {
    setDays((prev) => ({
      ...prev,
      [selectedDateKey]: {
        dateKey: selectedDateKey,
        tasks: {},
        updatedAt: new Date().toISOString(),
      },
    }));
    showToast('Hoja del día limpiada');
  }, [selectedDateKey, showToast]);

  const handleSaveTemplate = useCallback(
    (name: string, slots: TemplateSlot[]): DayTemplate => {
      const created: DayTemplate = {
        id: `tpl-${crypto.randomUUID()}`,
        name: name.slice(0, MAX_TEMPLATE_NAME_LENGTH),
        createdAt: new Date().toISOString(),
        slots: slots
          .filter((s) => Number.isInteger(s.hour) && s.hour >= 0 && s.hour <= 23)
          .map((s) => ({ hour: s.hour, text: s.text.slice(0, MAX_TASK_LENGTH) })),
      };
      setTemplates((prev) => [created, ...prev].slice(0, MAX_TEMPLATES));
      showToast(`Plantilla "${name}" guardada`);
      return created;
    },
    [showToast]
  );

  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      showToast('Plantilla eliminada');
    },
    [showToast]
  );

  const applySlotsToDateMap = (
    currentTasks: DayTasksMap,
    slots: TemplateSlot[],
    strategy: ReplicationStrategy
  ): DayTasksMap => {
    const nextTasks: DayTasksMap =
      strategy === 'replace' ? {} : { ...currentTasks };

    for (const slot of slots) {
      const existingText = nextTasks[slot.hour]?.text;
      const hasExisting = typeof existingText === 'string' && existingText.trim().length > 0;
      if (strategy === 'replace' || !hasExisting) {
        nextTasks[slot.hour] = {
          hour: slot.hour,
          text: slot.text,
          completed: false,
        };
      }
    }
    return nextTasks;
  };

  const handleReplicateToDates = useCallback(
    (
      targetDates: string[],
      slots: TemplateSlot[],
      strategy: ReplicationStrategy
    ) => {
      setDays((prev) => {
        const updated = { ...prev };
        for (const dKey of targetDates) {
          const existingTasks = updated[dKey]?.tasks ?? {};
          updated[dKey] = {
            dateKey: dKey,
            tasks: applySlotsToDateMap(existingTasks, slots, strategy),
            updatedAt: new Date().toISOString(),
          };
        }
        return updated;
      });
      showToast(
        `Tareas replicadas en ${targetDates.length} ${
          targetDates.length === 1 ? 'fecha' : 'fechas'
        }`
      );
    },
    [showToast]
  );

  const handleApplyTemplateToCurrentDay = useCallback(
    (template: DayTemplate) => {
      setDays((prev) => {
        const existingTasks = prev[selectedDateKey]?.tasks ?? {};
        return {
          ...prev,
          [selectedDateKey]: {
            dateKey: selectedDateKey,
            tasks: applySlotsToDateMap(existingTasks, template.slots, 'merge'),
            updatedAt: new Date().toISOString(),
          },
        };
      });
      setMobileShowTemplates(false);
      setActiveView('day');
      showToast(`"${template.name}" aplicada en este día`);
    },
    [selectedDateKey, showToast]
  );

  const openModal = (tab: 'save' | 'replicate', templateId: string | null = null) => {
    setModalTab(tab);
    setModalTemplateId(templateId);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#EEF5FC] text-[#223A5E] flex flex-col">
      {/* Compact 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#FAFBFD]/90 backdrop-blur-md border-b border-[#D2E6F9]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setMobileShowTemplates(false);
              setActiveView('day');
            }}
            className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#223A5E] whitespace-nowrap shrink-0"
          >
            Mi Día 24h
          </button>

          {/* Zone 2: Concise Single-Line Navigation */}
          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => {
                setMobileShowTemplates(false);
                setActiveView('day');
              }}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeView === 'day' && !mobileShowTemplates
                  ? 'border-[#568FD1] text-[#223A5E]'
                  : 'border-transparent text-[#5E7A9E] hover:text-[#223A5E]'
              }`}
            >
              <NotebookPen className="w-4 h-4 hidden sm:inline" />
              <span>Mi día</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileShowTemplates(false);
                setActiveView('calendar');
              }}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeView === 'calendar' && !mobileShowTemplates
                  ? 'border-[#568FD1] text-[#223A5E]'
                  : 'border-transparent text-[#5E7A9E] hover:text-[#223A5E]'
              }`}
            >
              <CalendarDays className="w-4 h-4 hidden sm:inline" />
              <span>Calendario</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileShowTemplates((prev) => !prev)}
              className={`lg:hidden py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                mobileShowTemplates
                  ? 'border-[#568FD1] text-[#223A5E]'
                  : 'border-transparent text-[#5E7A9E] hover:text-[#223A5E]'
              }`}
            >
              <Bookmark className="w-4 h-4 hidden sm:inline" />
              <span>Plantillas</span>
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <button
            type="button"
            onClick={() => openModal('save')}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#568FD1] hover:bg-[#4279BA] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Guardar día
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-7">
        {mobileShowTemplates ? (
          <div className="lg:hidden">
            <TemplatesSidebar
              selectedDateKey={selectedDateKey}
              todayKey={todayKey}
              days={days}
              templates={templates}
              timeFormat={timeFormat}
              onSelectDate={(dKey) => {
                setSelectedDateKey(dKey);
                setMobileShowTemplates(false);
                setActiveView('day');
              }}
              onApplyTemplateToCurrentDay={handleApplyTemplateToCurrentDay}
              onReplicateTemplate={(tplId) => openModal('replicate', tplId)}
              onDeleteTemplate={handleDeleteTemplate}
              onOpenFullCalendar={() => {
                setMobileShowTemplates(false);
                setActiveView('calendar');
              }}
            />
          </div>
        ) : activeView === 'day' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            <PaperSheetView
              dateKey={selectedDateKey}
              todayKey={todayKey}
              record={days[selectedDateKey]}
              timeFormat={timeFormat}
              onToggleTimeFormat={() =>
                setTimeFormat((prev) => (prev === '12h' ? '24h' : '12h'))
              }
              onPrevDay={() => setSelectedDateKey((d) => addDays(d, -1))}
              onNextDay={() => setSelectedDateKey((d) => addDays(d, 1))}
              onGoToday={() => setSelectedDateKey(todayKey)}
              onOpenCalendar={() => setActiveView('calendar')}
              onUpdateTask={handleUpdateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onClearDay={handleClearDay}
              onOpenSaveReplicate={() => openModal('save')}
            />

            <div className="hidden lg:block">
              <TemplatesSidebar
                selectedDateKey={selectedDateKey}
                todayKey={todayKey}
                days={days}
                templates={templates}
                timeFormat={timeFormat}
                onSelectDate={(dKey) => setSelectedDateKey(dKey)}
                onApplyTemplateToCurrentDay={handleApplyTemplateToCurrentDay}
                onReplicateTemplate={(tplId) => openModal('replicate', tplId)}
                onDeleteTemplate={handleDeleteTemplate}
                onOpenFullCalendar={() => setActiveView('calendar')}
              />
            </div>
          </div>
        ) : (
          <MonthlyCalendarView
            selectedDateKey={selectedDateKey}
            todayKey={todayKey}
            days={days}
            onSelectDate={(dKey) => {
              setSelectedDateKey(dKey);
              setActiveView('day');
            }}
            onOpenReplicateModal={() => openModal('replicate')}
          />
        )}
      </main>

      {/* Save / Replicate Modal */}
      {modalOpen && (
        <SaveReplicateModal
          isOpen={modalOpen}
          initialTab={modalTab}
          initialTemplateId={modalTemplateId}
          currentDateKey={selectedDateKey}
          currentRecord={days[selectedDateKey]}
          templates={templates}
          timeFormat={timeFormat}
          onClose={() => setModalOpen(false)}
          onSaveTemplate={handleSaveTemplate}
          onReplicateToDates={handleReplicateToDates}
        />
      )}

      {/* Gentle Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#223A5E] text-white text-xs sm:text-sm font-medium shadow-lg whitespace-nowrap"
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}
