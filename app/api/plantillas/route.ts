import { NextResponse } from "next/server";
import { agregarPlantilla, borrarPlantilla, listarPlantillas } from "@/lib/store";
import { esTipoValido } from "@/lib/tipos";

/** Biblioteca de plantillas propias del equipo. */

export async function GET() {
  return NextResponse.json(await listarPlantillas());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const cuerpo = typeof body.cuerpo === "string" ? body.cuerpo : "";

  if (!nombre) {
    return NextResponse.json({ error: "La plantilla necesita un nombre." }, { status: 400 });
  }
  if (!cuerpo.trim()) {
    return NextResponse.json({ error: "La plantilla no puede ir vacía." }, { status: 400 });
  }

  const tipo = typeof body.tipo === "string" && esTipoValido(body.tipo) ? body.tipo : ("" as const);
  const asunto = typeof body.asunto === "string" ? body.asunto : "";

  return NextResponse.json(await agregarPlantilla({ nombre, tipo, asunto, cuerpo }), {
    status: 201,
  });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta la plantilla." }, { status: 400 });
  return NextResponse.json(await borrarPlantilla(id));
}
