import { NextResponse } from "next/server";
import { crear, CreacionNoDisponible, listar } from "@/lib/store";
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

  try {
    return NextResponse.json(await crear(tipo, programa), { status: 201 });
  } catch (e) {
    // El almacén de demostración no puede sostener una solicitud nueva; se dice
    // con todas sus letras en vez de dejar una pantalla rota más adelante.
    if (e instanceof CreacionNoDisponible) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }
}
