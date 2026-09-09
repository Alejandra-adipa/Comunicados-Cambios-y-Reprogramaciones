import type { TipoKey } from "./tipos";
import { esTipoValido } from "./tipos";
import { esPais, esPrograma, PAIS_KEYS, type PaisKey, type ProgramaKey } from "./catalogos";

/** Un participante leído del listado del aula virtual. */
export type Contacto = {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  grupos: string;
  /** Rol tal como venía en el archivo. Vacío si la columna no existe. */
  rol: string;
  /**
   * Países a los que aplica el listado del que salió. Es una lista porque un
   * mismo archivo puede servir a varios países, o a todos.
   */
  paises: PaisKey[];
  /** Nombre del archivo del que se leyó. */
  origen: string;
};

/** Un archivo de base cargado, con los países a los que corresponde. */
export type ArchivoBase = {
  id: string;
  nombre: string;
  paises: PaisKey[];
  filas: number;
  cargado: string;
};

export type RespuestaValidacion = "aprobado" | "observaciones";

/** Una vuelta del ciclo de validación. */
export type Iteracion = {
  n: number;
  enviado: string;
  respondido?: string;
  respuesta?: RespuestaValidacion;
  comentario?: string;
  /** Quién tenía que responder esta vuelta. */
  validador: string;
  /** Lo que el validador efectivamente revisó en esta vuelta. */
  asunto: string;
  cuerpo: string;
};

export type EstadoValidacion = "borrador" | "en_revision" | "observado" | "aprobado";

/** Datos de conexión de una sesión por Zoom. */
export type DatosZoom = {
  link: string;
  id: string;
  codigo: string;
};

export type Solicitud = {
  id: string;
  creada: string;
  actualizada: string;
  paso: number;

  /** Qué se informa. */
  tipo: TipoKey;
  /** Dónde ocurre: define campos y validador. */
  programa: ProgramaKey;
  /** Solo para Curso: si el comunicado habla del inicio o de una clase puntual. */
  alcance: "inicio" | "clase";
  /** Países que reciben el comunicado. */
  paises: PaisKey[];
  /**
   * Horario de la sesión en hora local de cada país, tal como se escribió.
   * Se guarda el texto, nunca una regla: las equivalencias cambian con el
   * horario de invierno y verano de Chile.
   */
  horarios: Partial<Record<PaisKey, string>>;

  solicitante: string;
  datos: Record<string, string | string[]>;

  /** Si el enlace de siempre sigue sirviendo, no hace falta publicar otro. */
  zoomSeMantiene: boolean;
  zoom: DatosZoom;

  asunto: string;
  cuerpo: string;
  /** Procedencia del texto actual, p. ej. "Borrador asistido · 14:32". */
  fuente: string;

  estado: EstadoValidacion;
  /** Un caso sensible cambia quién valida, no cuántos validan. */
  sensible: boolean;
  /** Contexto interno de por qué el caso es sensible. Opcional. */
  motivoSensibilidad: string;
  historial: Iteracion[];

  archivos: ArchivoBase[];
  contactos: Contacto[];
  /** Correos que la coordinadora dejó fuera a mano. */
  excluidos: string[];

  envio: { enviado: boolean; fecha?: string; total?: number };
};

export function solicitudNueva(
  id: string,
  tipo: TipoKey = "reprogramacion",
  programa: ProgramaKey = "curso",
): Solicitud {
  const ahora = new Date().toISOString();
  return {
    id,
    creada: ahora,
    actualizada: ahora,
    paso: 1,
    tipo,
    programa,
    alcance: "clase",
    paises: ["cl"],
    horarios: {},
    solicitante: "",
    datos: {},
    zoomSeMantiene: true,
    zoom: { link: "", id: "", codigo: "" },
    asunto: "",
    cuerpo: "",
    fuente: "",
    estado: "borrador",
    sensible: false,
    motivoSensibilidad: "",
    historial: [],
    archivos: [],
    contactos: [],
    excluidos: [],
    envio: { enviado: false },
  };
}

/** El envío solo se habilita con una aprobación válida. */
export function puedeEnviar(s: Solicitud): boolean {
  return s.estado === "aprobado" && !s.envio.enviado;
}

/* --------------------------------------------------------------- migración */

const texto = (v: unknown, pordefecto = "") =>
  typeof v === "string" ? v : pordefecto;

/**
 * Países de un archivo o de un contacto.
 *
 * Acepta el campo `pais` de las versiones anteriores, cuando un listado
 * pertenecía a un solo país, y lo convierte en lista.
 */
