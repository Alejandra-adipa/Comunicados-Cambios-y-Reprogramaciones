import { NextResponse } from "next/server";
import { borrar, guardar } from "@/lib/store";
import { cargar } from "@/lib/api";
import type { Solicitud } from "@/lib/modelo";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;
  return NextResponse.json(s);
}

/**
 * ¿El disco tiene una validación más avanzada que la que trae el cliente?
 *
 * La coordinadora autoguarda mientras trabaja; si el validador aprueba desde su
 * link en ese mismo rato, un autoguardado con datos viejos borraría la
 * aprobación. Cuando eso pasa, se conserva la validación del disco y se acepta
 * el resto del parche.
 */
function validacionMasNueva(guardada: Solicitud, entrante: Partial<Solicitud>): boolean {
  if (!entrante.historial) return false;

  // El cliente abre una vuelta nueva: eso es una acción deliberada, no un
  // autoguardado con datos viejos.
  if (entrante.historial.length > guardada.historial.length) return false;
  if (guardada.historial.length > entrante.historial.length) return true;

  // Misma cantidad de vueltas: manda el disco si allí ya hay una respuesta que
  // el parche todavía no conoce.
  const ultimaGuardada = guardada.historial[guardada.historial.length - 1];
  const ultimaEntrante = entrante.historial[entrante.historial.length - 1];
  return !!ultimaGuardada?.respuesta && !ultimaEntrante?.respuesta;
}

/** Actualización parcial: el cliente manda solo los campos que cambió. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s: actual, error } = await cargar(id);
  if (error) return error;

  const parche = (await req.json().catch(() => ({}))) as Partial<Solicitud>;
  // El id y la fecha de creación no se tocan por esta vía.
  const { id: _i, creada: _c, ...resto } = parche;

  const conflicto = validacionMasNueva(actual, parche);
  if (conflicto) {
    delete resto.estado;
    delete resto.historial;
  }

  const siguiente = { ...actual, ...resto } as Solicitud;

  if (siguiente.envio.enviado && !actual.envio.enviado && siguiente.estado !== "aprobado") {
    return NextResponse.json(
      { error: "No se puede marcar como enviado sin una aprobación válida." },
      { status: 409 },
    );
  }

  const guardada = await guardar(siguiente);
  return NextResponse.json(guardada, conflicto ? { headers: { "X-Validacion-Externa": "1" } } : undefined);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await borrar(id);
  return new NextResponse(null, { status: 204 });
}
