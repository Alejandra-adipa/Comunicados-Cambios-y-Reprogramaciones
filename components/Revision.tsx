"use client";

import { useState } from "react";
import { CheckCircleIcon, PencilSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { Solicitud } from "@/lib/modelo";
import { TIPOS } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { validadorDe } from "@/lib/validacion";
import { api } from "@/lib/cliente";
import { Tarjeta, Boton, Aviso, Etiqueta, Girador, Eyebrow, HeroOrbs } from "./ui";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Vista del validador.
 *
 * Es la única pantalla pensada para alguien que no es la coordinadora: muestra
 * el comunicado completo y las dos únicas acciones que le corresponden. No puede
 * editar el texto — si algo hay que cambiar, se pide por observaciones.
 */
export function Revision({ inicial }: { inicial: Solicitud }) {
  const [s, setS] = useState(inicial);
  const [comentario, setComentario] = useState("");
  const [pidiendoCambios, setPidiendoCambios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const validador = validadorDe(s);
  const abierta = s.historial[s.historial.length - 1];
  const esperando = s.estado === "en_revision" && abierta && !abierta.respuesta;

  async function responder(accion: "aprobado" | "observaciones") {
    setError("");
    setEnviando(true);
    try {
      setS(await api.responderValidacion(s.id, accion, comentario));
      setComentario("");
      setPidiendoCambios(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la respuesta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="relative isolate overflow-hidden bg-brand text-white">
        <HeroOrbs className="text-white opacity-10" />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Eyebrow className="text-white/80">Revisión de comunicado</Eyebrow>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {TIPOS[s.tipo].nombre}
          </h1>
          <p className="mt-2 text-[15px] text-white/80">
            {PROGRAMAS[s.programa].nombre} · para {validador.nombre}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
        {s.sensible && (
          <Aviso tono="aviso">
            <strong className="font-semibold">Caso marcado como sensible.</strong>
            {s.motivoSensibilidad ? ` ${s.motivoSensibilidad}` : ""}
          </Aviso>
        )}

        <Tarjeta titulo="Comunicado" hint={`${s.paises.map((p) => PAISES[p].nombre).join(" · ")}`}>
          <p className="mb-1.5 text-xs text-ink-subtle">Asunto</p>
          <p className="mb-4 text-sm font-semibold text-brand-navy">{s.asunto || "—"}</p>
          <p className="mb-1.5 text-xs text-ink-subtle">Cuerpo</p>
          <pre className="rounded-adipa-control border border-line bg-brand-soft p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {s.cuerpo || "—"}
          </pre>
        </Tarjeta>

        {esperando ? (
          <Tarjeta titulo="Tu respuesta">
            {error && (
              <div className="mb-3">
                <Aviso tono="error">{error}</Aviso>
              </div>
            )}

            {pidiendoCambios ? (
              <div className="space-y-3">
                <label htmlFor="r-obs" className="block text-sm font-semibold text-brand-navy">
                  ¿Qué hay que cambiar?
                </label>
                <textarea
                  id="r-obs"
                  rows={4}
                  autoFocus
                  value={comentario}
                  placeholder="Ej.: hazlo más breve y agrega una disculpa por el cambio."
                  onChange={(e) => setComentario(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Boton
                    variante="primario"
                    onClick={() => responder("observaciones")}
                    disabled={enviando || !comentario.trim()}
                  >
                    {enviando ? <Girador /> : <PencilSimpleIcon aria-hidden className="size-4" />}
                    Enviar observaciones
                  </Boton>
                  <Boton variante="sutil" onClick={() => setPidiendoCambios(false)}>
                    Cancelar
                  </Boton>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Boton variante="primario" onClick={() => responder("aprobado")} disabled={enviando}>
                  {enviando ? <Girador /> : <CheckCircleIcon aria-hidden className="size-4" />}
                  Aprobar comunicado
                </Boton>
                <Boton variante="secundario" onClick={() => setPidiendoCambios(true)}>
                  <PencilSimpleIcon aria-hidden className="size-4" />
                  Solicitar cambios
                </Boton>
              </div>
            )}
          </Tarjeta>
        ) : (
          <Aviso tono={s.estado === "aprobado" ? "ok" : "neutro"}>
            {s.estado === "aprobado" ? (
              <>
                <strong className="font-semibold">Ya está aprobado.</strong> No hay nada pendiente de
                tu parte.
              </>
            ) : s.estado === "observado" ? (
              <>
                <strong className="font-semibold">Se enviaron observaciones.</strong> El comunicado
                volvió a redacción; te llegará de nuevo cuando esté corregido.
              </>
            ) : (
              <>
                <WarningCircleIcon aria-hidden className="mr-1 inline size-4 align-[-3px]" />
                Este comunicado todavía no fue enviado a revisión.
              </>
            )}
          </Aviso>
        )}

        {s.historial.length > 0 && (
          <Tarjeta titulo="Historial" hint="Vueltas anteriores">
            <ol className="space-y-3">
              {[...s.historial].reverse().map((it) => (
                <li
                  key={it.n}
                  className="rounded-adipa-control border border-line bg-brand-soft px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-ink-subtle">Vuelta {it.n}</span>
                    <span className="text-xs font-semibold text-brand-navy">{it.validador}</span>
                    {it.respuesta === "aprobado" ? (
                      <Etiqueta tono="ok">Aprobado</Etiqueta>
                    ) : it.respuesta === "observaciones" ? (
                      <Etiqueta tono="aviso">Con observaciones</Etiqueta>
                    ) : (
                      <Etiqueta tono="marca">Esperando respuesta</Etiqueta>
                    )}
                    <span className="text-xs text-ink-subtle">
                      {fecha(it.respondido ?? it.enviado)}
                    </span>
                  </div>
                  {it.comentario && (
                    <p className="mt-1.5 text-sm leading-relaxed">{it.comentario}</p>
                  )}
                </li>
              ))}
            </ol>
          </Tarjeta>
        )}
      </main>
    </>
  );
}
