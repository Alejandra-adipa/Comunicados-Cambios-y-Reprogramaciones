import { PROGRAMAS, type ProgramaKey } from "./catalogos";

/**
 * Catálogo de tipos de comunicado.
 *
 * Los campos de un formulario salen de dos ejes independientes: el tipo de
 * comunicado (qué se está informando) y el tipo de programa (dónde ocurre).
 * `camposDe` combina ambos; las pantallas no arman listas por su cuenta.
 */

export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export type CampoTipo = "text" | "date" | "textarea" | "select" | "dias" | "numero";

/** Catálogos disponibles para los campos con desplegable. */
export type CatalogoKey = "solicitantes" | "docentes" | "programas";

export type Campo = {
  k: string;
  l: string;
  t: CampoTipo;
  ph?: string;
  opts?: string[];
  /** Desplegable alimentado por un catálogo, con opción de escribir otro valor. */
  cat?: CatalogoKey;
  req?: boolean;
  /** No se menciona de forma literal en el comunicado publicado. */
  interno?: boolean;
};

export type DefinicionTipo = {
  nombre: string;
  desc: string;
  campos: Campo[];
  /**
   * Si está presente, el comunicado lleva horario por país y este es el
   * encabezado del bloque. La ausencia significa que el horario no aplica.
   */
  horarios?: string;
  /** Campo de fecha que decide si se sugiere la tabla de semana o la de sábado. */
  fechaClave?: string;
  /**
   * Bloque de clases afectadas. Su ausencia significa que el comunicado no
   * habla de sesiones concretas.
   */
  clases?: {
    titulo: string;
    /** Fecha en que la clase estaba programada. */
    conFechaOriginal: boolean;
    /** Fecha a la que se mueve. */
    conFechaNueva: boolean;
  };
  /** Los datos de conexión son parte del comunicado, no una excepción. */
  zoomSiempre?: boolean;
};

const MOTIVO_INTERNO: Campo = {
  k: "motivo",
  l: "Motivo",
  t: "text",
  ph: "Licencia médica de la docente",
  interno: true,
};

const CATALOGO = {
  reprogramacion: {
    nombre: "Reprogramación de clase",
    desc: "La sesión se corre a otra fecha u horario.",
    horarios: "Horario de las nuevas sesiones",
    clases: { titulo: "Clases que se reprograman", conFechaOriginal: true, conFechaNueva: true },
    campos: [
      { k: "asignatura", l: "Programa o asignatura", t: "text", cat: "programas", req: true },
      { k: "docente", l: "Docente a cargo", t: "text", cat: "docentes", req: true },
      MOTIVO_INTERNO,
    ],
  },
  cambio_docente: {
    nombre: "Cambio de docente",
    desc: "Otra persona asume el curso desde una fecha.",
    clases: { titulo: "Clases afectadas", conFechaOriginal: false, conFechaNueva: false },
    campos: [
      { k: "asignatura", l: "Programa o asignatura", t: "text", cat: "programas", req: true },
      { k: "docenteSaliente", l: "Docente saliente", t: "text", cat: "docentes", req: true },
      { k: "docenteEntrante", l: "Docente entrante", t: "text", cat: "docentes", req: true },
      {
        k: "perfilEntrante",
        l: "Perfil breve del docente entrante",
        t: "textarea",
        ph: "Magíster en Gestión de Personas, 12 años de experiencia en banca.",
      },
      { k: "fechaEfectiva", l: "Efectivo desde", t: "date", req: true },
      MOTIVO_INTERNO,
    ],
  },
  suspension: {
    nombre: "Suspensión de clase",
    desc: "La sesión no se dicta y se avisa la recuperación.",
    horarios: "Horario de las sesiones suspendidas",
    clases: { titulo: "Clases suspendidas", conFechaOriginal: true, conFechaNueva: false },
    campos: [
      { k: "asignatura", l: "Programa o asignatura", t: "text", cat: "programas", req: true },
      { k: "docente", l: "Docente a cargo", t: "text", cat: "docentes", req: true },
      {
        k: "motivoPublico",
        l: "Motivo que se comunica",
        t: "text",
        ph: "Corte de energía programado en la sede",
        req: true,
      },
      {
        k: "recuperacion",
        l: "Cómo se recupera",
        t: "textarea",
        ph: "Se recupera el sábado 20 de septiembre de 10:00 a 12:30 hrs.",
        req: true,
      },
      MOTIVO_INTERNO,
    ],
  },
  cambio_horario: {
    nombre: "Cambio de horario",
    desc: "El bloque del curso cambia de forma permanente.",
    horarios: "Horario nuevo",
    fechaClave: "vigenciaDesde",
    clases: { titulo: "Clases afectadas", conFechaOriginal: false, conFechaNueva: false },
    campos: [
      { k: "asignatura", l: "Programa o asignatura", t: "text", cat: "programas", req: true },
      { k: "docente", l: "Docente a cargo", t: "text", cat: "docentes", req: true },
      {
        k: "horarioAnterior",
        l: "Horario anterior (hora de Chile)",
        t: "text",
        ph: "18:30 a 21:00 hrs",
        req: true,
      },
      { k: "dias", l: "Días de clase", t: "dias", req: true },
      { k: "vigenciaDesde", l: "Vigente desde", t: "date", req: true },
      MOTIVO_INTERNO,
    ],
  },
  reunion_informativa: {
    nombre: "Reunión informativa",
    desc: "Sesión de bienvenida o información sobre un programa.",
    horarios: "Horario de la sesión",
    fechaClave: "fechaSesion",
    zoomSiempre: true,
    campos: [
      {
        k: "nombrePrograma",
        l: "Nombre del programa o acreditación",
        t: "text",
        ph: "Acreditación ADOS-2",
        req: true,
      },
      { k: "fechaSesion", l: "Fecha de la sesión", t: "date", req: true },
      MOTIVO_INTERNO,
    ],
  },
  aviso_general: {
    nombre: "Aviso general",
    desc: "Información operativa que no encaja en los otros tipos.",
    campos: [
      { k: "tema", l: "Tema del aviso", t: "text", ph: "Mantención del aula virtual", req: true },
      {
        k: "mensajeClave",
        l: "Qué necesitan saber",
        t: "textarea",
        ph: "El aula virtual no estará disponible el domingo entre las 08:00 y las 14:00 hrs.",
        req: true,
      },
      { k: "accion", l: "Qué deben hacer (opcional)", t: "text", ph: "Descargar los materiales antes del sábado" },
      { k: "fechaLimite", l: "Fecha límite (opcional)", t: "date" },
      MOTIVO_INTERNO,
    ],
  },
} satisfies Record<string, DefinicionTipo>;

