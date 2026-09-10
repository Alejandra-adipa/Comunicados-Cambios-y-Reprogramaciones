/**
 * Catálogos de la aplicación.
 *
 * Hoy son listas locales. Están aisladas acá a propósito: el día que existan
 * Moodle o Monday, se reemplaza la fuente de cada lista sin tocar las pantallas,
 * que solo consumen estas constantes y funciones.
 */

/* ------------------------------------------------------------------ países */

export const PAISES = {
  cl: { nombre: "Chile", gentilicio: "Chile" },
  ar: { nombre: "Argentina", gentilicio: "Argentina" },
  mx: { nombre: "México", gentilicio: "México" },
  co: { nombre: "Colombia", gentilicio: "Colombia" },
} as const;

export type PaisKey = keyof typeof PAISES;

export const PAIS_KEYS = Object.keys(PAISES) as PaisKey[];

export function esPais(k: string): k is PaisKey {
  return k in PAISES;
}

/* --------------------------------------------------------------- programas */

/**
 * Cualquier programa puede comunicar el inicio o una clase puntual, así que el
 * alcance se pregunta siempre. Lo que cambia por tipo es si hay módulos.
 */
export const PROGRAMAS = {
  curso: {
    nombre: "Curso",
    desc: "Actualización puntual, sin estructura de módulos.",
    pideModulo: false,
  },
  diplomado: {
    nombre: "Diplomado",
    desc: "Programa modular secuencial.",
    pideModulo: true,
  },
  acreditacion: {
    nombre: "Acreditación",
    desc: "Habilitación en un instrumento específico.",
    pideModulo: false,
  },
  postitulo: {
    nombre: "Postítulo",
    desc: "Especialización avanzada, modular.",
    pideModulo: true,
  },
} as const;

export type ProgramaKey = keyof typeof PROGRAMAS;

export const PROGRAMA_KEYS = Object.keys(PROGRAMAS) as ProgramaKey[];

export function esPrograma(k: string): k is ProgramaKey {
  return k in PROGRAMAS;
}

/* ------------------------------------------------------------- validadores */

export type Validador = {
  id: string;
  nombre: string;
  rol: string;
};

export const VALIDADORES = {
  daniel: { id: "daniel", nombre: "Daniel Oyarce", rol: "Validación de cursos" },
  nicole: { id: "nicole", nombre: "Nicole Agüero", rol: "Validación de acreditaciones y casos sensibles" },
  edwin: { id: "edwin", nombre: "Edwin Hernández", rol: "Validación de diplomados y postítulos" },
} as const satisfies Record<string, Validador>;

export type ValidadorKey = keyof typeof VALIDADORES;

/* ---------------------------------------------------------------- horarios */

/**
 * Horarios habituales de sesión, en hora local de cada país.
 *
 * Son **sugerencias**, no reglas. Chile cambia entre horario de invierno y
 * verano, y con eso cambian las equivalencias del resto: por eso el horario
 * siempre se puede editar y lo que se guarda es lo que se escribió en ese
 * comunicado, no una fórmula que se recalcule después.
 */
export const HORARIOS_SUGERIDOS: Record<"semana" | "sabado", Record<PaisKey, string>> = {
  semana: {
    cl: "18:00 a 22:00 hrs",
    ar: "18:00 a 22:00 hrs",
    mx: "15:00 a 19:00 hrs",
    co: "16:00 a 20:00 hrs",
  },
  sabado: {
    cl: "09:00 a 13:00 hrs",
    ar: "09:00 a 13:00 hrs",
    mx: "06:00 a 10:00 hrs",
    co: "07:00 a 11:00 hrs",
  },
};

/** Los sábados tienen su propia tabla; el resto de la semana comparte una. */
export function tablaHorarios(fechaISO: string | undefined): "semana" | "sabado" {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaISO ?? "").trim());
  if (!m) return "semana";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getDay() === 6 ? "sabado" : "semana";
}

export function horarioSugerido(pais: PaisKey, fechaISO?: string): string {
  return HORARIOS_SUGERIDOS[tablaHorarios(fechaISO)][pais];
}

/* ------------------------------------------------- catálogos reemplazables */

/**
 * Listas de apoyo para los desplegables del formulario.
 * Cada una expone una función en vez de un arreglo suelto, para que el día que
 * la fuente sea remota solo cambie el cuerpo de la función.
 */

const SOLICITANTES = [
  "Coordinación Académica",
  "Equipo Académico",
  "Dirección de Programas",
];

const DOCENTES = [
  "Mg. Ps. Daniela Ibacache",
  "Mg. Ps. Hermann Thomas Ehrenfeld",
  "Mg. Ps. Jonathan Martínez",
  "Mg. Ps. Nicolás Lorenzini",
];

/**
 * Programas por tipo. El desplegable de "Programa o asignatura" muestra solo
 * los del tipo elegido, que es como se buscan en la práctica.
 */
const PROGRAMAS_DISPONIBLES: Record<ProgramaKey, string[]> = {
  acreditacion: [
    "Acreditación Oficial Clínica Internacional ADI-R",
    "Acreditación Oficial Clínica Internacional ADOS-2",
  ],
  diplomado: [
    "Diplomado en Abordaje Multidisciplinario de los Trastornos de la Conducta Alimentaria (TCA)",
    "Diplomado Internacional: Estrategias Clínicas en Psicoterapia Breve en Adultos",
    "Diplomado en Psicología Jurídica y Forense: Una mirada desde la criminalística, criminología y el delito",
  ],
  curso: [
    "Abordaje clínico en trauma complejo, trauma del desarrollo y microtrauma relacional en adolescencia y adultez",
    "Certificación en Escala Wechsler de Inteligencia para Niños (WISC-V) - Nivel Inicial, Intermedio y Avanzado: Profundización Diagnóstica y Análisis de Casos",
    "Neurociencias de los vínculos afectivos y las relaciones de pareja: claves para la evaluación e intervención clínica",
  ],
  postitulo: [
    "Postítulo de Especialización en Trauma Complejo. La Complejidad del Trauma Complejo a través de las trayectorias vitales: Un modelo de complejidad integral de comprensión, evaluación e intervención",
  ],
};

// TODO(moodle-monday): reemplazar por la consulta al sistema correspondiente.
export const catalogos = {
  solicitantes: (): string[] => SOLICITANTES,
  docentes: (): string[] => DOCENTES,
  programas: (programa: ProgramaKey): string[] => PROGRAMAS_DISPONIBLES[programa],
};
