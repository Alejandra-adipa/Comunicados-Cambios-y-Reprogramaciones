import { NextResponse } from "next/server";
import { obtenerProveedor } from "@/lib/ia";
import type { ContextoComunicado } from "@/lib/ia/provider";
import { REFERENCIAS } from "@/lib/referencias";
import { esTipoValido } from "@/lib/tipos";
import { esPais, esPrograma, PAIS_KEYS, type PaisKey } from "@/lib/catalogos";

/**
 * Redacción asistida. Devuelve el texto como stream para que el editor lo
 * pinte a medida que llega, igual que frente a un modelo real.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const crudo = (body.ctx ?? {}) as Record<string, unknown>;

  const tipo = crudo.tipo;
  const programa = crudo.programa;
  if (typeof tipo !== "string" || !esTipoValido(tipo)) {
    return NextResponse.json({ error: "Tipo de comunicado inválido." }, { status: 400 });
  }
  if (typeof programa !== "string" || !esPrograma(programa)) {
    return NextResponse.json({ error: "Tipo de programa inválido." }, { status: 400 });
  }

  const paises = Array.isArray(crudo.paises)
    ? crudo.paises.filter((p): p is PaisKey => typeof p === "string" && esPais(p))
    : [];

  const horariosCrudos = (crudo.horarios ?? {}) as Record<string, unknown>;
  const horarios: Partial<Record<PaisKey, string>> = {};
  for (const p of PAIS_KEYS) {
    if (typeof horariosCrudos[p] === "string") horarios[p] = horariosCrudos[p];
  }

  const zoom = (crudo.zoom ?? {}) as Record<string, unknown>;

  const ctx: ContextoComunicado = {
    tipo,
    programa,
    alcance: crudo.alcance === "inicio" ? "inicio" : "clase",
    paises: paises.length > 0 ? paises : ["cl"],
    horarios,
    datos: (crudo.datos ?? {}) as Record<string, string | string[]>,
    zoomSeMantiene: crudo.zoomSeMantiene !== false,
    zoom: {
      link: String(zoom.link ?? ""),
      id: String(zoom.id ?? ""),
      codigo: String(zoom.codigo ?? ""),
    },
  };

  const proveedor = obtenerProveedor();
  const entrada = {
    ctx,
    referencia: REFERENCIAS[tipo],
    borradorActual: typeof body.borradorActual === "string" ? body.borradorActual : undefined,
    observaciones: typeof body.observaciones === "string" ? body.observaciones : undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let enviado = 0;
      try {
        for await (const trozo of proveedor.redactar(entrada, { signal: req.signal })) {
          const delta = trozo.texto.slice(enviado);
          enviado = trozo.texto.length;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          controller.error(e);
          return;
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Proveedor-Simulado": proveedor.simulado ? "1" : "0",
    },
  });
}