function paisesDe(x: Record<string, unknown>): PaisKey[] {
  if (Array.isArray(x.paises)) {
    const lista = x.paises.filter((p): p is PaisKey => typeof p === "string" && esPais(p));
    if (lista.length > 0) return lista;
  }
  const uno = texto(x.pais);
  return esPais(uno) ? [uno] : ["cl"];
}

/**
 * Completa un registro guardado antes de que existieran los campos nuevos.
 *
 * Se aplica al leer de disco, así que los comunicados creados con versiones
 * anteriores siguen abriendo sin necesidad de tocar los archivos JSON.
 */
export function normalizar(crudo: unknown): Solicitud {
  const v = (crudo ?? {}) as Record<string, unknown>;
  const base = solicitudNueva(String(v.id ?? ""));

  const tipo = texto(v.tipo);
  const programa = texto(v.programa);
  const paises = Array.isArray(v.paises) ? v.paises.filter((p): p is PaisKey => esPais(String(p))) : [];

  const horariosCrudos = (v.horarios ?? {}) as Record<string, unknown>;
  const horarios: Partial<Record<PaisKey, string>> = {};
  for (const p of PAIS_KEYS) {
    const h = texto(horariosCrudos[p]);
    if (h) horarios[p] = h;
  }

  const zoom = (v.zoom ?? {}) as Record<string, unknown>;
  const envio = (v.envio ?? {}) as Record<string, unknown>;

  return {
    ...base,
    id: String(v.id ?? base.id),
    creada: texto(v.creada, base.creada),
    actualizada: texto(v.actualizada, base.actualizada),
    paso: typeof v.paso === "number" ? v.paso : 1,

    tipo: esTipoValido(tipo) ? tipo : base.tipo,
    programa: esPrograma(programa) ? programa : base.programa,
    alcance: v.alcance === "inicio" ? "inicio" : "clase",
    paises: paises.length > 0 ? paises : base.paises,
    horarios,

    solicitante: texto(v.solicitante),
    datos: (v.datos ?? {}) as Record<string, string | string[]>,

    zoomSeMantiene: v.zoomSeMantiene !== false,
    zoom: {
      link: texto(zoom.link),
      id: texto(zoom.id),
      codigo: texto(zoom.codigo),
    },

    asunto: texto(v.asunto),
    cuerpo: texto(v.cuerpo),
    fuente: texto(v.fuente),

    estado: (["borrador", "en_revision", "observado", "aprobado"] as const).includes(
      v.estado as EstadoValidacion,
    )
      ? (v.estado as EstadoValidacion)
      : "borrador",
    sensible: v.sensible === true,
    motivoSensibilidad: texto(v.motivoSensibilidad),
    historial: Array.isArray(v.historial)
      ? v.historial.map((it, i) => {
          const x = (it ?? {}) as Record<string, unknown>;
          return {
            n: typeof x.n === "number" ? x.n : i + 1,
            enviado: texto(x.enviado, base.creada),
            respondido: typeof x.respondido === "string" ? x.respondido : undefined,
            respuesta:
              x.respuesta === "aprobado" || x.respuesta === "observaciones"
                ? x.respuesta
                : undefined,
            comentario: typeof x.comentario === "string" ? x.comentario : undefined,
            validador: texto(x.validador, "Jefatura"),
            asunto: texto(x.asunto),
            cuerpo: texto(x.cuerpo),
          };
        })
      : [],

    archivos: Array.isArray(v.archivos)
      ? v.archivos.map((a) => {
          const x = (a ?? {}) as Record<string, unknown>;
          return {
            id: texto(x.id),
            nombre: texto(x.nombre),
            paises: paisesDe(x),
            filas: typeof x.filas === "number" ? x.filas : 0,
            cargado: texto(x.cargado, base.creada),
          };
        })
      : [],
    contactos: Array.isArray(v.contactos)
      ? v.contactos.map((c) => {
          const x = (c ?? {}) as Record<string, unknown>;
          return {
            id: texto(x.id),
            nombre: texto(x.nombre),
            apellidos: texto(x.apellidos),
            correo: texto(x.correo),
            grupos: texto(x.grupos),
            rol: texto(x.rol),
            paises: paisesDe(x),
            origen: texto(x.origen),
          };
        })
      : [],
    excluidos: Array.isArray(v.excluidos) ? v.excluidos.map(String) : [],

    envio: {
      enviado: envio.enviado === true,
      fecha: typeof envio.fecha === "string" ? envio.fecha : undefined,
      total: typeof envio.total === "number" ? envio.total : undefined,
    },
  };
}
