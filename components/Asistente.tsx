"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloudCheckIcon,
  LockSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { Solicitud } from "@/lib/modelo";
import { TIPOS } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { api } from "@/lib/cliente";
import { PasoSolicitud, faltantes } from "./PasoSolicitud";
import { PasoEditor } from "./PasoEditor";
import { PasoValidacion } from "./PasoValidacion";
import { PasoBases } from "./PasoBases";
import { PasoDestinatarios } from "./PasoDestinatarios";
import { PasoEnvio } from "./PasoEnvio";
import { Boton, Girador, Eyebrow, Etiqueta } from "./ui";

export const PASOS = [
  { n: 1, label: "Solicitud", hint: "Programa, tipo y datos" },
  { n: 2, label: "Redacción", hint: "Borrador asistido" },
  { n: 3, label: "Validación", hint: "Visto bueno" },
  { n: 4, label: "Bases", hint: "Participantes por país" },
  { n: 5, label: "Destinatarios", hint: "Incluidos y excluidos" },
  { n: 6, label: "Envío", hint: "Resumen y salida" },
] as const;

/** Por qué un paso no está disponible todavía, o `null` si sí lo está. */
export function bloqueo(s: Solicitud, paso: number): string | null {
  if (paso >= 2 && faltantes(s).length > 0) {
    return "Completa los datos obligatorios de la solicitud.";
  }
  if (paso >= 3 && !s.cuerpo.trim()) {
    return "Primero necesitas un borrador del comunicado.";
  }
  // La aprobación es anterior a armar la lista: no se juntan correos para un
  // comunicado que todavía puede cambiar.
  if (paso >= 4 && s.estado !== "aprobado") {
    return "El flujo no avanza a bases sin una aprobación válida.";
  }
  if (paso >= 5 && s.contactos.length === 0) {
    return "Carga al menos un listado de participantes.";
  }
  return null;
}

