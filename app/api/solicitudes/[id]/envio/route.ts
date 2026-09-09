import { NextResponse } from "next/server";
import { guardar } from "@/lib/store";
import { cargar } from "@/lib/api";
import { destinatarios } from "@/lib/destinatarios";
import { puedeEnviar } from "@/lib/modelo";
import { obtenerProveedorEnvio } from "@/lib/envio/provider";

type Ctx = { params: Promise<{ id: string }> };

/** Ejecuta el envío a través del proveedor configurado. Hoy, el simulado. */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;

  if (!puedeEnviar(s)) {
    return NextResponse.json(
      {
        error: s.envio.enviado
          ? "Este comunicado ya fue enviado."
          : "No se puede enviar sin una aprobación válida.",
      },
      { status: 409 },
    );
  }

  const lista = destinatarios(s).map((c) => c.correo);
  if (lista.length === 0) {
    return NextResponse.json({ error: "No hay destinatarios en la lista final." }, { status: 409 });
  }

  const proveedor = obtenerProveedorEnvio();
  const resultado = await proveedor.enviar(s, lista);

  const guardada = await guardar({
    ...s,
    envio: { enviado: true, fecha: resultado.fecha, total: resultado.enviados },
  });

  return NextResponse.json({ solicitud: guardada, resultado });
}
