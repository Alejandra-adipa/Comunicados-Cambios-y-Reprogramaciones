import type { Solicitud } from "../modelo";
import type { Referencia } from "../referencias";

/**
 * Contrato único de la redacción asistida.
 *
 * Toda la aplicación habla con esta interfaz y nunca con un proveedor concreto.
 * Cambiar de la simulación a un modelo real es implementar `IAProvider` otra vez
 * y registrarlo en `index.ts`; ninguna pantalla ni ruta necesita cambiar.
 */

/**
 * Lo que hace falta para redactar: el qué, el dónde y el cuándo.
 * Deja fuera contactos y archivos, que no influyen en el texto.
 */
export type ContextoComunicado = Pick<
  Solicitud,
  "tipo" | "programa" | "alcance" | "paises" | "horarios" | "datos" | "zoomSeMantiene" | "zoom"
>;

export type EntradaIA = {
  ctx: ContextoComunicado;
  /** Comunicado anterior del mismo tipo, como modelo de tono y estructura. */
  referencia: Referencia;
  /** Texto que ya está en el editor, si se está reescribiendo. */
  borradorActual?: string;
  /** Observaciones del validador a incorporar en esta pasada. */
  observaciones?: string;
};

export type SalidaIA = {
  asunto: string;
  cuerpo: string;
};

/** Un fragmento del texto a medida que se va generando. */
export type TrozoIA = {
  /** Texto acumulado hasta ahora, en formato crudo. */
  texto: string;
  hecho: boolean;
};

export interface IAProvider {
  /** Nombre visible en la interfaz. */
  readonly nombre: string;
  /** `true` cuando las respuestas no vienen de un modelo real. */
  readonly simulado: boolean;
  redactar(entrada: EntradaIA, opts?: { signal?: AbortSignal }): AsyncGenerator<TrozoIA>;
}

/**
 * Formato de intercambio: primera línea el asunto, luego el cuerpo.
 * Se parsea de forma incremental para poder pintar mientras llega.
 */
export const PREFIJO_ASUNTO = "ASUNTO:";

export function partir(texto: string): SalidaIA {
  const lineas = texto.split("\n");
  let asunto = "";
  let inicioCuerpo = 0;
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i].trim();
    if (!l) continue;
    if (l.toUpperCase().startsWith(PREFIJO_ASUNTO)) {
      asunto = l.slice(PREFIJO_ASUNTO.length).trim();
      inicioCuerpo = i + 1;
    }
    break;
  }
  const cuerpo = lineas.slice(inicioCuerpo).join("\n").replace(/^\n+/, "");
  return { asunto, cuerpo };
}

export function unir(salida: SalidaIA): string {
  return `${PREFIJO_ASUNTO} ${salida.asunto}\n\n${salida.cuerpo}`;
}
