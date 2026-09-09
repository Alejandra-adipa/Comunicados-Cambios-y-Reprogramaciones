"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  ClipboardIcon,
  LinkSimpleIcon,
  PaperPlaneTiltIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import type { PropsPaso } from "./paso";
import type { Iteracion } from "@/lib/modelo";
import { razonValidador, validadorDe, mensajeRevision } from "@/lib/validacion";
import { Tarjeta, Boton, Aviso, Etiqueta } from "./ui";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PasoValidacion({ s, set, ir }: PropsPaso) {
  const [comentario, setComentario] = useState("");
  const [copiado, setCopiado] = useState("");
  // El host público solo se conoce en el navegador. En el servidor queda vacío
  // y se completa en cuanto la página se hidrata.
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = origen ? `${origen}/revision/${s.id}` : "";

  const validador = validadorDe(s);
  const enRevision = s.estado === "en_revision";
  const abierta = s.historial[s.historial.length - 1];

  function enviarAValidacion() {
    const nueva: Iteracion = {
      n: s.historial.length + 1,
      enviado: new Date().toISOString(),
      validador: validador.nombre,
      asunto: s.asunto,
      cuerpo: s.cuerpo,
    };
    set({ estado: "en_revision", historial: [...s.historial, nueva] });
  }

  /** Registro manual, por si el validador responde por otro canal. */
  function responder(respuesta: "aprobado" | "observaciones") {
    if (!abierta || abierta.respuesta) return;
    if (respuesta === "observaciones" && !comentario.trim()) return;

    const historial = [
      ...s.historial.slice(0, -1),
      {
        ...abierta,
        respondido: new Date().toISOString(),
        respuesta,
        comentario: comentario.trim() || undefined,
      },
    ];
    set({ estado: respuesta === "aprobado" ? "aprobado" : "observado", historial });
    setComentario("");
  }

  async function copiar(texto: string, cual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      setCopiado("");
    }
  }

  return (
    <>
      <Tarjeta titulo="Quién valida" hint="Siempre una sola firma">
        <div className="flex flex-wrap items-start gap-3">
          <UserCircleIcon aria-hidden className="size-9 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-navy">{validador.nombre}</p>
            <p className="text-xs text-ink-muted">{validador.rol}</p>
            <p className="mt-1 text-xs text-ink-subtle">{razonValidador(s)}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-1.5 text-sm font-semibold text-brand-navy">¿Es un caso sensible?</p>
          <p className="mb-2 text-xs leading-relaxed text-ink-muted">
            Cambios que puedan generar reclamos, información delicada, o modificaciones que
            requieran criterio de jefatura superior. Marcarlo no agrega una segunda firma: cambia de
            quién es.
          </p>
          <div className="flex flex-wrap gap-2">
            <Opcion activo={!s.sensible} onClick={() => set({ sensible: false })} texto="No" />
            <Opcion activo={s.sensible} onClick={() => set({ sensible: true })} texto="Sí" />
          </div>

          {s.sensible && (
            <div className="mt-3">
              <label
                htmlFor="f-sens"
                className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-brand-navy"
              >
                Motivo de sensibilidad
                <Etiqueta tono="neutro">uso interno</Etiqueta>
              </label>
              <textarea
                id="f-sens"
                rows={2}
                value={s.motivoSensibilidad}
                placeholder="Opcional. Contexto para quien valida."
                onChange={(e) => set({ motivoSensibilidad: e.target.value })}
              />
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Revisión" hint={`Vuelta ${Math.max(s.historial.length, 1)}`}>
        {s.estado === "aprobado" ? (
          <Aviso tono="ok">
            <strong className="font-semibold">Aprobado por {abierta?.validador ?? validador.nombre}.</strong>{" "}
            El envío quedó habilitado. Si editas el comunicado, la aprobación se pierde y hay que
            pedirla de nuevo.
          </Aviso>
        ) : enRevision ? (
          <div className="space-y-4">
            <Aviso tono="marca">
              Enviado a {abierta!.validador} el {fecha(abierta!.enviado)} · esperando su respuesta en
              el link de revisión.
            </Aviso>

            <LinkRevision url={url} copiado={copiado} onCopiar={copiar} mensaje={mensajeRevision(s, url)} />

            <details className="rounded-adipa-control border border-line bg-brand-soft px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-brand-navy">
                Registrar la respuesta a mano
              </summary>
              <p className="mt-2 text-xs text-ink-muted">
                Solo si {abierta!.validador.split(" ")[0]} respondió por otro canal en vez de usar el
                link.
              </p>
              <div className="mt-3 space-y-3">
                <textarea
                  rows={2}
                  value={comentario}
                  placeholder="Observaciones, si las hubo."
                  onChange={(e) => setComentario(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Boton variante="primario" onClick={() => responder("aprobado")}>
                    <CheckCircleIcon aria-hidden className="size-4" />
                    Aprobó
                  </Boton>
                  <Boton
                    variante="secundario"
                    onClick={() => responder("observaciones")}
                    disabled={!comentario.trim()}
                  >
                    Pidió cambios
                  </Boton>
                </div>
              </div>
            </details>
          </div>
        ) : (
          <div className="space-y-4">
            {s.estado === "observado" && abierta?.comentario && (
              <Aviso tono="aviso">
                <strong className="font-semibold">{abierta.validador} pidió ajustes:</strong>{" "}
                {abierta.comentario}
              </Aviso>
            )}
            <p className="text-sm leading-relaxed text-ink-muted">
              Al marcarlo como enviado se genera el link de revisión para {validador.nombre}, que
              podrá aprobar o dejar observaciones desde ahí.
            </p>
            <div className="flex flex-wrap gap-2">
              <Boton variante="primario" onClick={enviarAValidacion} disabled={!s.cuerpo.trim()}>
                <PaperPlaneTiltIcon aria-hidden className="size-4" />
                Enviar a {validador.nombre.split(" ")[0]}
              </Boton>
              {s.estado === "observado" && (
                <Boton variante="sutil" onClick={() => ir(2)}>
                  <ArrowUUpLeftIcon aria-hidden className="size-4" />
                  Volver a redacción
                </Boton>
              )}
            </div>
          </div>
        )}
      </Tarjeta>

      {s.historial.length > 0 && (
        <Tarjeta titulo="Historial de validación" hint="Cada ida y vuelta">
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
                    Enviado {fecha(it.enviado)}
                    {it.respondido && ` · respondido ${fecha(it.respondido)}`}
                  </span>
                </div>
                {it.comentario && <p className="mt-1.5 text-sm leading-relaxed">{it.comentario}</p>}
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}
    </>
  );
}

/**
 * El link y el mensaje listos para pegar.
 *
 * Cuando exista la integración con Slack, este bloque se reemplaza por un botón
 * de envío directo; el mensaje ya se arma en `lib/validacion.ts`.
 */
function LinkRevision({
  url,
  mensaje,
  copiado,
  onCopiar,
}: {
  url: string;
  mensaje: string;
  copiado: string;
  onCopiar: (texto: string, cual: string) => void;
}) {
  return (
    <div className="rounded-adipa-control border border-line bg-white px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-navy">
        <LinkSimpleIcon aria-hidden className="size-4" />
        Link de revisión
      </p>
      <p className="mb-3 rounded-adipa-sm bg-brand-soft px-3 py-2 text-xs break-all">{url}</p>
      <div className="flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={() => onCopiar(url, "url")}>
          <ClipboardIcon aria-hidden className="size-4" />
          {copiado === "url" ? "Link copiado" : "Copiar link"}
        </Boton>
        <Boton variante="secundario" onClick={() => onCopiar(mensaje, "mensaje")}>
          <ClipboardIcon aria-hidden className="size-4" />
          {copiado === "mensaje" ? "Mensaje copiado" : "Copiar mensaje para Slack"}
        </Boton>
      </div>
      <p className="mt-2 text-xs text-ink-subtle">
        Cualquiera con este link puede responder la validación. En esta versión no hay sesiones ni
        permisos.
      </p>
    </div>
  );
}

function Opcion({
  activo,
  onClick,
  texto,
}: {
  activo: boolean;
  onClick: () => void;
  texto: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`rounded-adipa-control border px-4 py-1.5 text-sm font-medium transition ${
        activo ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/30"
      }`}
    >
      {texto}
    </button>
  );
}
