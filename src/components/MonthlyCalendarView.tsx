import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CopyPlus } from 'lucide-react';
import {
  countDayStats,
  getMonthCalendarDays,
  MONTHS_ES,
  parseDateKey,
  WEEKDAYS_SHORT_ES,
} from '../types/planner';
import { DaysStore } from '../utils/storage';

interface MonthlyCalendarViewProps {
  selectedDateKey: string;
  todayKey: string;
  days: DaysStore;
  onSelectDate: (dateKey: string) => void;
  onOpenReplicateModal: () => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  selectedDateKey,
  todayKey,
  days,
  onSelectDate,
  onOpenReplicateModal,
}) => {
  const initialDate = parseDateKey(selectedDateKey);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const cells = getMonthCalendarDays(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const t = parseDateKey(todayKey);
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
  };

  const monthStats = cells.reduce(
    (acc, cell) => {
      if (!cell.isCurrentMonth) return acc;
      const stats = countDayStats(days[cell.dateKey]);
      if (stats.total > 0) {
        acc.activeDays += 1;
        acc.totalTasks += stats.total;
        acc.completedTasks += stats.completed;
      }
      return acc;
    },
    { activeDays: 0, totalTasks: 0, completedTasks: 0 }
  );

  return (
    <section
      aria-label="Calendario mensual visual"
      className="bg-[#FAFBFD] rounded-3xl border border-[#C7DCF2] shadow-[0_10px_32px_-12px_rgba(34,58,94,0.12)] overflow-hidden"
    >
      {/* Calendar Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#D2E6F9] bg-gradient-to-b from-[#EFF6FD] to-[#FAFBFD] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#223A5E] tracking-tight">
            {MONTHS_ES[viewMonth]} {viewYear}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E7A9E] mt-0.5 font-mono tabular-nums">
            {monthStats.activeDays} días organizados
            <span aria-hidden="true" className="mx-1.5">·</span>
            {monthStats.completedTasks}/{monthStats.totalTasks} tareas hechas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Mes anterior"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-[#223A5E] hover:bg-[#E1EEFA] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleJumpToday}
              className="min-h-[44px] px-3 rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-xs font-medium text-[#223A5E] hover:bg-[#E1EEFA] transition-colors whitespace-nowrap"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Mes siguiente"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#C7DCF2] bg-[#FAFBFD] text-[#223A5E] hover:bg-[#E1EEFA] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReplicateModal}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#568FD1] hover:bg-[#4279BA] text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <CopyPlus className="w-4 h-4 shrink-0" />
            <span>Replicar rutina</span>
          </button>
        </div>
      </div>

      {/* Month Quick Selector Bar (helps plan across all 12 months & years) */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[#E1EEFA] bg-[#F4F8FC] flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1">
          {MONTHS_ES.map((mName, idx) => (
            <button
              key={mName}
              type="button"
              onClick={() => setViewMonth(idx)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                idx === viewMonth
                  ? 'bg-[#223A5E] text-white'
                  : 'text-[#5E7A9E] hover:bg-[#E1EEFA] hover:text-[#223A5E]'
              }`}
            >
              {mName.slice(0, 3)}
            </button>
          ))}
        </div>

        <select
          aria-label="Seleccionar año"
          value={viewYear}
          onChange={(e) => setViewYear(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-[#C7DCF2] bg-[#FAFBFD] text-xs font-mono tabular-nums text-[#223A5E] focus:outline-none focus:border-[#568FD1]"
        >
          {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 1 + i).map(
            (yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            )
          )}
        </select>
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mb-2">
          {WEEKDAYS_SHORT_ES.map((wd) => (
            <div
              key={wd}
              className="text-center text-[11px] sm:text-xs font-semibold text-[#5E7A9E] py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {cells.map((cell) => {
            const stats = countDayStats(days[cell.dateKey]);
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDateKey;
            const progressPct =
              stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => onSelectDate(cell.dateKey)}
                className={`group relative min-h-[68px] sm:min-h-[104px] p-1.5 sm:p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#568FD1] ${
                  !cell.isCurrentMonth
                    ? 'bg-[#F4F8FC]/60 border-[#E5EFF9] text-[#98AEC9] hover:bg-[#EFF6FD]'
                    : isSelected
                    ? 'bg-[#E1EEFA] border-[#568FD1] shadow-[0_4px_14px_-6px_rgba(86,143,209,0.45)]'
                    : stats.total > 0
                    ? 'bg-[#FAFBFD] border-[#C7DCF2] hover:border-[#568FD1] hover:bg-[#F2F8FE]'
                    : 'bg-[#FAFBFD] border-[#E1EEFA] hover:border-[#B9D3EE] hover:bg-[#F4F8FC]'
                }`}
              >
                {/* Day Number & Ratio */}
                <div className="flex items-start justify-between gap-1 w-full">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-mono tabular-nums text-xs sm:text-sm font-semibold ${
                      isToday
                        ? 'bg-[#F6DC80] text-[#223A5E]'
                        : cell.isCurrentMonth
                        ? 'text-[#223A5E]'
                        : 'text-[#98AEC9]'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {stats.total > 0 && (
                    <span className="font-mono tabular-nums text-[10px] sm:text-[11px] text-[#5E7A9E]">
                      {stats.completed}/{stats.total}
                    </span>
                  )}
                </div>

                {/* Desktop Task Snippets */}
                {stats.previewTasks.length > 0 && (
                  <div className="hidden md:flex flex-col gap-0.5 my-1 overflow-hidden w-full">
                    {stats.previewTasks.slice(0, 2).map((t) => (
                      <p
                        key={t.hour}
                        className={`text-[11px] leading-tight truncate ${
                          t.completed
                            ? 'line-through text-[#849EC0]'
                            : 'text-[#223A5E]'
                        }`}
                      >
                        {t.text}
                      </p>
                    ))}
                    {stats.previewTasks.length > 2 && (
                      <p className="text-[10px] text-[#5E7A9E]">
                        +{stats.previewTasks.length - 2} más
                      </p>
                    )}
                  </div>
                )}

                {/* Visual Progress Bar */}
                <div className="w-full mt-auto pt-1">
                  {stats.total > 0 ? (
                    <div className="w-full h-1.5 rounded-full bg-[#DCEAF8] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#568FD1] transition-all"
                        style={{ width: `${Math.max(progressPct, 12)}%` }}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
