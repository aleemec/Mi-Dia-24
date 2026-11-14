import React from 'react';
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  countDayStats,
  DayTemplate,
  formatHourLabel,
  getMonthCalendarDays,
  MONTHS_ES,
  parseDateKey,
  TimeFormat,
  WEEKDAYS_SHORT_ES,
} from '../types/planner';
import { DaysStore } from '../utils/storage';

interface TemplatesSidebarProps {
  selectedDateKey: string;
  todayKey: string;
  days: DaysStore;
  templates: DayTemplate[];
  timeFormat: TimeFormat;
  onSelectDate: (dateKey: string) => void;
  onApplyTemplateToCurrentDay: (template: DayTemplate) => void;
  onReplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onOpenFullCalendar: () => void;
}

export const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  selectedDateKey,
  todayKey,
  days,
  templates,
  timeFormat,
  onSelectDate,
  onApplyTemplateToCurrentDay,
  onReplicateTemplate,
  onDeleteTemplate,
  onOpenFullCalendar,
}) => {
  const parsed = parseDateKey(selectedDateKey);
  const [miniYear, setMiniYear] = React.useState(parsed.getFullYear());
  const [miniMonth, setMiniMonth] = React.useState(parsed.getMonth());

  React.useEffect(() => {
    const p = parseDateKey(selectedDateKey);
    setMiniYear(p.getFullYear());
    setMiniMonth(p.getMonth());
  }, [selectedDateKey]);

  const miniCells = getMonthCalendarDays(miniYear, miniMonth);

  return (
    <aside className="space-y-5">
      {/* Mini Calendar Quick-Jump Card */}
      <div className="bg-[#FAFBFD] rounded-3xl border border-[#C7DCF2] p-4 shadow-[0_8px_24px_-12px_rgba(34,58,94,0.1)]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-base font-semibold text-[#223A5E]">
            {MONTHS_ES[miniMonth]} {miniYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (miniMonth === 0) {
                  setMiniMonth(11);
                  setMiniYear((y) => y - 1);
                } else {
                  setMiniMonth((m) => m - 1);
                }
              }}
              aria-label="Mes anterior"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5E7A9E] hover:bg-[#E1EEFA] hover:text-[#223A5E] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (miniMonth === 11) {
                  setMiniMonth(0);
                  setMiniYear((y) => y + 1);
                } else {
                  setMiniMonth((m) => m + 1);
                }
              }}
              aria-label="Mes siguiente"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5E7A9E] hover:bg-[#E1EEFA] hover:text-[#223A5E] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS_SHORT_ES.map((w) => (
            <div
              key={w}
              className="text-center text-[10px] font-semibold text-[#5E7A9E]"
            >
              {w.slice(0, 2)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {miniCells.map((cell) => {
            const stats = countDayStats(days[cell.dateKey]);
            const isSelected = cell.dateKey === selectedDateKey;
            const isToday = cell.dateKey === todayKey;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => onSelectDate(cell.dateKey)}
                className={`relative h-8 rounded-lg font-mono tabular-nums text-xs flex flex-col items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-[#568FD1] text-white font-semibold'
                    : isToday
                    ? 'bg-[#F6DC80] text-[#223A5E] font-semibold'
                    : cell.isCurrentMonth
                    ? 'text-[#223A5E] hover:bg-[#E1EEFA]'
                    : 'text-[#A9C1DE] hover:bg-[#F4F8FC]'
                }`}
              >
                <span>{cell.dayNumber}</span>
                {stats.total > 0 && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-[#568FD1] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenFullCalendar}
          className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-[#568FD1] hover:bg-[#E1EEFA] transition-colors"
        >
          Abrir calendario mensual completo →
        </button>
      </div>

      {/* Saved Templates Card */}
      <div className="bg-[#FAFBFD] rounded-3xl border border-[#C7DCF2] p-4 shadow-[0_8px_24px_-12px_rgba(34,58,94,0.1)]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-base font-semibold text-[#223A5E]">
            Plantillas guardadas
          </h2>
          <span className="text-xs font-mono tabular-nums text-[#5E7A9E]">
            {templates.length}
          </span>
        </div>

        {templates.length === 0 ? (
          <p className="text-xs text-[#5E7A9E] leading-relaxed py-2">
            Todavía no guardaste días. Usa el botón{' '}
            <strong className="text-[#223A5E]">Guardar y replicar</strong> de tu
            hoja para reutilizar tus rutinas favoritas.
          </p>
        ) : (
          <div className="space-y-2.5">
            {templates.map((tpl) => {
              const firstHour = tpl.slots[0]?.hour ?? 6;
              const lastHour = tpl.slots[tpl.slots.length - 1]?.hour ?? 22;

              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-[#D7E6F6] bg-[#F4F8FC]/70 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#223A5E] truncate">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-[#5E7A9E] font-mono tabular-nums mt-0.5">
                        {tpl.slots.length} tareas ·{' '}
                        {formatHourLabel(firstHour, timeFormat)}–
                        {formatHourLabel(lastHour, timeFormat)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(tpl.id)}
                      aria-label={`Eliminar plantilla ${tpl.name}`}
                      title="Eliminar plantilla"
                      className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-[#8CA6C7] hover:text-[#B94A5A] hover:bg-[#FDECEF] transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onApplyTemplateToCurrentDay(tpl)}
                      className="flex-1 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white border border-[#C7DCF2] text-xs font-medium text-[#223A5E] hover:bg-[#E1EEFA] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-[#568FD1]" />
                      <span>Aplicar al día</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onReplicateTemplate(tpl.id)}
                      className="flex-1 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#E1EEFA] text-xs font-medium text-[#223A5E] hover:bg-[#D2E6F9] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#568FD1]" />
                      <span>Replicar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
