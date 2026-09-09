import { NextResponse } from "next/server";
import { crear, listar } from "@/lib/store";
import { esTipoValido } from "@/lib/tipos";
import { esPrograma } from "@/lib/catalogos";

export async function GET() {
  return NextResponse.json(await listar());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const tipo = typeof body.tipo === "string" && esTipoValido(body.tipo) ? body.tipo : "reprogramacion";
  const programa =
    typeof body.programa === "string" && esPrograma(body.programa) ? body.programa : "curso";

  return NextResponse.json(await crear(tipo, programa), { status: 201 });
}