export type TipoKey = keyof typeof CATALOGO;

/**
 * Se declara con el tipo completo para que las propiedades opcionales
 * —`horarios`, `fechaClave`, `zoomSiempre`— existan en todas las entradas y no
 * haya que comprobar el tipo antes de leerlas.
 */
export const TIPOS: Record<TipoKey, DefinicionTipo> = CATALOGO;

export const TIPO_KEYS = Object.keys(CATALOGO) as TipoKey[];

export function esTipoValido(k: string): k is TipoKey {
  return k in CATALOGO;
}

/** Tipos que hablan de una clase concreta y por eso exigen ubicarla en el programa. */
const TIPOS_DE_CLASE: TipoKey[] = [
  "reprogramacion",
  "cambio_docente",
  "suspension",
  "cambio_horario",
];

/** Campos que aporta el tipo de programa: módulo, clase o alcance. */
export function camposDePrograma(tipo: TipoKey, programa: ProgramaKey): Campo[] {
  // La reunión informativa nombra el programa por su cuenta.
  if (tipo === "reunion_informativa") return [];

  const req = TIPOS_DE_CLASE.includes(tipo);
  const def = PROGRAMAS[programa];
  const campos: Campo[] = [];

  // El número de clase ya no vive acá: cada clase afectada tiene el suyo, con
  // su fecha, en el bloque de clases.
  if (def.pideModulo) {
    campos.push(
      { k: "moduloNumero", l: "Número de módulo", t: "numero", ph: "3", req },
      { k: "moduloNombre", l: "Nombre del módulo", t: "text", ph: "Evaluación e intervención", req },
    );
  }

  return campos;
}

/** Lista completa y ordenada de campos del formulario. */
export function camposDe(tipo: TipoKey, programa: ProgramaKey): Campo[] {
  const base = TIPOS[tipo].campos;
  const dePrograma = camposDePrograma(tipo, programa);
  // El motivo interno cierra siempre el formulario.
  const sinMotivo = base.filter((c) => !c.interno);
  const interno = base.filter((c) => c.interno);
  return [...sinMotivo, ...dePrograma, ...interno];
}
