import type { EntradaIA, IAProvider, TrozoIA } from "./provider";
import { PAISES, PROGRAMAS } from "../catalogos";
import { TIPOS, camposDe } from "../tipos";
import { bloqueZoom, referenciaClase } from "./plantillas";

/**
 * Punto de reemplazo para un modelo real.
 *
 * Está deliberadamente sin implementar: esta versión de la aplicación no habla
 * con ningún servicio externo. Para activarlo:
 *
 *  1. Instalar el SDK del proveedor que corresponda.
 *  2. Completar `redactar` usando `construirPrompt` y emitiendo cada trozo del
 *     stream con la misma forma `TrozoIA` que usa la simulación.
 *  3. Definir `IA_PROVIDER=claude` y la clave en `.env.local`.
 *
 * Ninguna pantalla ni ruta cambia: todas consumen `IAProvider`.
 */
export class ProveedorClaude implements IAProvider {
  readonly nombre = "Modelo real";
  readonly simulado = false;

  async *redactar(_entrada: EntradaIA, _opts?: { signal?: AbortSignal }): AsyncGenerator<TrozoIA> {
    throw new Error(
      "El proveedor de IA real no está implementado en esta versión. " +
        "Usa IA_PROVIDER=simulado.",
    );
  }
}

/**
 * Prompt listo para cuando se conecte un modelo. Vive acá para que el día que
 * se active no haya que reconstruir el contexto desde cero.
 */
export function construirPrompt(entrada: EntradaIA): string {
  const { ctx } = entrada;
  const campos = camposDe(ctx.tipo, ctx.programa);
  const publicos = campos.filter((c) => !c.interno);
  const internos = campos.filter((c) => c.interno);

  const linea = (k: string, l: string) => {
    const v = ctx.datos[k];
    const s = Array.isArray(v) ? v.join(", ") : String(v ?? "").trim();
    return s ? `- ${l}: ${s}` : null;
  };

  const datosPublicos = publicos.map((c) => linea(c.k, c.l)).filter(Boolean).join("\n");
  const datosInternos = internos.map((c) => linea(c.k, c.l)).filter(Boolean).join("\n");

  const horarios = ctx.paises
    .map((p) => `- ${PAISES[p].nombre}: ${ctx.horarios[p] ?? "(sin definir)"}`)
    .join("\n");

  const fijo =
    ctx.tipo === "reunion_informativa"
      ? "\nESTE TIPO USA PLANTILLA FIJA: respeta la estructura y el tono de la referencia al pie de la letra y reemplaza solo los datos variables.\n"
      : "";

  return `Redacta un comunicado institucional dirigido a estudiantes.

TIPO DE COMUNICADO: ${TIPOS[ctx.tipo].nombre}
TIPO DE PROGRAMA: ${PROGRAMAS[ctx.programa].nombre}
UBICACIÓN EN EL PROGRAMA: ${referenciaClase(ctx).trim() || "no aplica"}
${fijo}
DATOS DEL COMUNICADO:
${datosPublicos}

HORARIO EN HORA LOCAL DE CADA PAÍS (usar exactamente estos valores):
${horarios}

CONEXIÓN:
${bloqueZoom(ctx)}
${datosInternos ? `\nCONTEXTO INTERNO — NO SE MENCIONA NI SE PARAFRASEA:\n${datosInternos}` : ""}

COMUNICADO DE REFERENCIA (mismo tipo, ya enviado — imita su tono y estructura):
Asunto: ${entrada.referencia.asunto}

${entrada.referencia.cuerpo}
${entrada.observaciones?.trim() ? `\nOBSERVACIONES DEL VALIDADOR A INCORPORAR:\n${entrada.observaciones.trim()}` : ""}
${entrada.borradorActual?.trim() ? `\nBORRADOR ACTUAL A MEJORAR:\n${entrada.borradorActual.trim()}` : ""}

VOZ DE ADIPA:
- Intelectual, confiable y empática. Nunca genérica ni corporativa fría.
- Correo de aula: formal, académico y preciso. Instrucciones claras y directas.
- Trato de usted. Lenguaje inclusivo y respetuoso.

GLOSARIO OBLIGATORIO:
- "estudiante" o "participante", nunca "alumno", "cliente" ni "usuario".
- "docente", nunca "profesor", "profesora" ni "speaker".
- "aula virtual" o "aula", nunca "plataforma", "plataforma e-learning" ni "Moodle".
- "sesión" o "clase", nunca "webinar", "masterclass" ni "clase zoom".
- "certificado", nunca "diploma" ni "título".
- La marca se escribe "Adipa", nunca en minúsculas.

REGLAS:
- No inventes datos que no estén arriba. Si un dato falta, omite la frase.
- El contexto interno modula el tono, nunca aparece en el texto ni parafraseado.
- Si hay más de un país, deja el horario de cada uno en una lista.
- Cierra con la firma "Coordinación de Experiencia del Cliente".

FORMATO DE SALIDA:
Primera línea "ASUNTO: <asunto>", una línea en blanco, y luego el cuerpo.`;
}
