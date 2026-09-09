import { FIRMA } from "../referencias";
import { PAISES, PROGRAMAS } from "../catalogos";
import { TIPOS } from "../tipos";
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

const txt = (ctx: ContextoComunicado, k: string) => String(ctx.datos[k] ?? "").trim();

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

export function bloqueHorarios(ctx: ContextoComunicado): string {
  const conHorario = ctx.paises.filter((p) => (ctx.horarios[p] ?? "").trim());
  if (conHorario.length < 2) return "";
  const lineas = conHorario.map((p) => `- ${PAISES[p].nombre}: ${ctx.horarios[p]}`);
  return `Horario según su país:\n${lineas.join("\n")}`;
}

/** Datos de conexión, o la indicación de que el enlace de siempre sigue válido. */
export function bloqueZoom(ctx: ContextoComunicado): string {
  // Una reunión informativa siempre tiene su propia sala: no hay "enlace de
  // siempre" al que remitir, aunque la casilla diga que se mantiene.
  const publicarDatos = TIPOS[ctx.tipo].zoomSiempre || !ctx.zoomSeMantiene;
  if (!publicarDatos) {
    return "El enlace de acceso es el mismo que utiliza habitualmente y lo encontrará disponible en su aula virtual.";
  }
  const { link, id, codigo } = ctx.zoom;
  const lineas = ["Los datos de conexión son los siguientes:"];
  if (link) lineas.push(`- Enlace: ${link}`);
  if (id) lineas.push(`- ID de reunión: ${id}`);
  if (codigo) lineas.push(`- Código de acceso: ${codigo}`);
  return lineas.length > 1 ? lineas.join("\n") : "";
}

/** "del módulo 3, Evaluación Neurocognitiva (clase 2)" o cadena vacía. */
export function referenciaClase(ctx: ContextoComunicado): string {
  const partes: string[] = [];
  const modulo = txt(ctx, "moduloNumero");
  const nombreModulo = txt(ctx, "moduloNombre");
  const clase = txt(ctx, "claseNumero");

  if (PROGRAMAS[ctx.programa].pideModulo && modulo) {
    partes.push(nombreModulo ? `módulo ${modulo}, ${nombreModulo}` : `módulo ${modulo}`);
  }
  if (clase && !(ctx.programa === "curso" && ctx.alcance === "inicio")) {
    partes.push(`clase ${clase}`);
  }
  return partes.length > 0 ? ` (${partes.join(" · ")})` : "";
}

const parrafos = (...bloques: string[]) => bloques.filter((b) => b.trim()).join("\n\n");

/**
 * Borrador base a partir de los datos del formulario.
 * Es determinista y no pasa por la capa de IA: sirve como punto de partida
 * y como salida de respaldo si la redacción asistida falla.
 *
 * El campo `motivo` nunca entra acá: es contexto interno.
 */
export function plantilla(ctx: ContextoComunicado): SalidaIA {
  const cierre = `Quedamos atentos a cualquier consulta a través de este mismo correo.\n\n${FIRMA}`;
  const saludo = "Estimado/a estudiante:";
  const horario = horarioEnLinea(ctx);
  const tabla = bloqueHorarios(ctx);
  const zoom = bloqueZoom(ctx);
  const clase = referenciaClase(ctx);

  switch (ctx.tipo) {
    case "reprogramacion": {
      const asig = txt(ctx, "asignatura") || "la asignatura";
      return {
        asunto: `Reprogramación de la clase de ${asig} del ${fechaLarga(ctx.datos.fechaOriginal)}`,
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le informamos que la clase de ${asig}${clase}, programada para el ${fechaLarga(ctx.datos.fechaOriginal)}, ha sido reprogramada para el ${fechaLarga(ctx.datos.fechaNueva)}${horario ? `, ${horario}` : ""}.`,
          tabla,
          `La sesión se mantiene a cargo de ${txt(ctx, "docente")}. ${zoom}`,
          `Agradecemos su comprensión. ${cierre}`,
        ),
      };
    }

    case "cambio_docente": {
      const asig = txt(ctx, "asignatura") || "la asignatura";
      const perfil = txt(ctx, "perfilEntrante");
      const entrante = txt(ctx, "docenteEntrante");
      return {
        asunto: `Cambio de docente en la asignatura ${asig}`,
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le informamos que a partir del ${fechaLarga(ctx.datos.fechaEfectiva)} la asignatura ${asig}${clase} será dictada por ${entrante}, quien reemplaza a ${txt(ctx, "docenteSaliente")}.`,
          `${perfil ? `${perfil} ` : ""}La planificación, las evaluaciones y el horario de la asignatura se mantienen sin cambios.`,
          zoom,
          cierre,
        ),
      };
    }

    case "suspension": {
      const asig = txt(ctx, "asignatura") || "la asignatura";
      return {
        asunto: `Suspensión de la clase de ${asig} del ${fechaLarga(ctx.datos.fecha)}`,
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le informamos que la clase de ${asig}${clase} del ${fechaLarga(ctx.datos.fecha)}${horario ? `, ${horario}` : ""}, ha sido suspendida por ${txt(ctx, "motivoPublico")}.`,
          tabla,
          txt(ctx, "recuperacion"),
          `Lamentamos los inconvenientes y agradecemos su comprensión.`,
          cierre,
        ),
      };
    }

    case "cambio_horario": {
      const asig = txt(ctx, "asignatura") || "la asignatura";
      const dias = diasLargos(ctx.datos.dias);
      const nuevo = horario || "en el horario informado";
      return {
        asunto: `Nuevo horario de la asignatura ${asig}`,
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le informamos que a partir del ${fechaLarga(ctx.datos.vigenciaDesde)} la asignatura ${asig}${clase} cambia su horario. Las sesiones, que se dictaban de ${txt(ctx, "horarioAnterior")}, se realizarán ${nuevo}${dias ? ` los días ${dias}` : ""}.`,
          tabla,
          `El cambio se mantiene por el resto del período y la asignatura continúa a cargo de ${txt(ctx, "docente")}. ${zoom}`,
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
      const programa = txt(ctx, "nombrePrograma") || "el programa";
      return {
        asunto: `Reunión informativa de ${programa} · ${fechaLarga(ctx.datos.fechaSesion)}`,
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le invitamos a la reunión informativa de ${programa}, que se realizará el ${fechaLarga(ctx.datos.fechaSesion)}${horario ? `, ${horario}` : ""}.`,
          tabla,
          "En esta sesión revisaremos la organización del programa, la modalidad de trabajo y los aspectos prácticos que necesita conocer antes de comenzar. Habrá un espacio final para responder sus consultas.",
          zoom,
          `Le recomendamos conectarse unos minutos antes del inicio. ${cierre}`,
        ),
      };
    }

    case "aviso_general": {
      const accion = txt(ctx, "accion");
      const limite = txt(ctx, "fechaLimite");
      const parrafoAccion = accion
        ? `Le solicitamos ${accion.charAt(0).toLowerCase()}${accion.slice(1)}${limite ? `, a más tardar el ${fechaLarga(limite)}` : ""}.`
        : "";
      return {
        asunto: txt(ctx, "tema") || "Aviso importante",
        cuerpo: parrafos(
          saludo,
          `Junto con saludar, le informamos lo siguiente sobre ${txt(ctx, "tema").toLowerCase()}.`,
          txt(ctx, "mensajeClave"),
          parrafoAccion,
          "Agradecemos su comprensión.",
          cierre,
        ),
      };
    }
  }
}
