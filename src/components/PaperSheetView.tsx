import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  CalendarDays,
  Check,
  Eraser,
  X,
} from 'lucide-react';
import {
  countDayStats,
  DayRecord,
  formatDisplayDate,
  formatHourLabel,
  MAX_TASK_LENGTH,
  TimeFormat,
} from '../types/planner';

interface PaperSheetViewProps {
  dateKey: string;
  todayKey: string;
  record?: DayRecord;
  timeFormat: TimeFormat;
  onToggleTimeFormat: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToday: () => void;
  onOpenCalendar: () => void;
  onUpdateTask: (hour: number, text: string) => void;
  onToggleTask: (hour: number) => void;
  onDeleteTask: (hour: number) => void;
  onClearDay: () => void;
  onOpenSaveReplicate: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const PaperSheetView: React.FC<PaperSheetViewProps> = ({
  dateKey,
  todayKey,
  record,
  timeFormat,
  onToggleTimeFormat,
  onPrevDay,
  onNextDay,
  onGoToday,
  onOpenCalendar,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onClearDay,
  onOpenSaveReplicate,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [confirmClear, setConfirmClear] = useState(false);

  const dateInfo = formatDisplayDate(dateKey);
  const stats = countDayStats(record);
  const isToday = dateKey === todayKey;

  // Reset confirmation banner when switching days and scroll softly to 6am
  useEffect(() => {
    setConfirmClear(false);
    const container = scrollRef.current;
    const row6am = rowRefs.current[6];
    if (container && row6am) {
      container.scrollTop = row6am.offsetTop - 8;
    }
  }, [dateKey]);

  const scrollToHour = (hour: number) => {
    const container = scrollRef.current;
    const targetRow = rowRefs.current[hour];
    if (container && targetRow) {
      container.scrollTo({
        top: Math.max(0, targetRow.offsetTop - 8),
        behavior: 'smooth',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, hour: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextHour = hour + 1;
      if (nextHour <= 23) {
        const nextInput = inputRefs.current[nextHour];
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        e.currentTarget.blur();
      }
    }
  };

  return (
    <section
      aria-label="Hoja diaria de 24 horas"
      className="bg-[#FAFBFD] rounded-3xl border border-[#C7DCF2] shadow-[0_10px_32px_-12px_rgba(34,58,94,0.12)] overflow-hidden flex flex-col"
    >
      {/* Top Paper Header matching sketch: [<-]  Mi día  [Calendario] */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[#D2E6F9] bg-gradient-to-b from-[#EFF6FD] to-[#FAFBFD]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevDay}
              aria-label="Día anterior"
              title="Día anterior"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-[#223A5E] hover:bg-[#E1EEFA] active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#568FD1]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextDay}
              aria-label="Día siguiente"
              title="Día siguiente"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-[#223A5E] hover:bg-[#E1EEFA] active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#568FD1]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center min-w-0 flex-1 px-2">
            <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#223A5E] truncate">
              Mi día
            </h1>
            <p className="text-xs sm:text-sm text-[#5E7A9E] truncate mt-0.5">
              <span>{dateInfo.weekday} {dateInfo.dayNumber} de {dateInfo.monthName}</span>
              {isToday && (
                <>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span className="font-semibold text-[#568FD1]">Hoy</span>
                </>
              )}
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono tabular-nums">
                {stats.total === 0
                  ? 'Hoja libre'
                  : `${stats.completed}/${stats.total} hechas`}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCalendar}
            aria-label="Ver calendario mensual"
            title="Ver calendario mensual"
            className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-[#223A5E] hover:bg-[#E1EEFA] active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#568FD1]"
          >
            <CalendarDays className="w-4 h-4 text-[#568FD1]" />
            <span className="hidden sm:inline text-xs font-medium whitespace-nowrap">
              Mes
            </span>
          </button>
        </div>

        {/* Quiet utility strip: quick jump to 6am / Hoy / 12h-24h */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-[#5E7A9E]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToHour(0)}
              className="hover:text-[#223A5E] transition-colors py-1 whitespace-nowrap"
            >
              Madrugada (00h)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => scrollToHour(6)}
              className="hover:text-[#223A5E] font-medium text-[#568FD1] transition-colors py-1 whitespace-nowrap"
            >
              Ir a 6am
            </button>
            {!isToday && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onGoToday}
                  className="hover:text-[#223A5E] font-medium transition-colors py-1 whitespace-nowrap"
                >
                  Volver a hoy
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleTimeFormat}
            className="px-2 py-1 rounded-md hover:bg-[#E1EEFA] text-[#5E7A9E] hover:text-[#223A5E] font-mono tabular-nums transition-colors whitespace-nowrap"
            title="Cambiar formato de hora"
          >
            {timeFormat === '12h' ? '12h am/pm' : '24h'}
          </button>
        </div>
      </div>

      {/* 24-Hour Lined Paper Area */}
      <div
        ref={scrollRef}
        className="paper-scroll relative overflow-y-auto max-h-[60vh] lg:max-h-[64vh] px-3 sm:px-6 py-2 bg-[#FAFBFD]"
      >
        <div className="relative divide-y divide-[#D7E6F6]">
          {/* Subtle vertical notebook margin line spanning full 24h height */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden sm:block absolute top-0 bottom-0 left-[4.25rem] w-px bg-[#F2D5DB]"
          />
          {HOURS.map((hour) => {
            const task = record?.tasks?.[hour];
            const text = task?.text ?? '';
            const hasText = text.trim().length > 0;
            const completed = Boolean(task?.completed && hasText);
            const isEarlyMorning = hour < 6;

            return (
              <div
                key={hour}
                ref={(el) => {
                  rowRefs.current[hour] = el;
                }}
                className={`group flex items-center gap-2 sm:gap-4 min-h-[48px] py-1 transition-colors ${
                  isEarlyMorning ? 'bg-[#F4F8FC]/60' : ''
                }`}
              >
                {/* Hour Column */}
                <label
                  htmlFor={`hour-input-${hour}`}
                  className={`w-12 sm:w-14 shrink-0 text-right pr-1 font-mono tabular-nums text-xs sm:text-sm select-none cursor-pointer ${
                    isEarlyMorning ? 'text-[#849EC0]' : 'text-[#5E7A9E] font-medium'
                  }`}
                >
                  {formatHourLabel(hour, timeFormat)}
                </label>

                {/* Lined Paper Task Input */}
                <div className="relative flex-1 min-w-0 flex items-center">
                  <input
                    id={`hour-input-${hour}`}
                    ref={(el) => {
                      inputRefs.current[hour] = el;
                    }}
                    type="text"
                    maxLength={MAX_TASK_LENGTH}
                    autoComplete="off"
                    value={text}
                    onChange={(e) => onUpdateTask(hour, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, hour)}
                    placeholder={hour === 6 ? 'Ej. Despertar y tomar agua...' : ''}
                    aria-label={`Tarea para las ${formatHourLabel(hour, timeFormat)}`}
                    className={`w-full bg-transparent py-2 px-1.5 text-[15px] leading-snug border-b border-transparent focus:border-[#568FD1] focus:outline-none transition-colors placeholder:text-[#A9C1DE] ${
                      completed
                        ? 'line-through decoration-[#568FD1] decoration-2 text-[#6F89AA]'
                        : 'text-[#223A5E]'
                    }`}
                  />
                </div>

                {/* Row Actions: Delete & Checkmark */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {hasText && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(hour)}
                      aria-label={`Borrar tarea de las ${formatHourLabel(hour, timeFormat)}`}
                      title="Borrar tarea"
                      className="min-w-[38px] min-h-[44px] flex items-center justify-center rounded-lg text-[#8CA6C7] hover:text-[#B94A5A] hover:bg-[#FDECEF] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all focus-visible:outline-2 focus-visible:outline-[#568FD1]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (hasText) {
                        onToggleTask(hour);
                      } else {
                        inputRefs.current[hour]?.focus();
                      }
                    }}
                    aria-label={
                      hasText
                        ? completed
                          ? `Desmarcar tarea de las ${formatHourLabel(hour, timeFormat)}`
                          : `Marcar como realizada la tarea de las ${formatHourLabel(hour, timeFormat)}`
                        : `Escribir tarea a las ${formatHourLabel(hour, timeFormat)}`
                    }
                    aria-pressed={completed}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#568FD1] ${
                      completed
                        ? 'text-[#223A5E] bg-[#D6E8FA] hover:bg-[#C4DEF8]'
                        : hasText
                        ? 'text-[#568FD1] hover:bg-[#E1EEFA]'
                        : 'text-[#B5CCE4] hover:text-[#568FD1] hover:bg-[#EFF6FD]'
                    }`}
                  >
                    <Check
                      className={`w-5 h-5 transition-transform ${
                        completed ? 'scale-105 stroke-[2.6]' : 'stroke-[2]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Clear Confirmation (when user clicks (X)) */}
      {confirmClear && (
        <div className="px-4 sm:px-6 py-3 bg-[#F4F8FC] border-t border-[#D2E6F9] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-[#223A5E] font-medium">
            ¿Vaciar todas las tareas de este día?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-3 py-2 min-h-[40px] rounded-xl text-xs font-medium text-[#5E7A9E] hover:bg-[#E1EEFA] transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onClearDay();
                setConfirmClear(false);
              }}
              className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-[#223A5E] text-white hover:bg-[#192C48] transition-colors whitespace-nowrap"
            >
              Sí, limpiar hoja
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet Footer matching sketch: (X) on left, [Save / Replicate] on right */}
      <div className="px-4 sm:px-6 py-3 border-t border-[#D2E6F9] bg-[#F4F8FC] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (stats.total === 0) return;
            setConfirmClear((prev) => !prev);
          }}
          disabled={stats.total === 0}
          aria-label="Limpiar tareas del día"
          title={stats.total === 0 ? 'No hay tareas para limpiar' : 'Limpiar todas las tareas del día'}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#568FD1] ${
            stats.total === 0
              ? 'border-[#D7E6F6] text-[#B5CCE4] cursor-not-allowed bg-[#FAFBFD]'
              : 'border-[#B9D3EE] text-[#223A5E] bg-[#FAFBFD] hover:bg-[#FDECEF] hover:border-[#E5B8C0] hover:text-[#9E3848] active:scale-[0.95]'
          }`}
        >
          {stats.total > 0 ? <X className="w-5 h-5" /> : <Eraser className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenSaveReplicate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#568FD1] hover:bg-[#4279BA] text-white font-medium text-sm flex items-center gap-2 shadow-[0_4px_14px_-4px_rgba(86,143,209,0.55)] active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#223A5E]"
        >
          <BookmarkPlus className="w-4 h-4 shrink-0" />
          <span>Guardar y replicar</span>
        </button>
      </div>
    </section>
  );
};
