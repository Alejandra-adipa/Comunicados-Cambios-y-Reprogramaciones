import { NextResponse } from "next/server";
import { guardar } from "@/lib/store";
import { cargar } from "@/lib/api";
import { validadorDe } from "@/lib/validacion";
import type { Iteracion } from "@/lib/modelo";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Respuesta del validador desde su link de revisión.
 *
 * Es una ruta acotada a propósito: solo toca `estado` e `historial`. Así, aunque
 * la coordinadora tenga el asistente abierto y autoguardando, la aprobación no
 * puede quedar pisada por el resto del formulario.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const accion = body.accion;
  const comentario = typeof body.comentario === "string" ? body.comentario.trim() : "";

  if (accion !== "aprobado" && accion !== "observaciones") {
    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  }
  if (accion === "observaciones" && !comentario) {
    return NextResponse.json(
      { error: "Para solicitar cambios hay que escribir la observación." },
      { status: 400 },
    );
  }

  const abierta = s.historial[s.historial.length - 1];
  if (!abierta || abierta.respuesta) {
    return NextResponse.json(
      { error: "Este comunicado no está esperando respuesta en este momento." },
      { status: 409 },
    );
  }

  const cerrada: Iteracion = {
    ...abierta,
    respondido: new Date().toISOString(),
    respuesta: accion,
    comentario: comentario || undefined,
    validador: abierta.validador || validadorDe(s).nombre,
  };

  const guardada = await guardar({
    ...s,
    estado: accion === "aprobado" ? "aprobado" : "observado",
    historial: [...s.historial.slice(0, -1), cerrada],
  });

  return NextResponse.json(guardada);
}
