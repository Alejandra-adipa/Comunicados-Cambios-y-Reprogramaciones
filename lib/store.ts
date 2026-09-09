import { randomUUID } from "node:crypto";
import type { Solicitud } from "./modelo";
import { solicitudNueva } from "./modelo";
import type { TipoKey } from "./tipos";
import type { ProgramaKey } from "./catalogos";
import { almacenArchivos } from "./almacen/archivos";
import { almacenMemoria } from "./almacen/memoria";
import { almacenBlob } from "./almacen/blob";
import type { Almacen } from "./almacen/tipos";

export { ArchivoDaniado } from "./almacen/tipos";

/**
 * Elección del almacén, de más capaz a menos.
 *
 * 1. En el equipo, archivos JSON: es el almacén de trabajo real.
 * 2. En el despliegue con Vercel Blob conectado, un almacén compartido: todas
 *    las instancias del servidor ven lo mismo, así que crear y editar funciona.
 * 3. En el despliegue sin Blob, datos de demostración en memoria: sirve para
 *    mirar el recorrido, pero no para crear comunicados nuevos, porque lo que
 *    guarda una instancia no existe para la siguiente.
 *
 * `ALMACEN=memoria`, `blob` o `archivos` fuerza uno, útil para probar en el
 * equipo cómo se comporta el despliegue.
 */
function elegirAlmacen(): Almacen {
  switch ((process.env.ALMACEN ?? "").toLowerCase()) {
    case "memoria":
      return almacenMemoria;
    case "blob":
      return almacenBlob;
    case "archivos":
      return almacenArchivos;
  }

  if (!process.env.VERCEL) return almacenArchivos;
  return process.env.BLOB_READ_WRITE_TOKEN ? almacenBlob : almacenMemoria;
}

const almacen = elegirAlmacen();

/** Estado del almacén, para lo que la interfaz necesita advertir. */
export function estadoAlmacen(): { demostracion: boolean; efimero: boolean; puedeCrear: boolean } {
  return {
    // Todo lo que no sean los archivos del equipo es espacio de prueba.
    demostracion: almacen !== almacenArchivos,
    efimero: almacen.efimero,
    puedeCrear: almacen.puedeCrear,
  };
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

export class CreacionNoDisponible extends Error {}

export function crear(tipo: TipoKey, programa: ProgramaKey): Promise<Solicitud> {
  if (!almacen.puedeCrear) {
    throw new CreacionNoDisponible(
      "Este espacio de prueba solo permite mirar los comunicados de ejemplo. " +
        "Para crear comunicados nuevos hace falta conectar un almacenamiento compartido.",
    );
  }
  return guardar(solicitudNueva(randomUUID(), tipo, programa));
}
