import type { Solicitud } from "../modelo";
import { idValido, type Almacen } from "./tipos";
import { solicitudesDemo } from "./demo";

/**
 * Almacén de demostración, en memoria.
 *
 * Para el despliegue de prueba, donde el sistema de archivos es de solo lectura.
 * Arranca con solicitudes inventadas y acepta cambios como cualquier otro
 * almacén, así que el recorrido completo se puede probar de punta a punta.
 *
 * Lo que **no** hace es conservar nada: cuando el servidor recicla el proceso,
 * vuelve al estado inicial. Por eso `efimero` es `true` y la interfaz lo avisa.
 * Para trabajo real está el almacén de archivos.
 */

let solicitudes: Map<string, Solicitud> | null = null;

function datos(): Map<string, Solicitud> {
  if (!solicitudes) {
    solicitudes = new Map(solicitudesDemo().map((s) => [s.id, s]));
  }
  return solicitudes;
}

/** Se entrega una copia para que nadie modifique el almacén por referencia. */
const copia = (s: Solicitud): Solicitud => structuredClone(s);

export const almacenMemoria: Almacen = {
  nombre: "Datos de demostración",
  efimero: true,
  // Cada instancia del servidor tiene su propia memoria: una solicitud creada
  // acá no existiría para la petición siguiente.
  puedeCrear: false,

  async listar() {
    return [...datos().values()]
      .map(copia)
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));
  },

  async leer(id) {
    if (!idValido(id)) return null;
    const s = datos().get(id);
    return s ? copia(s) : null;
  },

  async guardar(s) {
    const actualizada = { ...copia(s), actualizada: new Date().toISOString() };
    datos().set(s.id, actualizada);
    return copia(actualizada);
  },

  async borrar(id) {
    datos().delete(id);
  },
};
