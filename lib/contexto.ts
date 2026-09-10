import type { Solicitud } from "./modelo";
import type { ContextoComunicado } from "./ia/provider";

/**
 * Recorta la solicitud a lo que influye en el texto.
 *
 * Contactos, archivos e historial no cambian una sola palabra del comunicado y
 * pesan mucho: mandarlos a la ruta de redacción sería enviar la base completa
 * de estudiantes en cada tecla.
 */
export function contextoDe(s: Solicitud): ContextoComunicado {
  return {
    tipo: s.tipo,
    programa: s.programa,
    alcance: s.alcance,
    clases: s.clases,
    paises: s.paises,
    horarios: s.horarios,
    datos: s.datos,
    zoomSeMantiene: s.zoomSeMantiene,
    zoom: s.zoom,
  };
}
