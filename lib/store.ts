import { randomUUID } from "node:crypto";
import type { Solicitud } from "./modelo";
import { solicitudNueva } from "./modelo";
import type { TipoKey } from "./tipos";
import type { ProgramaKey } from "./catalogos";
import { almacenArchivos } from "./almacen/archivos";
import { almacenMemoria } from "./almacen/memoria";
import type { Almacen } from "./almacen/tipos";

export { ArchivoDaniado } from "./almacen/tipos";

/**
 * Elección del almacén.
 *
 * En el equipo se guarda en archivos JSON. En un despliegue sin disco donde
 * escribir —Vercel y similares— se usa el almacén de demostración en memoria:
 * intentar escribir en el sistema de archivos ahí devuelve un error de servidor
 * en la primera pantalla.
 *
 * `ALMACEN=memoria` o `ALMACEN=archivos` fuerza uno u otro, útil para probar en
 * el equipo cómo se ve el despliegue.
 */
function elegirAlmacen(): Almacen {
  const forzado = (process.env.ALMACEN ?? "").toLowerCase();
  if (forzado === "memoria") return almacenMemoria;
  if (forzado === "archivos") return almacenArchivos;
  return process.env.VERCEL ? almacenMemoria : almacenArchivos;
}

const almacen = elegirAlmacen();

/** Para avisar en pantalla cuando los datos no sobreviven al reinicio. */
export function esDemostracion(): boolean {
  return almacen.efimero;
}

export function listar(): Promise<Solicitud[]> {
  return almacen.listar();
}

export function leer(id: string): Promise<Solicitud | null> {
  return almacen.leer(id);
}

export function guardar(s: Solicitud): Promise<Solicitud> {
  return almacen.guardar(s);
}

export function borrar(id: string): Promise<void> {
  return almacen.borrar(id);
}

export function crear(tipo: TipoKey, programa: ProgramaKey): Promise<Solicitud> {
  return guardar(solicitudNueva(randomUUID(), tipo, programa));
}
