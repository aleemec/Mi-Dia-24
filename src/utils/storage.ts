import {
  DayRecord,
  DayTasksMap,
  DayTemplate,
  formatDateKey,
  HourTask,
  MAX_STORED_DAYS,
  MAX_TASK_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TEMPLATES,
  TemplateSlot,
} from '../types/planner';

const DAYS_STORAGE_KEY = 'mi_dia_24h_days_v1';
const TEMPLATES_STORAGE_KEY = 'mi_dia_24h_templates_v1';
const FORMAT_STORAGE_KEY = 'mi_dia_24h_time_format_v1';
const INITIALIZED_KEY = 'mi_dia_24h_initialized_v1';

export type DaysStore = Record<string, DayRecord>;


// ---------------------------------------------------------------------------
// Validación de datos leídos del navegador.
// localStorage puede ser modificado por el usuario, por otra extensión o
// quedar corrupto; nunca se confía en su forma. Todo se reconstruye campo a
// campo, descartando lo que no cumpla el formato esperado.
// ---------------------------------------------------------------------------
const DATE_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ID_RE = /^[\w-]{1,64}$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cleanText(v: unknown, max: number): string | null {
  return typeof v === 'string' ? v.slice(0, max) : null;
}

function cleanHour(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 23 ? n : null;
}

function cleanIso(v: unknown): string {
  if (typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v))) return v;
  return new Date().toISOString();
}

function sanitizeDays(raw: unknown): DaysStore {
  const out: DaysStore = {};
  if (!isPlainObject(raw)) return out;
  let count = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (count >= MAX_STORED_DAYS) break;
    if (!DATE_KEY_RE.test(key) || !isPlainObject(value)) continue;
    const tasks: DayTasksMap = {};
    if (isPlainObject(value.tasks)) {
      for (const [h, t] of Object.entries(value.tasks)) {
        const hour = cleanHour(h);
        if (hour === null || !isPlainObject(t)) continue;
        const text = cleanText(t.text, MAX_TASK_LENGTH);
        if (text === null) continue;
        const task: HourTask = { hour, text, completed: t.completed === true };
        tasks[hour] = task;
      }
    }
    out[key] = { dateKey: key, tasks, updatedAt: cleanIso(value.updatedAt) } satisfies DayRecord;
    count++;
  }
  return out;
}

function sanitizeTemplates(raw: unknown): DayTemplate[] {
  if (!Array.isArray(raw)) return [];
  const out: DayTemplate[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    if (out.length >= MAX_TEMPLATES) break;
    if (!isPlainObject(t) || typeof t.id !== 'string' || !ID_RE.test(t.id) || seen.has(t.id)) continue;
    const name = cleanText(t.name, MAX_TEMPLATE_NAME_LENGTH);
    if (name === null || !Array.isArray(t.slots)) continue;
    const slots: TemplateSlot[] = [];
    for (const s of t.slots.slice(0, 24)) {
      if (!isPlainObject(s)) continue;
      const hour = cleanHour(s.hour);
      const text = cleanText(s.text, MAX_TASK_LENGTH);
      if (hour === null || text === null) continue;
      slots.push({ hour, text });
    }
    seen.add(t.id);
    out.push({ id: t.id, name, createdAt: cleanIso(t.createdAt), slots });
  }
  return out;
}

function createSeedDays(todayKey: string): DaysStore {
  return {
    [todayKey]: {
      dateKey: todayKey,
      updatedAt: new Date().toISOString(),
      tasks: {
        6: { hour: 6, text: 'Despertar', completed: true },
        9: { hour: 9, text: 'Organizar mi día', completed: false },
      },
    },
  };
}

function createSeedTemplates(): DayTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tpl-cursada',
      name: 'Día de estudio y foco',
      createdAt: now,
      slots: [
        { hour: 7, text: 'Desayuno y repaso rápido' },
        { hour: 9, text: 'Bloque de estudio / clases' },
        { hour: 13, text: 'Almuerzo y descanso' },
        { hour: 16, text: 'Práctica / trabajos pendientes' },
        { hour: 19, text: 'Entrenamiento o caminata' },
        { hour: 22, text: 'Lectura y preparar mañana' },
      ],
    },
    {
      id: 'tpl-finde',
      name: 'Fin de semana tranquilo',
      createdAt: now,
      slots: [
        { hour: 9, text: 'Despertar sin alarma y café' },
        { hour: 11, text: 'Ordenar espacio y compras' },
        { hour: 16, text: 'Tiempo libre / salida' },
        { hour: 21, text: 'Cena y película' },
      ],
    },
  ];
}

export function loadInitialPlannerData(): {
  days: DaysStore;
  templates: DayTemplate[];
  timeFormat: '12h' | '24h';
} {
  const todayKey = formatDateKey(new Date());
  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    const rawDays = localStorage.getItem(DAYS_STORAGE_KEY);
    const rawTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const rawFormat = localStorage.getItem(FORMAT_STORAGE_KEY);

    if (!initialized) {
      const seedDays = createSeedDays(todayKey);
      const seedTemplates = createSeedTemplates();
      localStorage.setItem(INITIALIZED_KEY, '1');
      localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(seedDays));
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(seedTemplates));
      return {
        days: seedDays,
        templates: seedTemplates,
        timeFormat: rawFormat === '24h' ? '24h' : '12h',
      };
    }

    return {
      days: sanitizeDays(rawDays ? JSON.parse(rawDays) : {}),
      templates: sanitizeTemplates(rawTemplates ? JSON.parse(rawTemplates) : []),
      timeFormat: rawFormat === '24h' ? '24h' : '12h',
    };
  } catch {
    return {
      days: createSeedDays(todayKey),
      templates: createSeedTemplates(),
      timeFormat: '12h',
    };
  }
}

export function saveDaysStore(days: DaysStore): boolean {
  try {
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days));
    return true;
  } catch {
    return false; // cuota llena o almacenamiento bloqueado: la app avisa al usuario
  }
}

export function saveTemplatesStore(templates: DayTemplate[]): boolean {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false; // cuota llena o almacenamiento bloqueado: la app avisa al usuario
  }
}

export function saveTimeFormatPreference(format: '12h' | '24h'): void {
  try {
    localStorage.setItem(FORMAT_STORAGE_KEY, format);
  } catch {
    // Ignore storage issues
  }
}
