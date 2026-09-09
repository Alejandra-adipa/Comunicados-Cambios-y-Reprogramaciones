import type { EntradaIA, IAProvider, TrozoIA } from "./provider";
import { unir } from "./provider";
import { plantilla } from "./plantillas";

/**
 * Redacción simulada.
 *
 * No sale de este archivo: no hay red, no hay claves, no hay servicio externo.
 * Parte de la plantilla determinista, le aplica los retoques de estilo que en
 * producción haría el modelo, e incorpora las observaciones del validador con
 * reglas de palabras clave. El texto se entrega por partes y con latencia para
 * que la interfaz se comporte igual que frente a un modelo real.
 */

const APERTURAS = [
  "Junto con saludar, le informamos que",
  "Esperando que se encuentre bien, le informamos que",
  "Junto con saludar, queremos informarle que",
];

const CIERRES_EXTRA = [
  "Cualquier duda, puede responder directamente a este correo.",
  "Ante cualquier consulta, quedamos disponibles a través de este mismo correo.",
  "Si necesita apoyo adicional, escríbanos por esta misma vía.",
];

const elegir = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((res, rej) => {
    if (signal?.aborted) return rej(new DOMException("Cancelado", "AbortError"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      res();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      rej(new DOMException("Cancelado", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Retoques de estilo sobre el borrador base. */
function pulir(cuerpo: string): string {
  let out = cuerpo;

  // Varía la apertura para que dos comunicados seguidos no salgan idénticos.
  out = out.replace(/^Junto con saludar, le informamos que/m, elegir(APERTURAS));

  // Cierra con una línea de disponibilidad si el texto no la trae.
  if (!/consulta|duda|disponible/i.test(out)) {
    out = out.replace(/\n\nCordialmente,/, `\n\n${elegir(CIERRES_EXTRA)}\n\nCordialmente,`);
  }

  // Higiene de formato: sin espacios dobles ni más de una línea en blanco.
  out = out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

/**
 * El motivo es contexto interno: ajusta el tono, nunca aparece en el texto.
 *
 * Solo se leen señales generales —si el cambio es por una causa que afecta a
 * una persona, o si es responsabilidad de la institución— y de ahí sale una
 * frase propia. En ningún caso se copia lo que escribió la coordinadora.
 */
function tonoSegunMotivo(cuerpo: string, motivo: string): string {
  const m = motivo.toLowerCase();
  if (!m.trim()) return cuerpo;
  if (/lamentamos|disculp/i.test(cuerpo)) return cuerpo;

  const personal = /licencia|salud|enferm|fallec|duelo|emergencia|familiar/.test(m);
  const institucional = /coordinac|error|interno|administrat|reasign|disponibilidad/.test(m);

  const frase = personal
    ? "Agradecemos su comprensión ante una situación de fuerza mayor."
    : institucional
      ? "Lamentamos los inconvenientes que este ajuste pueda ocasionar."
      : "";

  if (!frase) return cuerpo;
  return cuerpo.replace(/\n\nCordialmente,/, `\n\n${frase}\n\nCordialmente,`);
}

/** Traduce las observaciones del validador en cambios concretos sobre el texto. */
function aplicarObservaciones(cuerpo: string, obs: string): string {
  const o = obs.toLowerCase();
  let out = cuerpo;

  // Prefijos, no palabras completas: "disculpa", "disculpas" y "disculparse"
  // tienen que activar la misma regla.
  const ACORTAR = /breve|corto|acortar|resumir/;
  const DISCULPA = /disculp|lament|molest|inconvenient/;
  const ENLACE = /enlace|link|acceso|zoom|meet/;
  const ZONA = /hora chile|zona horaria|horario de chile/;

  if (ACORTAR.test(o)) {
    const bloques = out.split("\n\n");
    if (bloques.length > 4) {
      // Sale el párrafo intermedio menos informativo, no el del dato central.
      bloques.splice(2, 1);
      out = bloques.join("\n\n");
    }
  }

  if (DISCULPA.test(o) && !/lamentamos/i.test(out)) {
    // Va donde corresponde: la disculpa antecede al agradecimiento.
    out = /Agradecemos su comprensión\./.test(out)
      ? out.replace(
          /Agradecemos su comprensión\./,
          "Lamentamos los inconvenientes que esto pueda ocasionar y agradecemos su comprensión.",
        )
      : out.replace(
          /\n\nCordialmente,/,
          "\n\nLamentamos los inconvenientes que esto pueda ocasionar.\n\nCordialmente,",
        );
  }

  if (ENLACE.test(o) && !/enlace/i.test(out)) {
    out = out.replace(
      /\n\nCordialmente,/,
      "\n\nEl enlace de acceso es el mismo de siempre y lo encontrará disponible en su aula virtual.\n\nCordialmente,",
    );
  }

  if (ZONA.test(o)) {
    out = out.replace(/(\d{1,2}:\d{2} hrs)(?! \(hora)/, "$1 (hora de Chile)");
  }

  // Cualquier otra observación entra como párrafo propio antes de la firma.
  const cubierta = [ACORTAR, DISCULPA, ENLACE, ZONA].some((r) => r.test(o));
  if (!cubierta && obs.trim()) {
    const frase = obs.trim().replace(/\s+/g, " ");
    const punto = /[.!?]$/.test(frase) ? "" : ".";
    out = out.replace(/\n\nCordialmente,/, `\n\n${frase}${punto}\n\nCordialmente,`);
  }

  return out;
}

export class ProveedorSimulado implements IAProvider {
  readonly nombre = "Redacción simulada";
  readonly simulado = true;

  async *redactar(entrada: EntradaIA, opts?: { signal?: AbortSignal }): AsyncGenerator<TrozoIA> {
    const signal = opts?.signal;
    const { ctx } = entrada;

    // Latencia inicial: el modelo "piensa" antes de escribir.
    await esperar(500 + Math.random() * 500, signal);

    const base = plantilla(ctx);

    /**
     * La reunión informativa se entrega tal cual sale de la plantilla: es una
     * convocatoria y conviene que todas se lean igual. Los demás tipos sí pasan
     * por los retoques de estilo.
     */
    let cuerpo = ctx.tipo === "reunion_informativa" ? base.cuerpo : pulir(base.cuerpo);

    if (ctx.tipo !== "reunion_informativa") {
      cuerpo = tonoSegunMotivo(cuerpo, String(ctx.datos.motivo ?? ""));
    }
    if (entrada.observaciones?.trim()) {
      cuerpo = aplicarObservaciones(cuerpo, entrada.observaciones);
    }

    const completo = unir({ asunto: base.asunto, cuerpo });

    // Entrega por trozos, como un modelo que emite tokens.
    const partes = completo.match(/\S+\s*/g) ?? [completo];
    let acumulado = "";
    for (const p of partes) {
      acumulado += p;
      yield { texto: acumulado, hecho: false };
      await esperar(10 + Math.random() * 16, signal);
    }
    yield { texto: completo, hecho: true };
  }
}
