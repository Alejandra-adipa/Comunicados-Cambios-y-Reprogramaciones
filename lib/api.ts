import { NextResponse } from "next/server";
import { ArchivoDaniado, leer } from "./store";
import type { Solicitud } from "./modelo";

/**
 * Carga una solicitud para una ruta de API.
 *
 * Devuelve la solicitud, o la respuesta de error que corresponda. Un archivo
 * ilegible no es lo mismo que uno inexistente: decir "No encontrada" cuando el
 * archivo está dañado manda a buscar en el lugar equivocado.
 */
export async function cargar(
  id: string,
): Promise<{ s: Solicitud; error?: never } | { s?: never; error: NextResponse }> {
  try {
    const s = await leer(id);
    if (!s) {
      return { error: NextResponse.json({ error: "No encontrada" }, { status: 404 }) };
    }
    return { s };
  } catch (e) {
    if (e instanceof ArchivoDaniado) {
      return { error: NextResponse.json({ error: e.message }, { status: 500 }) };
    }
    throw e;
  }
}
