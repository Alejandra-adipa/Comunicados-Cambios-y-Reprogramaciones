import { FIRMA } from "../referencias";
import { PAISES, PROGRAMAS } from "../catalogos";
import { TIPOS } from "../tipos";
import { CORREO } from "../envio/provider";
import type { ClaseAfectada } from "../modelo";
import type { ContextoComunicado, SalidaIA } from "./provider";

/** "2026-06-12" -> "jueves 12 de junio". Devuelve el texto crudo si no parsea. */
export function fechaLarga(v: unknown): string {
  const s = String(v ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return s;
  const dia = d.toLocaleDateString("es-CL", { weekday: "long" });
  const mes = d.toLocaleDateString("es-CL", { month: "long" });
  return `${dia} ${d.getDate()} de ${mes}`;
}

/** ["Lun","Mié"] -> "lunes y miércoles". */
export function diasLargos(v: unknown): string {
  const mapa: Record<string, string> = {
    Lun: "lunes",
    Mar: "martes",
    "Mié": "miércoles",
    Jue: "jueves",
    Vie: "viernes",
    "Sáb": "sábado",
  };
  const arr = Array.isArray(v) ? v : String(v ?? "").split(",").filter(Boolean);
  const nombres = arr.map((d) => mapa[String(d).trim()] ?? String(d).trim());
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** Une con comas y una "y" final: "el 8, el 9 y el 10 de septiembre". */
function enumerar(partes: string[]): string {
  const limpias = partes.filter(Boolean);
  if (limpias.length === 0) return "";
  if (limpias.length === 1) return limpias[0];
  return `${limpias.slice(0, -1).join(", ")} y ${limpias[limpias.length - 1]}`;
}

const txt = (ctx: ContextoComunicado, k: string) => String(ctx.datos[k] ?? "").trim();

/* ------------------------------------------------------------------ clases */

/** Clases con algún dato cargado. Las filas en blanco no llegan al comunicado. */
export function clasesUtiles(ctx: ContextoComunicado): ClaseAfectada[] {
  if (ctx.alcance === "inicio") return [];
  return ctx.clases.filter((c) => c.numero || c.fechaOriginal || c.fechaNueva);
}

/** La fecha que manda para sugerir horarios: la nueva si existe, si no la original. */
export function fechaDeReferencia(ctx: ContextoComunicado): string {
  const clave = TIPOS[ctx.tipo].fechaClave;
  if (clave) return txt(ctx, clave);
  const primera = clasesUtiles(ctx)[0];
  return primera ? primera.fechaNueva || primera.fechaOriginal : "";
}

/* ---------------------------------------------------------------- horarios */

/**
 * Horario en hora local de cada país.
 *
 * Con un solo país se resuelve en la misma frase; con varios va como lista,
 * que es la única forma de que nadie tenga que calcular la diferencia.
 */
export function horarioEnLinea(ctx: ContextoComunicado): string {
  const conHorario = ctx.paises.filter((p) => (ctx.horarios[p] ?? "").trim());
  if (conHorario.length === 0) return "";
  if (conHorario.length === 1) {
    const p = conHorario[0];
    return `de ${ctx.horarios[p]} (hora de ${PAISES[p].nombre})`;
  }
  return "en el horario que corresponde a su país";
}

function lineasHorario(ctx: ContextoComunicado): string[] {
  const conHorario = ctx.paises.filter((p) => (ctx.horarios[p] ?? "").trim());
  if (conHorario.length === 1) {
    const p = conHorario[0];
    return [`${ctx.horarios[p]} · hora de ${PAISES[p].nombre}`];
  }
  return conHorario.map((p) => `${PAISES[p].nombre}: ${ctx.horarios[p]}`);
}

export function bloqueHorarios(ctx: ContextoComunicado): string {
  const conHorario = ctx.paises.filter((p) => (ctx.horarios[p] ?? "").trim());
  if (conHorario.length < 2) return "";
  const lineas = conHorario.map((p) => `- ${PAISES[p].nombre}: ${ctx.horarios[p]}`);
  return `Horario según su país:\n${lineas.join("\n")}`;
}

/**
 * Calendario actualizado: una entrada por clase, con su fecha y su horario.
 *
 * Es el bloque que evita el malentendido más caro de estos comunicados. Cuando
 * se mueven varias sesiones, decirlo en prosa obliga al estudiante a cruzar
 * fechas; en lista, cada clase se lee sola.
 */
export function calendario(ctx: ContextoComunicado, usarFechaNueva: boolean): string {
  const clases = clasesUtiles(ctx);
  if (clases.length === 0) return "";

  const horas = lineasHorario(ctx);
  const bloques = clases.map((c) => {
    const fecha = usarFechaNueva ? c.fechaNueva || c.fechaOriginal : c.fechaOriginal;
    const lineas = [c.numero ? `Clase ${c.numero}` : "Sesión"];
    if (fecha) lineas.push(fechaLarga(fecha));
    lineas.push(...horas);
    return lineas.join("\n");
  });

  return bloques.join("\n\n");
}

/** "el jueves 17, el viernes 18 y el sábado 19 de septiembre" */
function fechasDe(clases: ClaseAfectada[], campo: "fechaOriginal" | "fechaNueva"): string {
  // Cada fecha lleva su propio artículo: "el jueves 17 y el viernes 18" se lee
  // mejor que "el jueves 17 y viernes 18".
  const fechas = clases.map((c) => fechaLarga(c[campo])).filter(Boolean);
  return enumerar(fechas.map((f) => `el ${f}`));
}

/* ------------------------------------------------------------------- zoom */

/** Datos de conexión, o la indicación de que el enlace de siempre sigue válido. */
export function bloqueZoom(ctx: ContextoComunicado): string {
  // Una reunión informativa siempre tiene su propia sala: no hay "enlace de
  // siempre" al que remitir, aunque la casilla diga que se mantiene.
  const publicarDatos = TIPOS[ctx.tipo].zoomSiempre || !ctx.zoomSeMantiene;
  if (!publicarDatos) {
    return "Los accesos se mantienen sin cambios: el enlace es el mismo que utilizan habitualmente y lo encontrarán disponible en su aula virtual.";
  }
  const { link, id, codigo } = ctx.zoom;
  const lineas = ["Los datos de conexión son los siguientes:"];
  if (link) lineas.push(`- Enlace: ${link}`);
  if (id) lineas.push(`- ID de reunión: ${id}`);
  if (codigo) lineas.push(`- Código de acceso: ${codigo}`);
  return lineas.length > 1 ? lineas.join("\n") : "";
}

/* --------------------------------------------------------- encabezado y pie */

/** Nombre del programa tal como se nombra en el comunicado. */
function nombrePrograma(ctx: ContextoComunicado): string {
  return String(ctx.datos.nombrePrograma ?? ctx.datos.asignatura ?? "").trim();
}

/**
 * Saludo. Cuando se conoce el programa se lo nombra, que es como se escriben
 * hoy estos correos: el estudiante sabe de inmediato de cuál de sus programas
 * le están hablando.
 */
function saludo(ctx: ContextoComunicado): string {
  const nombre = nombrePrograma(ctx);
  if (!nombre) return "Estimadas y estimados estudiantes:";
  const programa = PROGRAMAS[ctx.programa].nombre.toLowerCase();
  return `Estimadas y estimados participantes del ${programa} "${nombre}":`;
}

const APERTURA = "Junto con saludar cordialmente, esperamos que se encuentren muy bien.";

const cierre = `En caso de tener dudas o requerir apoyo, pueden responder directamente a este correo o escribirnos a ${CORREO.responderA}.

${FIRMA}`;

/** "del módulo 3, Evaluación e intervención" o cadena vacía. */
export function referenciaClase(ctx: ContextoComunicado): string {
  const partes: string[] = [];
  const modulo = txt(ctx, "moduloNumero");
  const nombreModulo = txt(ctx, "moduloNombre");

  if (PROGRAMAS[ctx.programa].pideModulo && modulo) {
    partes.push(nombreModulo ? `módulo ${modulo}, ${nombreModulo}` : `módulo ${modulo}`);
  }

  const clases = clasesUtiles(ctx)
    .map((c) => c.numero)
    .filter(Boolean);
  if (clases.length === 1) partes.push(`clase ${clases[0]}`);
  else if (clases.length > 1) partes.push(`clases ${enumerar(clases)}`);

  return partes.length > 0 ? ` (${partes.join(" · ")})` : "";
}

const parrafos = (...bloques: string[]) => bloques.filter((b) => b.trim()).join("\n\n");

/* -------------------------------------------------------------- plantillas */

/**
 * Borrador base a partir de los datos del formulario.
 * Es determinista y no pasa por la capa de IA: sirve como punto de partida
 * y como salida de respaldo si la redacción asistida falla.
 *
 * El campo `motivo` nunca entra acá: es contexto interno.
 */
export function plantilla(ctx: ContextoComunicado): SalidaIA {
  const nombre = nombrePrograma(ctx);
  const programa = PROGRAMAS[ctx.programa].nombre.toLowerCase();
  const horario = horarioEnLinea(ctx);
  const tabla = bloqueHorarios(ctx);
  const zoom = bloqueZoom(ctx);
  const clase = referenciaClase(ctx);
  const clases = clasesUtiles(ctx);
  const alInicio = ctx.alcance === "inicio";

  switch (ctx.tipo) {
    case "reprogramacion": {
      const originales = fechasDe(clases, "fechaOriginal");
      const nuevas = fechasDe(clases, "fechaNueva");
      const varias = clases.length > 1;

      return {
        asunto: alInicio
          ? `Actualización de la fecha de inicio de tu ${programa}`
          : `Reprogramación de ${varias ? "clases" : "la clase"} de ${nombre || "tu programa"}`,
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          `Les escribimos para informar una modificación en la programación ${alInicio ? `del inicio del ${programa}` : `de las clases${clase}`}.`,
          originales
            ? `Por motivos de fuerza mayor, ${txt(ctx, "docente") || "la docente a cargo"} no podrá dictar ${varias ? "las sesiones originalmente programadas" : "la sesión originalmente programada"} para ${originales}.`
            : "",
          nuevas
            ? `Debido a lo anterior, ${varias ? "dichas sesiones serán reprogramadas" : "dicha sesión será reprogramada"} para ${nuevas}.`
            : "",
          calendario(ctx, true) ? "A continuación, les compartimos el calendario actualizado:" : "",
          calendario(ctx, true),
          zoom,
          "Queremos expresar nuestras disculpas por este ajuste. Entendemos que una modificación de fechas puede afectar su planificación personal, laboral y académica, por lo que lamentamos las molestias y agradecemos su comprensión.",
          cierre,
        ),
      };
    }

    case "cambio_docente": {
      const perfil = txt(ctx, "perfilEntrante");
      const entrante = txt(ctx, "docenteEntrante");
      return {
        asunto: `Cambio de docente en ${nombre || "tu programa"}`,
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          `Les informamos que, a partir del ${fechaLarga(ctx.datos.fechaEfectiva)}, ${alInicio ? `el ${programa}` : `las clases${clase}`} estará${alInicio ? "" : "n"} a cargo de ${entrante}, quien reemplaza a ${txt(ctx, "docenteSaliente")}.`,
          `${perfil ? `${perfil} ` : ""}La planificación, las evaluaciones y el horario se mantienen sin cambios.`,
          zoom,
          cierre,
        ),
      };
    }

    case "suspension": {
      const suspendidas = fechasDe(clases, "fechaOriginal");
      const varias = clases.length > 1;
      return {
        asunto: `Suspensión de ${varias ? "clases" : "la clase"} de ${nombre || "tu programa"}`,
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          `Les informamos que ${varias ? "las clases" : "la clase"}${clase}${suspendidas ? ` de ${suspendidas}` : ""}${horario ? `, ${horario},` : ""} ${varias ? "han sido suspendidas" : "ha sido suspendida"} por ${txt(ctx, "motivoPublico")}.`,
          calendario(ctx, false) && varias
            ? `Sesiones suspendidas:\n\n${calendario(ctx, false)}`
            : tabla,
          txt(ctx, "recuperacion"),
          "Lamentamos los inconvenientes y agradecemos su comprensión.",
          cierre,
        ),
      };
    }

    case "cambio_horario": {
      const dias = diasLargos(ctx.datos.dias);
      const nuevo = horario || "en el horario informado";
      return {
        asunto: `Nuevo horario de ${nombre || "tu programa"}`,
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          `Les informamos que, a partir del ${fechaLarga(ctx.datos.vigenciaDesde)}, ${alInicio ? `el ${programa}` : `las clases${clase}`} cambia${alInicio ? "" : "n"} de horario. Las sesiones, que se dictaban de ${txt(ctx, "horarioAnterior")}, se realizarán ${nuevo}${dias ? ` los días ${dias}` : ""}.`,
          tabla,
          `El cambio se mantiene por el resto del período y ${alInicio ? "el programa continúa" : "las clases continúan"} a cargo de ${txt(ctx, "docente")}. ${zoom}`,
          cierre,
        ),
      };
    }

    /**
     * Plantilla fija parametrizada: acá solo cambian los datos, nunca la
     * estructura ni el tono. Es una convocatoria, y conviene que todas se lean
     * exactamente igual.
     */
    case "reunion_informativa": {
      return {
        asunto: `Reunión informativa de ${nombre || "tu programa"} · ${fechaLarga(ctx.datos.fechaSesion)}`,
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          `Les invitamos a la reunión informativa de ${nombre || "el programa"}, que se realizará el ${fechaLarga(ctx.datos.fechaSesion)}${horario ? `, ${horario}` : ""}.`,
          tabla,
          "En esta sesión revisaremos la organización del programa, la modalidad de trabajo y los aspectos prácticos que necesitan conocer antes de comenzar. Habrá un espacio final para responder sus consultas.",
          zoom,
          "Les recomendamos conectarse unos minutos antes del inicio.",
          cierre,
        ),
      };
    }

    case "aviso_general": {
      const accion = txt(ctx, "accion");
      const limite = txt(ctx, "fechaLimite");
      const parrafoAccion = accion
        ? `Les solicitamos ${accion.charAt(0).toLowerCase()}${accion.slice(1)}${limite ? `, a más tardar el ${fechaLarga(limite)}` : ""}.`
        : "";
      return {
        asunto: txt(ctx, "tema") || "Información importante",
        cuerpo: parrafos(
          saludo(ctx),
          APERTURA,
          txt(ctx, "mensajeClave"),
          parrafoAccion,
          "Agradecemos su comprensión.",
          cierre,
        ),
      };
    }
  }
}
