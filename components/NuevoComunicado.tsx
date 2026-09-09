"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { TIPOS, TIPO_KEYS } from "@/lib/tipos";
import { PROGRAMAS, PROGRAMA_KEYS } from "@/lib/catalogos";
import { api } from "@/lib/cliente";
import { Boton, Aviso, Girador } from "./ui";

/**
 * Programa y tipo de comunicado son dos ejes independientes: el primero define
 * qué datos se piden y quién valida, el segundo define la plantilla.
 */
export function NuevoComunicado({ puedeCrear = true }: { puedeCrear?: boolean }) {
  const router = useRouter();
  const [programa, setPrograma] = useState<string>(PROGRAMA_KEYS[0]);
  const [tipo, setTipo] = useState<string>(TIPO_KEYS[0]);
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function crear() {
    setError("");
    empezar(async () => {
      try {
        const s = await api.nueva(tipo, programa);
        router.push(`/solicitud/${s.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear la solicitud.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-brand-navy">Tipo de programa</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PROGRAMA_KEYS.map((k) => (
            <TarjetaOpcion
              key={k}
              nombre={PROGRAMAS[k].nombre}
              desc={PROGRAMAS[k].desc}
              activo={programa === k}
              onClick={() => setPrograma(k)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-brand-navy">Tipo de comunicado</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {TIPO_KEYS.map((k) => (
            <TarjetaOpcion
              key={k}
              nombre={TIPOS[k].nombre}
              desc={TIPOS[k].desc}
              activo={tipo === k}
              onClick={() => setTipo(k)}
            />
          ))}
        </div>
      </div>

      {error && <Aviso tono="error">{error}</Aviso>}

      {!puedeCrear && (
        <Aviso tono="neutro">
          Este espacio de prueba solo permite abrir los comunicados de ejemplo de más abajo. Para
          crear uno nuevo hace falta un almacenamiento compartido, o usar la aplicación en tu
          equipo.
        </Aviso>
      )}

      <Boton variante="primario" onClick={crear} disabled={pendiente || !puedeCrear}>
        {pendiente ? (
          <>
            <Girador /> Creando…
          </>
        ) : (
          <>
            Empezar comunicado
            <ArrowRightIcon aria-hidden className="size-4" />
          </>
        )}
      </Boton>
    </div>
  );
}

export function TarjetaOpcion({
  nombre,
  desc,
  activo,
  onClick,
}: {
  nombre: string;
  desc: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-adipa-card border p-3.5 text-left transition ${
        activo ? "border-brand bg-brand-soft" : "border-line bg-white hover:border-brand/30"
      }`}
    >
      <span className="block text-sm font-semibold text-brand-navy">{nombre}</span>
      <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{desc}</span>
    </button>
  );
}