export function Asistente({
  inicial,
  marca,
}: {
  inicial: Solicitud;
  /** Logo oficial, resuelto en el servidor para la vista del correo. */
  marca?: ReactNode;
}) {
  const [s, setS] = useState(inicial);
  const id = inicial.id;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const ultimoGuardado = useRef(JSON.stringify(inicial));
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback((parche: Partial<Solicitud>) => {
    setS((prev) => ({ ...prev, ...parche }));
  }, []);

  /** Guardado automático: la coordinadora nunca tiene que apretar un botón de guardar. */
  useEffect(() => {
    const serializado = JSON.stringify(s);
    if (serializado === ultimoGuardado.current) return;

    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setGuardando(true);
      setError("");
      try {
        const { id: _id, creada: _creada, actualizada: _a, ...parche } = s;
        await api.actualizar(s.id, parche);
        // Se marca exactamente lo que se acaba de mandar. Guardar una copia
        // modificada —por ejemplo con la fecha que devuelve el servidor— hace
        // que la comparación nunca coincida y el guardado se repita sin fin.
        ultimoGuardado.current = serializado;
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      } finally {
        setGuardando(false);
      }
    }, 500);

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [s]);

  /**
   * El validador responde desde su propio link, en otra pestaña o en otro
   * equipo. Se traen solo los campos de validación: el resto del formulario
   * puede tener cambios locales sin guardar todavía.
   *
   * Mientras hay una respuesta pendiente se consulta cada pocos segundos. No se
   * condiciona a que la pestaña esté visible: en algunos visores embebidos
   * `visibilityState` nunca pasa a "visible" y la aprobación no llegaría nunca.
   */
  const esperandoRespuesta = s.estado === "en_revision";

  useEffect(() => {
    if (!esperandoRespuesta) return;

    let vivo = true;
    async function sincronizar() {
      if (!vivo) return;
      try {
        const remota = await api.obtener(id);
        if (!vivo) return;
        setS((prev) =>
          remota.historial.length >= prev.historial.length &&
          JSON.stringify(remota.historial) !== JSON.stringify(prev.historial)
            ? { ...prev, estado: remota.estado, historial: remota.historial }
            : prev,
        );
      } catch {
        // Si la consulta falla, se sigue trabajando con lo que hay en pantalla.
      }
    }

    const intervalo = setInterval(sincronizar, 5000);
    document.addEventListener("visibilitychange", sincronizar);
    window.addEventListener("focus", sincronizar);
    return () => {
      vivo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", sincronizar);
      window.removeEventListener("focus", sincronizar);
    };
  }, [id, esperandoRespuesta]);

  const ir = useCallback(
    (paso: number) => {
      if (bloqueo(s, paso)) return;
      set({ paso });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [s, set],
  );

  const props = { s, set, ir };
  const nombre =
    String(s.datos.asignatura ?? s.datos.nombrePrograma ?? s.datos.tema ?? "").trim() ||
    TIPOS[s.tipo].nombre;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-ink-muted transition hover:text-brand"
          >
            <ArrowLeftIcon aria-hidden className="size-3.5" />
            <Eyebrow>Sala de Comunicados</Eyebrow>
          </Link>
          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-brand-navy">
            {nombre}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {TIPOS[s.tipo].nombre} · {PROGRAMAS[s.programa].nombre}
            {s.paises.length > 0 && (
              <Etiqueta tono="neutro">{s.paises.map((p) => PAISES[p].nombre).join(" · ")}</Etiqueta>
            )}
            {s.sensible && <Etiqueta tono="aviso">Caso sensible</Etiqueta>}
          </p>
        </div>
        <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-subtle" aria-live="polite">
          {error ? (
            <>
              <WarningCircleIcon aria-hidden className="size-4 text-error" />
              <span className="text-error">{error}</span>
            </>
          ) : guardando ? (
            <>
              <Girador /> Guardando…
            </>
          ) : (
            <>
              <CloudCheckIcon aria-hidden className="size-4" /> Cambios guardados
            </>
          )}
        </p>
      </header>

      <nav aria-label="Pasos" className="mb-7 overflow-x-auto pb-1">
        <ol className="flex min-w-max gap-1.5">
          {PASOS.map((p) => {
            const activo = p.n === s.paso;
            const razon = bloqueo(s, p.n);
            const completado = !razon && p.n < s.paso;
            return (
              <li key={p.n}>
                <button
                  type="button"
                  onClick={() => ir(p.n)}
                  disabled={!!razon}
                  aria-current={activo ? "step" : undefined}
                  title={razon ?? p.hint}
                  className={`flex items-center gap-2 rounded-adipa-control border px-3 py-2 text-left transition
                    disabled:cursor-not-allowed disabled:opacity-45 ${
                      activo
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white hover:border-brand/30"
                    }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
                      activo
                        ? "bg-white/20 text-white"
                        : completado
                          ? "bg-success/15 text-success"
                          : "bg-brand-soft text-ink-subtle"
                    }`}
                  >
                    {razon ? (
                      <LockSimpleIcon aria-hidden className="size-3" />
                    ) : completado ? (
                      <CheckIcon aria-hidden className="size-3" weight="bold" />
                    ) : (
                      p.n
                    )}
                  </span>
                  <span className="text-xs font-medium whitespace-nowrap">{p.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="space-y-5">
        {s.paso === 1 && <PasoSolicitud {...props} />}
        {s.paso === 2 && <PasoEditor {...props} />}
        {s.paso === 3 && <PasoValidacion {...props} />}
        {s.paso === 4 && <PasoBases {...props} />}
        {s.paso === 5 && <PasoDestinatarios {...props} />}
        {s.paso === 6 && <PasoEnvio {...props} marca={marca} />}
      </div>

      <Pie s={s} ir={ir} />
    </main>
  );
}

function Pie({ s, ir }: { s: Solicitud; ir: (p: number) => void }) {
  const siguiente = s.paso + 1;
  // El envío es el final del recorrido: después no hay a dónde avanzar.
  const ultimo = s.paso === PASOS.length;
  const razon = ultimo ? null : bloqueo(s, siguiente);

  return (
    <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      <Boton variante="sutil" onClick={() => ir(s.paso - 1)} disabled={s.paso === 1}>
        <ArrowLeftIcon aria-hidden className="size-4" />
        Anterior
      </Boton>

      {ultimo ? (
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-adipa-control border border-line bg-white px-3.5 py-2 text-sm font-medium text-brand-navy transition hover:border-line-strong"
        >
          Volver a la Sala de Comunicados
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          {razon && <p className="text-xs text-ink-subtle">{razon}</p>}
          <Boton variante="primario" onClick={() => ir(siguiente)} disabled={!!razon}>
            Siguiente
            <ArrowRightIcon aria-hidden className="size-4" />
          </Boton>
        </div>
      )}
    </footer>
  );
}
