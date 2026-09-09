import { del, get, list, put } from "@vercel/blob";
import type { Solicitud } from "../modelo";
import { normalizar } from "../modelo";
import { idValido, type Almacen } from "./tipos";
import { solicitudesDemo } from "./demo";

/**
 * Almacén compartido sobre Vercel Blob.
 *
 * Es el que hace utilizable el despliegue de prueba. En un servidor sin estado
 * cada petición puede atenderla una instancia distinta, así que guardar en
 * memoria hace que un comunicado recién creado no exista para la petición
 * siguiente. Acá el dato vive fuera del proceso y todas las instancias ven lo
 * mismo.
 *
 * Se activa solo si existe `BLOB_READ_WRITE_TOKEN`, que Vercel inyecta al
 * conectar un store de Blob al proyecto.
 *
 * Los archivos se guardan como privados: no se pueden leer por dirección
 * directa, solo desde la aplicación. Aun así, este almacén es para el espacio de
 * prueba con datos inventados; los correos de estudiantes se quedan en el equipo.
 */

const PREFIJO = "solicitudes/";
const ruta = (id: string) => `${PREFIJO}${id}.json`;

/** `useCache: false` porque la aplicación escribe y vuelve a leer de inmediato. */
async function descargar(pathname: string): Promise<Solicitud | null> {
  try {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return normalizar(await new Response(res.stream).json());
  } catch {
    return null;
  }
}

async function escribir(s: Solicitud): Promise<void> {
  await put(ruta(s.id), JSON.stringify(s, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/**
 * La primera vez que se usa un store vacío se cargan los comunicados de
 * ejemplo, para que el espacio de prueba no arranque en blanco.
 */
let sembrando: Promise<void> | null = null;

function asegurarSemilla(): Promise<void> {
  if (!sembrando) {
    sembrando = (async () => {
      const { blobs } = await list({ prefix: PREFIJO, limit: 1 });
      if (blobs.length > 0) return;
      await Promise.all(solicitudesDemo().map(escribir));
    })().catch(() => {
      // Si la siembra falla, se reintenta en la petición siguiente.
      sembrando = null;
    });
  }
  return sembrando;
}

export const almacenBlob: Almacen = {
  nombre: "Espacio de prueba compartido",
  efimero: false,
  puedeCrear: true,

  async listar() {
    await asegurarSemilla();
    const { blobs } = await list({ prefix: PREFIJO });
    const todas = await Promise.all(blobs.map((b) => descargar(b.pathname)));
    return todas
      .filter((s): s is Solicitud => s !== null)
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));
  },

  async leer(id) {
    if (!idValido(id)) return null;
    await asegurarSemilla();
    return descargar(ruta(id));
  },

  async guardar(s) {
    const actualizada = { ...s, actualizada: new Date().toISOString() };
    await escribir(actualizada);
    return actualizada;
  },

  async borrar(id) {
    if (!idValido(id)) return;
    await del(ruta(id)).catch(() => {});
  },
};
