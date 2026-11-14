// Límites de seguridad: evitan que datos enormes o corruptos llenen el
// almacenamiento del navegador o congelen la app.
export const MAX_TASK_LENGTH = 200;
export const MAX_TEMPLATE_NAME_LENGTH = 60;
export const MAX_TEMPLATES = 100;
export const MAX_REPLICATE_DATES = 400;
export const MAX_STORED_DAYS = 3700;

export type TimeFormat = '12h' | '24h';
export type PlannerView = 'day' | 'calendar';
export type ReplicationStrategy = 'merge' | 'replace';

export interface HourTask {
  hour: number; // 0 to 23
  text: string;
  completed: boolean;
}

export type DayTasksMap = Record<number, HourTask>;

export interface DayRecord {
  dateKey: string; // YYYY-MM-DD
  tasks: DayTasksMap;
  updatedAt: string;
}

export interface TemplateSlot {
  hour: number;
  text: string;
}

export interface DayTemplate {
  id: string;
  name: string;
  createdAt: string;
  slots: TemplateSlot[];
}

export const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const WEEKDAYS_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_FULL_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const parts = (dateKey || '').split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return new Date();
  }
  return new Date(y, m - 1, d);
}

export function addDays(dateKey: string, delta: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + delta);
  return formatDateKey(d);
}

export function formatDisplayDate(dateKey: string): {
  weekday: string;
  dayNumber: number;
  monthName: string;
  year: number;
  shortLabel: string;
} {
  const d = parseDateKey(dateKey);
  const weekday = WEEKDAYS_FULL_ES[d.getDay()];
  const dayNumber = d.getDate();
  const monthName = MONTHS_ES[d.getMonth()];
  const year = d.getFullYear();
  return {
    weekday,
    dayNumber,
    monthName,
    year,
    shortLabel: `${weekday.slice(0, 3)} ${dayNumber} ${monthName.slice(0, 3)}`,
  };
}

export function formatHourLabel(hour: number, format: TimeFormat): string {
  if (format === '24h') {
    return `${String(hour).padStart(2, '0')}:00`;
  }
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

export function getMonthCalendarDays(year: number, monthIndex: number): Array<{
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}> {
  const firstDay = new Date(year, monthIndex, 1);
  // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  const cells: Array<{
    dateKey: string;
    dayNumber: number;
    isCurrentMonth: boolean;
  }> = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );
    cells.push({
      dateKey: formatDateKey(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === monthIndex,
    });
  }
  return cells;
}

export function countDayStats(record?: DayRecord): {
  total: number;
  completed: number;
  previewTasks: HourTask[];
} {
  if (!record || !record.tasks || typeof record.tasks !== 'object') {
    return { total: 0, completed: 0, previewTasks: [] };
  }
  const active = Object.values(record.tasks)
    .filter((t) => t && typeof t.text === 'string' && t.text.trim().length > 0)
    .sort((a, b) => a.hour - b.hour);
  return {
    total: active.length,
    completed: active.filter((t) => Boolean(t.completed)).length,
    previewTasks: active,
  };
}
