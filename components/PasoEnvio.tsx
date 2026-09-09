"use client";

import { useState } from "react";
import {
  ClipboardIcon,
  DownloadSimpleIcon,
  LockSimpleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import type { PropsPaso } from "./paso";
import { puedeEnviar } from "@/lib/modelo";
import { destinatarios } from "@/lib/destinatarios";
import { TIPOS } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { api } from "@/lib/cliente";
import { Tarjeta, Boton, Aviso, Etiqueta, Girador } from "./ui";
import { VistaEstudiante } from "./VistaEstudiante";
import type { ReactNode } from "react";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

type Pestana = "contenido" | "estudiante";

export function PasoEnvio({ s, set, ir, marca }: PropsPaso & { marca?: ReactNode }) {
  const [pestana, setPestana] = useState<Pestana>("contenido");
  const [copiado, setCopiado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState("");

  const lista = destinatarios(s);
  const habilitado = puedeEnviar(s);
  const aprobo = s.historial.findLast((it) => it.respuesta === "aprobado")?.validador;

  async function copiar(texto: string, cual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      setCopiado("");
    }
  }

  async function enviar() {
    setError("");
    setEnviando(true);
    try {
      const { solicitud, resultado } = await api.enviar(s.id);
      set({ envio: solicitud.envio });
      setDetalle(resultado.detalle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar el envío.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Tarjeta titulo="Resumen del envío" hint={TIPOS[s.tipo].nombre}>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Dato termino="Asunto" valor={s.asunto || "—"} />
          <Dato termino="Programa" valor={PROGRAMAS[s.programa].nombre} />
          <Dato
            termino="Destinatarios"
            valor={`${lista.length} ${lista.length === 1 ? "estudiante" : "estudiantes"}`}
          />
          <Dato
            termino="Países"
            valor={s.paises.map((p) => PAISES[p].nombre).join(", ") || "—"}
          />
          <Dato termino="Solicitado por" valor={s.solicitante || "—"} />
          <Dato
            termino="Validación"
            valor={
              s.estado === "aprobado"
                ? `Aprobado por ${aprobo ?? "jefatura"}`
                : "Sin aprobación válida"
            }
          />
        </dl>
      </Tarjeta>

      {!habilitado && !s.envio.enviado && (
        <Aviso tono="aviso">
          <span className="inline-flex items-start gap-2">
            <LockSimpleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              El envío está bloqueado hasta que exista una aprobación válida.{" "}
              <button
                type="button"
                onClick={() => ir(3)}
                className="font-semibold underline underline-offset-2"
              >
                Ir a validación
              </button>
              .
            </span>
          </span>
        </Aviso>
      )}

      {s.envio.enviado && (
        <Aviso tono="ok">
          <strong className="font-semibold">Comunicado enviado</strong> el {fecha(s.envio.fecha!)} a{" "}
          {s.envio.total} destinatarios.
          {detalle && <span className="block text-xs text-ink-muted">{detalle}</span>}
        </Aviso>
      )}

      <Tarjeta
        titulo={pestana === "contenido" ? "Contenido" : "Vista estudiante"}
        hint={pestana === "contenido" ? "Lo que se pega en Yamm" : "Cómo llega el correo"}
      >
        <div role="tablist" aria-label="Vista del comunicado" className="mb-4 flex gap-1.5">
          <Pestaña
            activa={pestana === "contenido"}
            onClick={() => setPestana("contenido")}
            texto="Contenido"
          />
          <Pestaña
            activa={pestana === "estudiante"}
            onClick={() => setPestana("estudiante")}
            texto="Vista estudiante"
          />
        </div>

        {pestana === "contenido" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/solicitudes/${s.id}/csv`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-adipa-control border border-transparent bg-brand px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand/85"
              >
                <DownloadSimpleIcon aria-hidden className="size-4" />
                Descargar destinatarios.csv
              </a>
              <Boton variante="secundario" onClick={() => copiar(s.asunto, "asunto")}>
                <ClipboardIcon aria-hidden className="size-4" />
                {copiado === "asunto" ? "Asunto copiado" : "Copiar asunto"}
              </Boton>
              <Boton variante="secundario" onClick={() => copiar(s.cuerpo, "cuerpo")}>
                <ClipboardIcon aria-hidden className="size-4" />
                {copiado === "cuerpo" ? "Cuerpo copiado" : "Copiar cuerpo"}
              </Boton>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-brand-navy">
                Asunto <Etiqueta tono="neutro">{s.asunto.length} caracteres</Etiqueta>
              </p>
              <p className="rounded-adipa-control border border-line bg-brand-soft px-4 py-2.5 text-sm">
                {s.asunto || "—"}
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-brand-navy">Cuerpo</p>
              <pre className="max-h-80 overflow-auto rounded-adipa-control border border-line bg-brand-soft p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {s.cuerpo || "—"}
              </pre>
            </div>
          </div>
        ) : (
          <VistaEstudiante s={s} ejemplo={lista[0]?.correo} marca={marca} />
        )}
      </Tarjeta>

      <Tarjeta titulo="Enviar" hint="Simulación">
        <Aviso tono="marca">
          En esta versión no sale ningún correo. El envío real se hace desde Yamm con el CSV de
          arriba; acá solo queda registrado qué se mandó y cuándo.
        </Aviso>

        {error && (
          <div className="mt-3">
            <Aviso tono="error">{error}</Aviso>
          </div>
        )}

        <div className="mt-4">
          <Boton
            variante="primario"
            onClick={enviar}
            disabled={!habilitado || lista.length === 0 || enviando}
          >
            {enviando ? <Girador /> : <PaperPlaneTiltIcon aria-hidden className="size-4" />}
            {s.envio.enviado
              ? "Ya marcado como enviado"
              : `Simular envío a ${lista.length} ${lista.length === 1 ? "estudiante" : "estudiantes"}`}
          </Boton>
          {lista.length === 0 && (
            <p className="mt-2 text-xs text-ink-subtle">No hay destinatarios en la lista final.</p>
          )}
        </div>
      </Tarjeta>
    </>
  );
}

function Pestaña({
  activa,
  onClick,
  texto,
}: {
  activa: boolean;
  onClick: () => void;
  texto: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={`rounded-adipa-control border px-3.5 py-2 text-sm font-medium transition ${
        activa ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/30"
      }`}
    >
      {texto}
    </button>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{termino}</dt>
      <dd className="text-sm leading-snug">{valor}</dd>
    </div>
  );
}
