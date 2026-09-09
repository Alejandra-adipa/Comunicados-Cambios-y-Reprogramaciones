import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Solicitud } from "../modelo";
import { normalizar } from "../modelo";
import { ArchivoDaniado, idValido, type Almacen } from "./tipos";

/**
 * Un archivo JSON por solicitud en `data/solicitudes/`.
 *
 * Es el almacén del equipo: legible a ojo, fácil de respaldar o borrar a mano.
 * Necesita un disco donde escribir, así que no sirve en un despliegue con
 * sistema de archivos de solo lectura.
 */

const DIR = path.join(process.cwd(), "data", "solicitudes");

async function asegurarDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function rutaDe(id: string): string {
  if (!idValido(id)) throw new Error("Identificador inválido");
  return path.join(DIR, `${id}.json`);
}

/**
 * Cola de escritura por solicitud.
 *
 * El asistente autoguarda mientras se trabaja y la carga de bases escribe por su
 * cuenta. Sin esta cola, dos escrituras pueden solaparse y dejar el archivo a
 * medias: fue exactamente lo que corrompió una solicitud. Cada id se escribe de
 * a una, en orden.
 */
const colas = new Map<string, Promise<unknown>>();

function enCola<T>(id: string, tarea: () => Promise<T>): Promise<T> {
  const anterior = colas.get(id) ?? Promise.resolve();
  const siguiente = anterior.then(tarea, tarea);
  // La cola solo encadena; los errores los recibe quien llamó.
  colas.set(
    id,
    siguiente.catch(() => {}),
  );
  return siguiente;
}

async function leerArchivo(ruta: string): Promise<Solicitud | null> {
  let crudo: string;
  try {
    crudo = await fs.readFile(ruta, "utf8");
  } catch {
    return null; // No existe.
  }
  try {
    return normalizar(JSON.parse(crudo));
  } catch {
    // Existe pero no parsea. Antes de rendirse, se intenta el respaldo.
    try {
      return normalizar(JSON.parse(await fs.readFile(`${ruta}.bak`, "utf8")));
    } catch {
      throw new ArchivoDaniado(`El archivo ${path.basename(ruta)} está dañado y no se pudo leer.`);
    }
  }
}

export const almacenArchivos: Almacen = {
  nombre: "Archivos locales",
  efimero: false,
  puedeCrear: true,

  async listar() {
    await asegurarDir();
    const archivos = (await fs.readdir(DIR)).filter((f) => f.endsWith(".json"));
    const todas = await Promise.all(
      archivos.map(async (f) => {
        try {
          return await leerArchivo(path.join(DIR, f));
        } catch {
          // Un archivo dañado no puede dejar la lista completa sin cargar.
          return null;
        }
      }),
    );
    return todas
      .filter((s): s is Solicitud => s !== null)
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));
  },

  async leer(id) {
    await asegurarDir();
    return leerArchivo(rutaDe(id));
  },

  async guardar(s) {
    await asegurarDir();
    const ruta = rutaDe(s.id);
    const actualizada = { ...s, actualizada: new Date().toISOString() };

    await enCola(s.id, async () => {
      const contenido = JSON.stringify(actualizada, null, 2);
      const temporal = `${ruta}.${randomUUID().slice(0, 8)}.tmp`;

      // Se escribe aparte y se mueve encima: `rename` es atómico dentro del
      // mismo volumen, así que el archivo definitivo nunca queda a medias.
      await fs.writeFile(temporal, contenido, "utf8");
      try {
        await fs.copyFile(ruta, `${ruta}.bak`).catch(() => {});
        await fs.rename(temporal, ruta);
      } catch (e) {
        await fs.rm(temporal, { force: true });
        throw e;
      }
    });

    return actualizada;
  },

  async borrar(id) {
    await asegurarDir();
    const ruta = rutaDe(id);
    await enCola(id, async () => {
      await fs.rm(ruta, { force: true });
      await fs.rm(`${ruta}.bak`, { force: true });
    });
  },
};
