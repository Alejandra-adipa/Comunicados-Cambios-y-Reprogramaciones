import ExcelJS from "exceljs";
import type { Contacto } from "./modelo";
import type { PaisKey } from "./catalogos";

/**
 * Lectura de las bases de contacto exportadas desde el aula virtual.
 *
 * El listado de participantes del aula virtual trae "Nombre", "Apellido(s)",
 * "Dirección de correo" y "Grupos". Los encabezados se detectan por alias
 * para tolerar que otra aula exporte con nombres distintos.
 */

const ALIAS: Record<keyof Omit<Contacto, "id" | "origen" | "paises">, string[]> = {
  nombre: ["nombre", "nombres", "first name", "firstname", "given name"],
  apellidos: ["apellido", "apellidos", "apellido(s)", "last name", "lastname", "surname"],
  correo: ["direccion de correo", "dirección de correo", "correo", "correo electronico", "correo electrónico", "email", "e-mail", "mail"],
  grupos: ["grupos", "grupo", "groups", "group", "seccion", "sección"],
  // El export actual de participantes no la trae; cuando exista, el filtro por
  // rol empieza a operar solo. Ver `motivoPorRol` en `destinatarios.ts`.
  rol: ["rol", "roles", "perfil", "cargo", "tipo de usuario", "categoria", "categoría", "role"],
};

const normalizar = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function mapearEncabezados(fila: unknown[]): Partial<Record<keyof typeof ALIAS, number>> {
  const mapa: Partial<Record<keyof typeof ALIAS, number>> = {};
  fila.forEach((celda, i) => {
    const v = normalizar(celda);
    if (!v) return;
    for (const [campo, alias] of Object.entries(ALIAS) as [keyof typeof ALIAS, string[]][]) {
      if (mapa[campo] !== undefined) continue;
      if (alias.some((a) => v === normalizar(a) || v.includes(normalizar(a)))) {
        mapa[campo] = i;
      }
    }
  });
  return mapa;
}

const textoCelda = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text.trim();
    if ("hyperlink" in v && typeof v.hyperlink === "string") return v.hyperlink.replace(/^mailto:/i, "").trim();
    if ("richText" in v && Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("").trim();
    if ("result" in v) return String(v.result ?? "").trim();
  }
  return String(v).trim();
};

export class ErrorLectura extends Error {}

/**
 * Lee un .xlsx o .csv y devuelve sus participantes.
 *
 * Los países no vienen en el archivo: los indica quien lo sube. Un mismo
 * listado puede servir a varios países, o a todos.
 */
export async function leerBase(
  buffer: ArrayBuffer,
  nombreArchivo: string,
  paises: PaisKey[],
): Promise<Contacto[]> {
  const wb = new ExcelJS.Workbook();
  try {
    if (nombreArchivo.toLowerCase().endsWith(".csv")) {
      const { Readable } = await import("node:stream");
      await wb.csv.read(Readable.from(Buffer.from(buffer)));
    } else {
      await wb.xlsx.load(buffer);
    }
  } catch {
    throw new ErrorLectura(`No se pudo abrir ${nombreArchivo}. ¿Es un .xlsx o .csv válido?`);
  }

  const hoja = wb.worksheets[0];
  if (!hoja) throw new ErrorLectura(`${nombreArchivo} no tiene hojas de cálculo.`);

  const filas: string[][] = [];
  hoja.eachRow({ includeEmpty: false }, (fila) => {
    const valores = fila.values as ExcelJS.CellValue[];
    // `fila.values` es 1-indexado: la posición 0 viene vacía.
    filas.push(valores.slice(1).map(textoCelda));
  });
  if (filas.length < 2) throw new ErrorLectura(`${nombreArchivo} no tiene filas de datos.`);

  const mapa = mapearEncabezados(filas[0]);
  if (mapa.correo === undefined) {
    throw new ErrorLectura(
      `No encontré la columna de correo en ${nombreArchivo}. ` +
        `La primera fila debe tener un encabezado como "Dirección de correo".`,
    );
  }

  const en = (f: string[], i?: number) => (i === undefined ? "" : (f[i] ?? "").trim());

  return filas
    .slice(1)
    .map((f, idx) => ({
      id: `${nombreArchivo}#${idx}`,
      nombre: en(f, mapa.nombre),
      apellidos: en(f, mapa.apellidos),
      correo: en(f, mapa.correo),
      grupos: en(f, mapa.grupos),
      rol: en(f, mapa.rol),
      paises,
      origen: nombreArchivo,
    }))
    .filter((c) => c.correo || c.nombre);
}

