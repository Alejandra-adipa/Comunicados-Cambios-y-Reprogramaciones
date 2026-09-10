"use client";

import { useEffect, useState } from "react";
import { FileTextIcon, FloppyDiskIcon, TrashIcon } from "@phosphor-icons/react";
import type { PlantillaGuardada, Solicitud } from "@/lib/modelo";
import { TIPOS } from "@/lib/tipos";
import { Tarjeta, Boton, Aviso, Etiqueta, Girador, Vacio } from "./ui";

/**
 * Plantillas propias del equipo.
 *
 * Es donde viven los borradores que hoy se copian a mano desde la bandeja de
 * info@adipa: se pegan una vez y quedan disponibles para cualquier comunicado,
 * sin volver a buscar el correo antiguo. La plantilla del tipo, la que arma la
 * aplicación con los datos del formulario, sigue estando aparte.
 */
export function BibliotecaPlantillas({
  s,
  onUsar,
}: {
  s: Solicitud;
  onUsar: (p: { asunto: string; cuerpo: string; nombre: string }) => void;
}) {
  const [lista, setLista] = useState<PlantillaGuardada[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/plantillas", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((p) => vivo && setLista(p))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, []);

  async function guardar() {
    if (!nombre.trim() || !s.cuerpo.trim()) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/plantillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo: s.tipo,
          asunto: s.asunto,
          cuerpo: s.cuerpo,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "No se pudo guardar.");
      setLista(await res.json());
      setNombre("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la plantilla.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id: string) {
    const res = await fetch(`/api/plantillas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setLista(await res.json());
  }

  // Primero las del tipo actual: son las que casi siempre se buscan.
  const ordenadas = (lista ?? [])
    .slice()
    .sort((a, b) => Number(b.tipo === s.tipo) - Number(a.tipo === s.tipo));

  return (
    <Tarjeta titulo="Mis plantillas" hint="Los borradores que guardas para reutilizar">
      {lista === null ? (
        <p className="py-4 text-center text-sm text-ink-subtle">
          <Girador /> Cargando…
        </p>
      ) : ordenadas.length === 0 ? (
        <Vacio>
          Todavía no hay plantillas guardadas. Pega abajo un borrador de los que usas hoy y quedará
          disponible para cualquier comunicado.
        </Vacio>
      ) : (
        <ul className="divide-y divide-line">
          {ordenadas.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <FileTextIcon aria-hidden className="size-5 shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-brand-navy">
                  {p.nombre}
                </span>
                <span className="block truncate text-xs text-ink-subtle">
                  {p.asunto || "Sin asunto"}
                </span>
              </span>
              {p.tipo && <Etiqueta tono={p.tipo === s.tipo ? "marca" : "neutro"}>{TIPOS[p.tipo].nombre}</Etiqueta>}
              <Boton
                variante="secundario"
                onClick={() => onUsar({ asunto: p.asunto, cuerpo: p.cuerpo, nombre: p.nombre })}
              >
                Usar
              </Boton>
              <button
                type="button"
                onClick={() => quitar(p.id)}
                aria-label={`Quitar la plantilla ${p.nombre}`}
                className="rounded-adipa-sm p-2 text-ink-subtle transition hover:bg-brand-soft hover:text-error"
              >
                <TrashIcon aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-line pt-4">
        <label htmlFor="p-nombre" className="mb-1.5 block text-sm font-semibold text-brand-navy">
          Guardar el borrador actual como plantilla
        </label>
        <p className="mb-2 text-xs text-ink-muted">
          Se guarda el asunto y el cuerpo que están ahora en el editor, tal cual. Para incorporar
          uno de los borradores de info@adipa, pégalo primero en el editor y guárdalo desde acá.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            id="p-nombre"
            type="text"
            value={nombre}
            placeholder="Ej.: Reprogramación por licencia médica"
            onChange={(e) => setNombre(e.target.value)}
            className="max-w-sm"
          />
          <Boton
            variante="secundario"
            onClick={guardar}
            disabled={guardando || !nombre.trim() || !s.cuerpo.trim()}
          >
            {guardando ? <Girador /> : <FloppyDiskIcon aria-hidden className="size-4" />}
            Guardar
          </Boton>
        </div>
        {!s.cuerpo.trim() && (
          <p className="mt-2 text-xs text-ink-subtle">
            El editor está vacío: no hay nada que guardar todavía.
          </p>
        )}
        {error && (
          <div className="mt-3">
            <Aviso tono="error">{error}</Aviso>
          </div>
        )}
      </div>
    </Tarjeta>
  );
}
