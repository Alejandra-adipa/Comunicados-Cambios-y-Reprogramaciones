import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { guardar } from "@/lib/store";
import { cargar } from "@/lib/api";
import { ErrorLectura, leerBase } from "@/lib/contactos";
import { esPais, type PaisKey } from "@/lib/catalogos";
import type { ArchivoBase, Contacto } from "@/lib/modelo";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Carga uno o varios listados y los consolida en la solicitud.
 *
 * Cada carga se asigna a uno o varios países: un mismo listado puede servir a
 * más de uno, o a todos. Hoy los archivos llegan a mano; el día que exista
 * conexión directa con el aula virtual, esta ruta cambia de origen sin cambiar
 * de forma.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;

  const form = await req.formData();
  const paises = form
    .getAll("paises")
    .map(String)
    .filter((p): p is PaisKey => esPais(p));
  if (paises.length === 0) {
    return NextResponse.json(
      { error: "Indica al menos un país para este listado." },
      { status: 400 },
    );
  }

  const archivos = form.getAll("archivos").filter((f): f is File => f instanceof File);
  if (archivos.length === 0) {
    return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });
  }

  const nuevosContactos: Contacto[] = [];
  const nuevosArchivos: ArchivoBase[] = [];
  const errores: string[] = [];

  for (const f of archivos) {
    if (f.size > MAX_BYTES) {
      errores.push(`${f.name} supera los 10 MB.`);
      continue;
    }
    try {
      const filas = await leerBase(await f.arrayBuffer(), f.name, paises);
      const idArchivo = randomUUID();
      nuevosContactos.push(...filas.map((c) => ({ ...c, id: `${idArchivo}:${c.id}` })));
      nuevosArchivos.push({
        id: idArchivo,
        nombre: f.name,
        paises,
        filas: filas.length,
        cargado: new Date().toISOString(),
      });
    } catch (e) {
      errores.push(e instanceof ErrorLectura ? e.message : `No se pudo leer ${f.name}.`);
    }
  }

  const actualizada = await guardar({
    ...s,
    archivos: [...s.archivos, ...nuevosArchivos],
    contactos: [...s.contactos, ...nuevosContactos],
  });

  return NextResponse.json({ solicitud: actualizada, errores });
}

/** Quita un archivo cargado junto con sus contactos. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;

  const idArchivo = new URL(req.url).searchParams.get("archivo");
  if (!idArchivo) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });

  return NextResponse.json(
    await guardar({
      ...s,
      archivos: s.archivos.filter((a) => a.id !== idArchivo),
      contactos: s.contactos.filter((c) => !c.id.startsWith(`${idArchivo}:`)),
    }),
  );
}
