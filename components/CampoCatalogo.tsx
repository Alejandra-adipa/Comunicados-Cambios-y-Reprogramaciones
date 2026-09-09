"use client";

import { useId, useState } from "react";

const OTRO = "__otro__";

/**
 * Desplegable alimentado por un catálogo, con salida de escape.
 *
 * El catálogo de hoy es local y va a quedar corto: siempre aparecerá un docente
 * nuevo antes de que el catálogo se actualice. Por eso "Otro…" habilita texto
 * libre en vez de bloquear el formulario. El valor guardado es el mismo string
 * en ambos casos, así que conectar Moodle o Monday más adelante no cambia nada
 * aguas abajo.
 */
export function CampoCatalogo({
  id,
  opciones,
  valor,
  onChange,
  placeholder,
}: {
  id: string;
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const idOtro = useId();
  const fueraDeCatalogo = valor !== "" && !opciones.includes(valor);
  const [libre, setLibre] = useState(fueraDeCatalogo);

  if (libre) {
    return (
      <div className="space-y-1.5">
        <input
          id={id}
          type="text"
          value={valor}
          placeholder={placeholder ?? "Escribe el nombre"}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={idOtro}
        />
        <button
          type="button"
          id={idOtro}
          onClick={() => {
            setLibre(false);
            onChange("");
          }}
          className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-brand hover:underline"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <select
      id={id}
      value={valor}
      onChange={(e) => {
        if (e.target.value === OTRO) {
          setLibre(true);
          onChange("");
          return;
        }
        onChange(e.target.value);
      }}
    >
      <option value="">Selecciona…</option>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value={OTRO}>Otro…</option>
    </select>
  );
}
