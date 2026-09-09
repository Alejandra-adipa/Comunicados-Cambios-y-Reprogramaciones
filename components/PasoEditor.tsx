"use client";

import { useRef, useState } from "react";
import {
  BookOpenTextIcon,
  FileTextIcon,
  SparkleIcon,
  StopCircleIcon,
} from "@phosphor-icons/react";
import type { PropsPaso } from "./paso";
import { TIPOS } from "@/lib/tipos";
import { REFERENCIAS } from "@/lib/referencias";
import { plantilla } from "@/lib/ia/plantillas";
import { contextoDe } from "@/lib/contexto";
import { partir } from "@/lib/ia/provider";
import { Tarjeta, Boton, Aviso, Etiqueta, Girador } from "./ui";

const hora = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export function PasoEditor({ s, set }: PropsPaso) {
  const [redactando, setRedactando] = useState(false);
  const [error, setError] = useState("");
  const [verReferencia, setVerReferencia] = useState(false);
  const aborto = useRef<AbortController | null>(null);

  const referencia = REFERENCIAS[s.tipo];
  const observaciones = ultimasObservaciones(s.historial);

  /** Editar después del OK invalida la aprobación: jefatura aprobó otro texto. */
  function escribir(parche: { asunto?: string; cuerpo?: string; fuente?: string }) {
    const invalida = s.estado === "aprobado" ? { estado: "borrador" as const } : {};
    set({ ...parche, ...invalida });
  }

  function usarPlantilla() {
    const p = plantilla(contextoDe(s));
    escribir({ asunto: p.asunto, cuerpo: p.cuerpo, fuente: `Plantilla · ${hora()}` });
  }

  async function redactar() {
    setError("");
    setRedactando(true);
    aborto.current = new AbortController();

    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: aborto.current.signal,
        body: JSON.stringify({
          ctx: contextoDe(s),
          borradorActual: s.cuerpo,
          observaciones,
        }),
      });
      if (!res.ok || !res.body) throw new Error("La redacción no respondió.");

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        const p = partir(acumulado);
        escribir({ asunto: p.asunto || s.asunto, cuerpo: p.cuerpo });
      }

      const final = partir(acumulado);
      escribir({
        asunto: final.asunto || s.asunto,
        cuerpo: final.cuerpo,
        fuente: `Borrador asistido · ${hora()}`,
      });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        setError("No se pudo generar el borrador. Puedes usar la plantilla y editarla.");
      }
    } finally {
      setRedactando(false);
      aborto.current = null;
    }
  }

  const palabras = s.cuerpo.trim() ? s.cuerpo.trim().split(/\s+/).length : 0;

  return (
    <>
      <Tarjeta
        titulo="Redacción"
        hint={
          <span className="inline-flex items-center gap-2">
            <Etiqueta tono="marca">Redacción simulada</Etiqueta>
            {s.fuente || "Sin borrador"}
          </span>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Boton variante="primario" onClick={redactar} disabled={redactando}>
            {redactando ? (
              <>
                <Girador /> Redactando…
              </>
            ) : (
              <>
                <SparkleIcon aria-hidden className="size-4" />
                {s.cuerpo ? "Rehacer con apoyo" : "Redactar con apoyo"}
              </>
            )}
          </Boton>
          {redactando && (
            <Boton variante="secundario" onClick={() => aborto.current?.abort()}>
              <StopCircleIcon aria-hidden className="size-4" />
              Detener
            </Boton>
          )}
          <Boton variante="secundario" onClick={usarPlantilla} disabled={redactando}>
            <FileTextIcon aria-hidden className="size-4" />
            Usar plantilla
          </Boton>
          <Boton variante="sutil" onClick={() => setVerReferencia((v) => !v)}>
            <BookOpenTextIcon aria-hidden className="size-4" />
            {verReferencia ? "Ocultar referencia" : "Ver comunicado de referencia"}
          </Boton>
        </div>

        {observaciones && (
          <div className="mb-4">
            <Aviso tono="aviso">
              <strong className="font-semibold">Observaciones de jefatura pendientes:</strong>{" "}
              {observaciones}
              <br />
              <span className="text-xs text-ink-muted">
                Se incorporan al volver a redactar con apoyo.
              </span>
            </Aviso>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <Aviso tono="error">{error}</Aviso>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="f-asunto" className="mb-1.5 block text-sm font-semibold text-brand-navy">
              Asunto del correo
            </label>
            <input
              id="f-asunto"
              type="text"
              value={s.asunto}
              placeholder="Se completa al redactar"
              onChange={(e) => escribir({ asunto: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="f-cuerpo" className="text-sm font-semibold text-brand-navy">
                Cuerpo del comunicado
              </label>
              <span className="text-xs tabular-nums text-ink-subtle">{palabras} palabras</span>
            </div>
            <textarea
              id="f-cuerpo"
              rows={16}
              value={s.cuerpo}
              placeholder="Redacta con apoyo, parte de la plantilla, o escribe directamente aquí."
              onChange={(e) => escribir({ cuerpo: e.target.value })}
            />
          </div>
        </div>

        {s.estado === "aprobado" && (
          <p className="mt-3 text-xs text-ink-subtle">
            Este comunicado ya está aprobado. Si lo editas, vuelve a estado borrador y hay que
            validarlo otra vez.
          </p>
        )}
      </Tarjeta>

      {verReferencia && (
        <Tarjeta titulo="Comunicado de referencia" hint={`${TIPOS[s.tipo].nombre} · ya enviado`}>
          <p className="mb-3 text-sm font-semibold text-brand-navy">{referencia.asunto}</p>
          <pre className="max-h-80 overflow-auto rounded-adipa-control bg-brand-soft p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {referencia.cuerpo}
          </pre>
        </Tarjeta>
      )}
    </>
  );
}

/** Observaciones de la última vuelta, si quedaron sin resolver. */
function ultimasObservaciones(historial: PropsPaso["s"]["historial"]): string {
  const ultima = historial[historial.length - 1];
  return ultima?.respuesta === "observaciones" ? (ultima.comentario ?? "") : "";
}
