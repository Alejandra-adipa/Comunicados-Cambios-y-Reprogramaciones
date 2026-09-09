import type { ReactNode } from "react";

/**
 * Primitivas de interfaz según DESIGN.md.
 * Radios 4/6/8, superficies `adipa-card`, paleta oficial y proporción 80/20:
 * el morado y el cian se reservan para énfasis, no para vestir la pantalla.
 */

export function Tarjeta({
  titulo,
  hint,
  children,
  className = "",
}: {
  titulo?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`adipa-card ${className}`}>
      {titulo && (
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5">
          <h2 className="text-[0.95rem] font-semibold text-brand-navy">{titulo}</h2>
          {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

type Variante = "primario" | "secundario" | "sutil" | "peligro";

const VARIANTES: Record<Variante, string> = {
  // Hover del primario: opacidad sobre el color de marca, sin inventar un shade.
  primario: "bg-brand text-white border-transparent hover:bg-brand/85",
  secundario: "bg-white text-brand-navy border-line hover:border-line-strong",
  sutil: "bg-transparent text-ink-muted border-transparent hover:bg-brand-soft hover:text-brand-navy",
  peligro: "bg-transparent text-error border-line hover:border-error/40",
};

export function Boton({
  variante = "secundario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-adipa-control border px-3.5 py-2 text-sm font-medium
        transition disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTES[variante]} ${className}`}
    />
  );
}

type Tono = "neutro" | "ok" | "aviso" | "error" | "marca";

const TONOS: Record<Tono, string> = {
  neutro: "bg-brand-soft text-ink-muted",
  ok: "bg-success/12 text-success",
  aviso: "bg-brand-lavender text-brand",
  error: "bg-error/10 text-error",
  marca: "bg-brand-blue-soft text-brand-navy",
};

export function Etiqueta({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-adipa-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function Aviso({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  const borde: Record<Tono, string> = {
    neutro: "border-line bg-brand-soft",
    ok: "border-success/30 bg-success/8",
    aviso: "border-brand/25 bg-brand-lavender/50",
    error: "border-error/30 bg-error/8",
    marca: "border-brand-secondary/30 bg-brand-blue-soft/50",
  };
  return (
    <div className={`rounded-adipa-control border px-4 py-3 text-sm leading-relaxed ${borde[tono]}`}>
      {children}
    </div>
  );
}

/** Eyebrow del sistema: Poppins, nunca monoespaciada (DESIGN.md §15.6). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${className}`}>{children}</p>
  );
}

export function Girador() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
    />
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-ink-subtle">{children}</p>;
}

/**
 * Círculos y semicírculos de fondo para el hero.
 * Son patrones de marca aprobados (DESIGN.md §12.2) y solo se usan en el hero:
 * nunca detrás de formularios, tablas ni acciones críticas.
 */
export function HeroOrbs({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 240"
      preserveAspectRatio="xMaxYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <circle cx="700" cy="40" r="130" fill="currentColor" />
      <circle cx="620" cy="210" r="80" fill="currentColor" />
      <circle cx="770" cy="180" r="45" fill="currentColor" />
    </svg>
  );
}
