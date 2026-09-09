import type { Solicitud } from "../modelo";

/**
 * Contrato del almacenamiento.
 *
 * Existe para que la aplicación no sepa dónde viven las solicitudes. En el
 * equipo son archivos JSON; en el despliegue de prueba viven en memoria con
 * datos ficticios. Ninguna pantalla ni ruta cambia entre uno y otro.
 */
export interface Almacen {
  /** Cómo llamar a este almacén en pantalla. */
  readonly nombre: string;
  /** `true` cuando los datos son de demostración y no sobreviven al reinicio. */
  readonly efimero: boolean;

  listar(): Promise<Solicitud[]>;
  leer(id: string): Promise<Solicitud | null>;
  guardar(s: Solicitud): Promise<Solicitud>;
  borrar(id: string): Promise<void>;
}

/** Se distingue de "no existe" para no reportar un archivo dañado como faltante. */
export class ArchivoDaniado extends Error {}

/** Evita que un id de la URL escape del almacén. */
export function idValido(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}
