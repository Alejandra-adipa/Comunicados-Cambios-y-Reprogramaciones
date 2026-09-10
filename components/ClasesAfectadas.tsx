"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { ClaseAfectada, Solicitud } from "@/lib/modelo";
import { claseVacia } from "@/lib/modelo";
import { Tarjeta, Boton, Aviso } from "./ui";

/**
 * Clases afectadas por el comunicado.
 *
 * Mover una clase casi nunca mueve una sola: correr la 2 suele arrastrar la 3 y
 * la 4, cada una a su propia fecha. Por eso es una lista y no un par de campos
 * sueltos, y por eso el comunicado termina mostrando un calendario en vez de
 * una frase que el estudiante tenga que descifrar.
 */
export function ClasesAfectadas({
  s,
  set,
  titulo,
  conFechaOriginal,
  conFechaNueva,
}: {
  s: Solicitud;
  set: (parche: Partial<Solicitud>) => void;
  titulo: string;
  conFechaOriginal: boolean;
  conFechaNueva: boolean;
}) {
  function cambiar(i: number, campo: keyof ClaseAfectada, valor: string) {
    const clases = s.clases.map((c, j) => (j === i ? { ...c, [campo]: valor } : c));
    set({ clases });
  }

  function agregar() {
    const ultima = s.clases[s.clases.length - 1];
    const siguiente = Number(ultima?.numero);
    set({
      clases: [
        ...s.clases,
        {
          ...claseVacia(),
          // Lo habitual es que las clases afectadas sean correlativas.
          numero: Number.isFinite(siguiente) && ultima?.numero ? String(siguiente + 1) : "",
        },
      ],
    });
  }

  function quitar(i: number) {
    const clases = s.clases.filter((_, j) => j !== i);
    set({ clases: clases.length > 0 ? clases : [claseVacia()] });
  }

  // Las clases de Tailwind se escriben completas: una construida al vuelo no
  // aparece en la hoja de estilos.
  const columnas = conFechaOriginal && conFechaNueva
    ? "sm:grid-cols-3"
    : conFechaOriginal || conFechaNueva
      ? "sm:grid-cols-2"
      : "";

  return (
    <Tarjeta titulo={titulo} hint={`${s.clases.length} ${s.clases.length === 1 ? "clase" : "clases"}`}>
      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
        Agrega una fila por cada clase afectada. Si el cambio arrastra las sesiones siguientes,
        súmalas acá: el comunicado sale con el calendario completo, clase por clase.
      </p>

      <div className="space-y-3">
        {s.clases.map((c, i) => (
          <div
            key={i}
            className="rounded-adipa-control border border-line bg-brand-soft/50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className={`grid flex-1 gap-3 ${columnas}`}>
                <div>
                  <label
                    htmlFor={`c-num-${i}`}
                    className="mb-1.5 block text-sm font-semibold text-brand-navy"
                  >
                    Número de clase
                  </label>
                  <input
                    id={`c-num-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={c.numero}
                    placeholder="2"
                    onChange={(e) => cambiar(i, "numero", e.target.value)}
                  />
                </div>

                {conFechaOriginal && (
                  <div>
                    <label
                      htmlFor={`c-orig-${i}`}
                      className="mb-1.5 block text-sm font-semibold text-brand-navy"
                    >
                      {conFechaNueva ? "Fecha original" : "Fecha"}
                    </label>
                    <input
                      id={`c-orig-${i}`}
                      type="date"
                      value={c.fechaOriginal}
                      onChange={(e) => cambiar(i, "fechaOriginal", e.target.value)}
                    />
                  </div>
                )}

                {conFechaNueva && (
                  <div>
                    <label
                      htmlFor={`c-nueva-${i}`}
                      className="mb-1.5 block text-sm font-semibold text-brand-navy"
                    >
                      Nueva fecha
                    </label>
                    <input
                      id={`c-nueva-${i}`}
                      type="date"
                      value={c.fechaNueva}
                      onChange={(e) => cambiar(i, "fechaNueva", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar la fila ${i + 1}`}
                className="mt-7 rounded-adipa-sm p-2 text-ink-subtle transition hover:bg-white hover:text-error"
              >
                <TrashIcon aria-hidden className="size-4" />
              </button>
            </div>

            {conFechaNueva && c.fechaOriginal && c.fechaOriginal === c.fechaNueva && (
              <p className="mt-2 text-xs text-brand">
                La nueva fecha es la misma que la original.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Boton variante="secundario" onClick={agregar}>
          <PlusIcon aria-hidden className="size-4" />
          Agregar otra clase
        </Boton>
      </div>

      {s.clases.every((c) => !c.numero && !c.fechaOriginal && !c.fechaNueva) && (
        <div className="mt-3">
          <Aviso tono="neutro">
            Sin ninguna clase completada, el comunicado sale sin calendario.
          </Aviso>
        </div>
      )}
    </Tarjeta>
  );
}
