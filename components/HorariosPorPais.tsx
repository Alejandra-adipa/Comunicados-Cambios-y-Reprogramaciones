"use client";

import { ClockIcon } from "@phosphor-icons/react";
import type { Solicitud } from "@/lib/modelo";
import { PAISES, horarioSugerido, tablaHorarios } from "@/lib/catalogos";
import { Tarjeta, Boton, Aviso } from "./ui";

/**
 * Horario de la sesión en hora local de cada país.
 *
 * La sugerencia es solo eso. Chile cambia entre horario de invierno y verano, y
 * con ese cambio se mueven las equivalencias de los otros tres países: por eso
 * nada se calcula al vuelo ni se bloquea. Lo que queda guardado es el texto que
 * se escribió en este comunicado.
 */
export function HorariosPorPais({
  s,
  set,
  titulo,
  fechaClave,
}: {
  s: Solicitud;
  set: (parche: Partial<Solicitud>) => void;
  titulo: string;
  fechaClave?: string;
}) {
  const fecha = fechaClave ? String(s.datos[fechaClave] ?? "") : "";
  const tabla = tablaHorarios(fecha);
  const faltan = s.paises.filter((p) => !(s.horarios[p] ?? "").trim());

  function sugerirTodos() {
    const horarios = { ...s.horarios };
    for (const p of s.paises) horarios[p] = horarioSugerido(p, fecha);
    set({ horarios });
  }

  return (
    <Tarjeta
      titulo={titulo}
      hint={tabla === "sabado" ? "Sugerencias de sábado" : "Sugerencias de lunes a viernes"}
    >
      <p className="mb-3 text-sm leading-relaxed text-ink-muted">
        Cada horario va en hora local de su país y se puede editar. Las sugerencias son una ayuda,
        no un valor fijo: cuando Chile cambia a horario de verano o invierno, las equivalencias del
        resto se mueven y hay que ajustarlas a mano.
      </p>

      <div className="mb-3">
        <Boton variante="secundario" onClick={sugerirTodos}>
          <ClockIcon aria-hidden className="size-4" />
          Completar con los horarios habituales
        </Boton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {s.paises.map((p) => {
          const id = `h-${p}`;
          const sugerencia = horarioSugerido(p, fecha);
          return (
            <div key={p}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-brand-navy">
                {PAISES[p].nombre}
              </label>
              <input
                id={id}
                type="text"
                value={s.horarios[p] ?? ""}
                placeholder={sugerencia}
                onChange={(e) => set({ horarios: { ...s.horarios, [p]: e.target.value } })}
              />
              <p className="mt-1 text-xs text-ink-subtle">Habitual: {sugerencia}</p>
            </div>
          );
        })}
      </div>

      {s.paises.length === 0 && (
        <Aviso tono="aviso">Selecciona al menos un país para definir su horario.</Aviso>
      )}
      {faltan.length > 0 && s.paises.length > 0 && (
        <p className="mt-3 text-xs text-ink-subtle">
          Falta el horario de {faltan.map((p) => PAISES[p].nombre).join(", ")}.
        </p>
      )}
    </Tarjeta>
  );
}
