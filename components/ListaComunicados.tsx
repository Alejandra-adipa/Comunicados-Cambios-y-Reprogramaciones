"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CaretRightIcon, TrashIcon } from "@phosphor-icons/react";
import { api } from "@/lib/cliente";
import { Etiqueta, Vacio, Boton } from "./ui";

/**
 * Resumen de un comunicado para el panel.
 *
 * Se arma en el servidor y baja solo lo que la lista muestra: mandar las
 * solicitudes completas significaría enviar todas las bases de contactos al
 * navegador para pintar cuatro líneas.
 */
export type ResumenComunicado = {
  id: string;
  titulo: string;
  tipo: string;
  programa: string;
  paises: string;
  paso: number;
  fecha: string;
  destinatarios: number;
  estado: EstadoPanel;
};

export type EstadoPanel = "borrador" | "en_revision" | "observado" | "aprobado" | "enviado";

const ETIQUETA: Record<EstadoPanel, { texto: string; tono: "neutro" | "aviso" | "ok" | "marca" }> = {
  borrador: { texto: "Borrador", tono: "neutro" },
  en_revision: { texto: "En revisión", tono: "marca" },
  observado: { texto: "Con observaciones", tono: "aviso" },
  aprobado: { texto: "Aprobado", tono: "ok" },
  enviado: { texto: "Enviado", tono: "ok" },
};

type GrupoId = "todos" | "borrador" | "en_revision" | "aprobado" | "enviado";

type Grupo = {
  id: GrupoId;
  texto: string;
  /** `null` significa "sin filtrar". */
  estados: EstadoPanel[] | null;
};

/** Grupos del filtro. "observado" viaja con los borradores: ambos están en curso. */
const GRUPOS: Grupo[] = [
  { id: "todos", texto: "Todos", estados: null },
  { id: "borrador", texto: "Borradores", estados: ["borrador", "observado"] },
  { id: "en_revision", texto: "En revisión", estados: ["en_revision"] },
  { id: "aprobado", texto: "Aprobados", estados: ["aprobado"] },
  { id: "enviado", texto: "Enviados", estados: ["enviado"] },
];

export function ListaComunicados({ comunicados }: { comunicados: ResumenComunicado[] }) {
  const router = useRouter();
  const [grupo, setGrupo] = useState<GrupoId>("todos");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  const conteo = useMemo(() => {
    const n = (estados: EstadoPanel[] | null) =>
      estados === null
        ? comunicados.length
        : comunicados.filter((c) => estados.includes(c.estado)).length;
    return Object.fromEntries(GRUPOS.map((g) => [g.id, n(g.estados)])) as Record<GrupoId, number>;
  }, [comunicados]);

  const visibles = useMemo(() => {
    const def = GRUPOS.find((g) => g.id === grupo);
    if (!def || def.estados === null) return comunicados;
    const estados = def.estados;
    return comunicados.filter((c) => estados.includes(c.estado));
  }, [comunicados, grupo]);

  async function eliminar(id: string) {
    setBorrando(id);
    try {
      await api.eliminar(id);
      setConfirmando(null);
      router.refresh();
    } finally {
      setBorrando(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {GRUPOS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={grupo === g.id}
            onClick={() => setGrupo(g.id)}
            className={`rounded-adipa-control border px-3 py-1.5 text-sm font-medium transition ${
              grupo === g.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white hover:border-brand/30"
            }`}
          >
            {g.texto}
            <span className={`ml-1.5 tabular-nums ${grupo === g.id ? "text-white/70" : "text-ink-subtle"}`}>
              {conteo[g.id]}
            </span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <Vacio>
          {comunicados.length === 0
            ? "Todavía no hay comunicados registrados. Empieza uno con el formulario de arriba."
            : "No hay comunicados en este estado."}
        </Vacio>
      ) : (
        <ul className="divide-y divide-line">
          {visibles.map((c) => {
            const e = ETIQUETA[c.estado];
            const enConfirmacion = confirmando === c.id;

            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <Link
                  href={`/solicitud/${c.id}`}
                  className="group -my-1 flex min-w-0 flex-1 items-center gap-3 rounded-adipa-control py-1 transition hover:text-brand"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-navy group-hover:text-brand">
                      {c.titulo}
                    </span>
                    <span className="block truncate text-xs text-ink-subtle">
                      {c.tipo} · {c.programa} · {c.paises} · paso {c.paso} de 6 · {c.fecha}
                      {c.destinatarios > 0 && ` · ${c.destinatarios} estudiantes`}
                    </span>
                  </span>
                  <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
                  <CaretRightIcon aria-hidden className="size-4 shrink-0 text-ink-subtle" />
                </Link>

                {enConfirmacion ? (
                  // Borrar no se deshace: se pregunta en el mismo lugar, sin diálogo.
                  <span className="flex w-full items-center gap-2 sm:w-auto">
                    <span className="text-xs text-ink-muted">¿Eliminar definitivamente?</span>
                    <Boton
                      variante="peligro"
                      onClick={() => eliminar(c.id)}
                      disabled={borrando === c.id}
                    >
                      {borrando === c.id ? "Eliminando…" : "Sí, eliminar"}
                    </Boton>
                    <Boton variante="sutil" onClick={() => setConfirmando(null)}>
                      Cancelar
                    </Boton>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmando(c.id)}
                    aria-label={`Eliminar ${c.titulo}`}
                    className="rounded-adipa-sm p-2 text-ink-subtle transition hover:bg-brand-soft hover:text-error"
                  >
                    <TrashIcon aria-hidden className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
