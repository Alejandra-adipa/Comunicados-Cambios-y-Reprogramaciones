import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { listar } from "@/lib/store";
import { TIPOS } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { destinatarios } from "@/lib/destinatarios";
import { NuevoComunicado } from "@/components/NuevoComunicado";
import { Marca } from "@/components/Marca";
import { Tarjeta, Etiqueta, Vacio, Eyebrow, HeroOrbs } from "@/components/ui";
import type { EstadoValidacion, Solicitud } from "@/lib/modelo";

export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoValidacion, { texto: string; tono: "neutro" | "aviso" | "ok" | "marca" }> = {
  borrador: { texto: "Borrador", tono: "neutro" },
  en_revision: { texto: "En revisión", tono: "marca" },
  observado: { texto: "Con observaciones", tono: "aviso" },
  aprobado: { texto: "Aprobado", tono: "ok" },
};

function fecha(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titulo(s: Solicitud) {
  const nombre = String(s.datos.asignatura ?? s.datos.nombrePrograma ?? s.datos.tema ?? "").trim();
  return nombre || TIPOS[s.tipo].nombre;
}

export default async function Inicio() {
  const solicitudes = await listar();
  const enCurso = solicitudes.filter((s) => !s.envio.enviado).length;
  const enviados = solicitudes.filter((s) => s.envio.enviado).length;

  return (
    <>
      <header className="relative isolate overflow-hidden bg-brand text-white">
        <HeroOrbs className="text-white opacity-10" />
        <div className="relative mx-auto w-full max-w-350 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 flex justify-center">
            <Marca modo="white" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow className="text-white/80">Experiencia del Cliente</Eyebrow>
            <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Sala de Comunicados
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
              Del pedido del área académica hasta la lista de envío, en un solo recorrido: se
              registra la solicitud, se redacta con apoyo, pasa por jefatura y termina en un CSV
              listo para Yamm.
            </p>
          </div>

          {solicitudes.length > 0 && (
            <div className="mt-9 flex items-center justify-center gap-6 sm:gap-8">
              <Cifra n={enCurso} label="En curso" />
              <span aria-hidden className="h-10 w-px bg-white/30" />
              <Cifra n={enviados} label="Enviados" />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-7">
          <Tarjeta titulo="Nuevo comunicado" hint="El tipo define qué datos se piden">
            <NuevoComunicado />
          </Tarjeta>

          <Tarjeta
            titulo="Comunicados registrados"
            hint={`${solicitudes.length} ${solicitudes.length === 1 ? "solicitud" : "solicitudes"}`}
          >
            {solicitudes.length === 0 ? (
              <Vacio>
                Todavía no hay comunicados registrados. Empieza uno con el formulario de arriba.
              </Vacio>
            ) : (
              <ul className="divide-y divide-line">
                {solicitudes.map((s) => {
                  const e = s.envio.enviado ? { texto: "Enviado", tono: "ok" as const } : ESTADO[s.estado];
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/solicitud/${s.id}`}
                        className="group -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-adipa-control px-2 py-3 transition hover:bg-brand-soft"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-brand-navy">
                            {titulo(s)}
                          </span>
                          <span className="block text-xs text-ink-subtle">
                            {TIPOS[s.tipo].nombre} · {PROGRAMAS[s.programa].nombre} ·{" "}
                            {s.paises.map((p) => PAISES[p].nombre).join(" · ")} · paso {s.paso} de 6 ·{" "}
                            {fecha(s.actualizada)}
                            {s.contactos.length > 0 &&
                              ` · ${destinatarios(s).length} estudiantes`}
                          </span>
                        </span>
                        <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
                        <CaretRightIcon
                          aria-hidden
                          className="size-4 text-ink-subtle transition group-hover:text-brand"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>
        </div>
      </main>
    </>
  );
}

function Cifra({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[28px] font-bold tabular-nums">{n}</p>
      <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-white/70">{label}</p>
    </div>
  );
}
