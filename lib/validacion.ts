import type { Solicitud } from "./modelo";
import { VALIDADORES, type Validador } from "./catalogos";

/**
 * Quién firma un comunicado.
 *
 * Siempre firma una sola persona. Marcar un caso como sensible no agrega una
 * segunda firma: cambia de quién es. Nicole reemplaza al validador habitual,
 * no se suma a él.
 */
export function validadorDe(s: Solicitud): Validador {
  if (s.sensible) return VALIDADORES.nicole;

  switch (s.programa) {
    case "curso":
      return VALIDADORES.daniel;
    case "acreditacion":
      return VALIDADORES.nicole;
    case "diplomado":
    case "postitulo":
      return VALIDADORES.edwin;
  }
}

/** Por qué le toca a esa persona, para mostrarlo en pantalla. */
export function razonValidador(s: Solicitud): string {
  if (s.sensible) return "Caso sensible: la validación pasa a jefatura superior.";
  switch (s.programa) {
    case "curso":
      return "Los cursos los valida su responsable habitual.";
    case "acreditacion":
      return "Las acreditaciones las valida su responsable habitual.";
    case "diplomado":
    case "postitulo":
      return "Los diplomados y postítulos los valida su responsable habitual.";
  }
}

/** Mensaje listo para pegar en Slack o correo junto con el link de revisión. */
export function mensajeRevision(s: Solicitud, url: string): string {
  const v = validadorDe(s);
  const sensible = s.sensible ? "\n\nEste caso está marcado como sensible." : "";
  return `Hola ${v.nombre.split(" ")[0]}, ¿puedes revisar este comunicado antes de que lo envíe?

Asunto: ${s.asunto}

Puedes aprobarlo o dejar observaciones acá:
${url}${sensible}`;
}
