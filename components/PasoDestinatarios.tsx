"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { PropsPaso } from "./paso";
import { clasificar, conteoPorMotivo, TEXTO_MOTIVO, type ContactoClasificado } from "@/lib/destinatarios";
import { PAISES } from "@/lib/catalogos";
import { Tarjeta, Aviso, Etiqueta, Boton, Vacio } from "./ui";

type Pestana = "incluidos" | "excluidos";

export function PasoDestinatarios({ s, set }: PropsPaso) {
  const [pestana, setPestana] = useState<Pestana>("incluidos");
  const [busqueda, setBusqueda] = useState("");

  const todos = useMemo(() => clasificar(s), [s]);
  const dentro = todos.filter((c) => !c.excluido);
  const fuera = todos.filter((c) => c.excluido);
  const motivos = useMemo(() => conteoPorMotivo(s), [s]);

  const lista = pestana === "incluidos" ? dentro : fuera;
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) => `${c.nombre} ${c.apellidos} ${c.correo}`.toLowerCase().includes(q));
  }, [lista, busqueda]);

  function alternar(correo: string) {
    const k = correo.toLowerCase();
    const ya = s.excluidos.some((c) => c.toLowerCase() === k);
    set({
      excluidos: ya ? s.excluidos.filter((c) => c.toLowerCase() !== k) : [...s.excluidos, correo],
    });
  }

  return (
    <>
      <Tarjeta titulo="Lista final" hint={`${dentro.length} de ${todos.length} contactos`}>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Cifra n={dentro.length} label="Reciben el comunicado" destacada />
          <Cifra n={fuera.length} label="Quedan fuera" />
        </div>

        {motivos.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {motivos.map(({ motivo, n }) => (
              <Etiqueta key={motivo} tono={motivo === "correo_invalido" ? "error" : "neutro"}>
                {TEXTO_MOTIVO[motivo]}: {n}
              </Etiqueta>
            ))}
          </div>
        )}

        {todos.length === 0 && <Aviso tono="neutro">No hay participantes cargados todavía.</Aviso>}

        {s.excluidos.length > 0 && (
          <Boton variante="sutil" onClick={() => set({ excluidos: [] })}>
            Restaurar los {s.excluidos.length} excluidos a mano
          </Boton>
        )}
      </Tarjeta>

      <Tarjeta
        titulo={pestana === "incluidos" ? "Incluidos" : "Excluidos"}
        hint="Puedes mover a alguien de una lista a la otra"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Listas" className="flex gap-1.5">
            <Pestaña
              activa={pestana === "incluidos"}
              onClick={() => setPestana("incluidos")}
              texto={`Incluidos (${dentro.length})`}
            />
            <Pestaña
              activa={pestana === "excluidos"}
              onClick={() => setPestana("excluidos")}
              texto={`Excluidos (${fuera.length})`}
            />
          </div>
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
            />
            <input
              type="text"
              value={busqueda}
              placeholder="Buscar por nombre o correo…"
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9!"
            />
          </div>
        </div>

        {visibles.length === 0 ? (
          <Vacio>
            {lista.length === 0
              ? pestana === "incluidos"
                ? "Nadie queda en la lista final."
                : "Nadie quedó fuera."
              : "Nada que mostrar con esta búsqueda."}
          </Vacio>
        ) : (
          <Tabla filas={visibles} pestana={pestana} onAlternar={alternar} />
        )}
      </Tarjeta>
    </>
  );
}

function Tabla({
  filas,
  pestana,
  onAlternar,
}: {
  filas: ContactoClasificado[];
  pestana: Pestana;
  onAlternar: (correo: string) => void;
}) {
  return (
    <div className="max-h-[28rem] overflow-auto rounded-adipa-control border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-brand-soft text-left text-xs text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Nombre</th>
            <th className="px-3 py-2 font-semibold">Correo</th>
            <th className="px-3 py-2 font-semibold">País</th>
            <th className="px-3 py-2 font-semibold">
              {pestana === "excluidos" ? "Motivo" : "Rol"}
            </th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {filas.map((c) => (
            <tr key={c.id} className={c.excluido ? "text-ink-subtle" : ""}>
              <td className="px-3 py-2">
                <span className="block truncate">
                  {`${c.nombre} ${c.apellidos}`.trim() || "—"}
                </span>
                <span className="block truncate text-xs text-ink-subtle">{c.origen}</span>
              </td>
              <td className="px-3 py-2 text-xs break-all">{c.correo || "—"}</td>
              <td className="px-3 py-2 text-xs">{c.paises.map((p) => PAISES[p].nombre).join(" · ")}</td>
              <td className="px-3 py-2">
                {c.excluido && c.motivo ? (
                  <Etiqueta tono={c.motivo === "correo_invalido" ? "error" : "neutro"}>
                    {TEXTO_MOTIVO[c.motivo]}
                  </Etiqueta>
                ) : (
                  <span className="text-xs text-ink-subtle">{c.rol || "Estudiante"}</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {/* Un correo mal formado o repetido no se puede reincorporar a mano. */}
                {(!c.excluido || c.motivo === "manual") && (
                  <button
                    type="button"
                    onClick={() => onAlternar(c.correo)}
                    className="rounded-adipa-sm px-2 py-1 text-xs font-medium text-ink-muted transition hover:bg-brand-soft hover:text-brand"
                  >
                    {c.excluido ? "Volver a incluir" : "Dejar fuera"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function Cifra({ n, label, destacada = false }: { n: number; label: string; destacada?: boolean }) {
  return (
    <div
      className={`rounded-adipa-control border px-3 py-2.5 ${
        destacada ? "border-brand bg-brand-soft" : "border-line bg-brand-soft/50"
      }`}
    >
      <p className="text-xl font-bold tabular-nums text-brand-navy">{n}</p>
      <p className="text-xs leading-tight text-ink-muted">{label}</p>
    </div>
  );
}
