"use client";

import type { ReactNode } from "react";
import type { Solicitud } from "@/lib/modelo";
import { TIPOS, type TipoKey } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { CORREO } from "@/lib/envio/provider";

/**
 * Encabezado del correo según el tipo de comunicado.
 *
 * Los seis comparten la misma estructura y la misma línea de marca; lo único que
 * cambia es el rótulo. Inventar seis colores propios habría salido de la paleta
 * oficial, y los colores por escuela y de campaña están reservados para otros
 * usos.
 */
const ROTULOS: Record<TipoKey, string> = {
  reprogramacion: "Cambio de fecha",
  cambio_docente: "Cambio de docente",
  suspension: "Sesión suspendida",
  cambio_horario: "Nuevo horario",
  reunion_informativa: "Invitación",
  aviso_general: "Información importante",
};

/** Nombre del programa, como se muestra bajo el título. */
function bajada(s: Solicitud): string {
  const nombre = String(s.datos.nombrePrograma ?? s.datos.asignatura ?? "").trim();
  const programa = PROGRAMAS[s.programa].nombre;
  if (!nombre) return programa;
  // "Diplomado · Diplomado en Neuropsicología Clínica" sobra: si el nombre ya
  // dice de qué tipo de programa se trata, con el nombre basta.
  const yaLoDice = nombre.toLowerCase().includes(programa.toLowerCase());
  return yaLoDice ? nombre : `${programa} · ${nombre}`;
}

/**
 * El cuerpo se guarda como texto plano, que es lo que se pega en Yamm.
 * Acá se separa en párrafos para que se lea como un correo y no como un bloque:
 * los saltos simples se conservan, así la lista de horarios por país mantiene
 * su forma.
 */
function parrafos(cuerpo: string): string[] {
  return cuerpo
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function VistaEstudiante({
  s,
  ejemplo,
  marca,
}: {
  s: Solicitud;
  ejemplo?: string;
  /** Logo oficial, resuelto en el servidor. Puede no existir. */
  marca?: ReactNode;
}) {
  const bloques = parrafos(s.cuerpo);

  return (
    <div className="space-y-4">
      {/* Cabecera del correo, como la vería el estudiante en su bandeja. */}
      <dl className="grid gap-x-4 gap-y-1.5 rounded-adipa-control border border-line bg-brand-soft px-4 py-3 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-xs text-ink-subtle">De</dt>
        <dd className="text-sm">
          {CORREO.nombreRemitente}{" "}
          <span className="text-ink-subtle">&lt;{CORREO.remitente}&gt;</span>
        </dd>
        <dt className="text-xs text-ink-subtle">Responder a</dt>
        <dd className="text-sm text-ink-muted">{CORREO.responderA}</dd>
        <dt className="text-xs text-ink-subtle">Para</dt>
        <dd className="text-sm text-ink-muted">{ejemplo || "estudiante@correo.cl"}</dd>
        <dt className="text-xs text-ink-subtle">Asunto</dt>
        <dd className="text-sm font-semibold text-brand-navy">{s.asunto || "—"}</dd>
      </dl>

      {/* El correo. */}
      <div className="rounded-adipa-card bg-brand-soft px-4 py-8 sm:px-8">
        {marca && <div className="mb-7 flex justify-center">{marca}</div>}

        <article className="mx-auto max-w-[600px] overflow-hidden rounded-adipa-card bg-white shadow-[0_1px_3px_rgb(9_30_66_/_0.10)]">
          {/* Línea de marca: lo único que se repite igual en los seis tipos. */}
          <div
            aria-hidden
            className="h-1"
            style={{ background: "linear-gradient(90deg, #704efd 0%, #2cb7ff 100%)" }}
          />

          <header className="px-7 pt-7 pb-6 sm:px-9">
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand uppercase">
              {ROTULOS[s.tipo]}
            </p>
            <h1 className="mt-3 text-[22px] leading-snug font-bold tracking-tight text-brand-navy">
              {s.asunto || TIPOS[s.tipo].nombre}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{bajada(s)}</p>
          </header>

          <hr className="mx-7 border-t border-line sm:mx-9" />

          <div className="space-y-5 px-7 py-7 sm:px-9">
            {bloques.length > 0 ? (
              bloques.map((p, i) => (
                <p key={i} className="text-[15px] leading-[1.75] whitespace-pre-line text-ink-muted">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-[15px] text-ink-subtle">
                El comunicado todavía no tiene cuerpo.
              </p>
            )}
          </div>

          <footer className="border-t border-line px-7 py-5 text-xs leading-relaxed text-ink-subtle sm:px-9">
            <p>
              Recibe este correo porque está inscrito en un programa de Adipa
              {s.paises.length > 0 && ` · ${s.paises.map((p) => PAISES[p].nombre).join(" · ")}`}.
            </p>
            <p className="mt-1">
              Si responde a este mensaje, su consulta llega a nuestro equipo de atención.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
