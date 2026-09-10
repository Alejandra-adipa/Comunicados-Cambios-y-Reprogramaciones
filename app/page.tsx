import { estadoAlmacen, listar } from "@/lib/store";
import { TIPOS } from "@/lib/tipos";
import { PAISES, PROGRAMAS } from "@/lib/catalogos";
import { destinatarios } from "@/lib/destinatarios";
import { NuevoComunicado } from "@/components/NuevoComunicado";
import { Marca } from "@/components/Marca";
import { ListaComunicados, type ResumenComunicado } from "@/components/ListaComunicados";
import { Tarjeta, Eyebrow, HeroOrbs, Aviso } from "@/components/ui";
import type { Solicitud } from "@/lib/modelo";

export const dynamic = "force-dynamic";

function fecha(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Baja al panel solo lo que la lista muestra, no la solicitud entera. */
function resumir(s: Solicitud): ResumenComunicado {
  const nombre = String(s.datos.asignatura ?? s.datos.nombrePrograma ?? s.datos.tema ?? "").trim();
  return {
    id: s.id,
    titulo: nombre || TIPOS[s.tipo].nombre,
    tipo: TIPOS[s.tipo].nombre,
    programa: PROGRAMAS[s.programa].nombre,
    paises: s.paises.map((p) => PAISES[p].nombre).join(" · "),
    paso: s.paso,
    fecha: fecha(s.actualizada),
    destinatarios: s.contactos.length > 0 ? destinatarios(s).length : 0,
    estado: s.envio.enviado ? "enviado" : s.estado,
  };
}

export default async function Inicio() {
  const solicitudes = await listar();
  const almacen = estadoAlmacen();
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
          {almacen.demostracion && (
            <Aviso tono="aviso">
              <strong className="font-semibold">Versión de demostración.</strong> Los comunicados que
              ves son inventados y los correos usan dominios que no existen.{" "}
              {almacen.efimero
                ? "Puedes abrirlos y recorrer el flujo, pero este espacio no conserva nada: no permite crear comunicados nuevos."
                : "Lo que hagas acá queda guardado y lo ve cualquiera que abra la dirección, así que no cargues datos reales de estudiantes."}{" "}
              Para trabajo real, usa la aplicación en tu equipo.
            </Aviso>
          )}

          <Tarjeta titulo="Nuevo comunicado" hint="El tipo define qué datos se piden">
            <NuevoComunicado puedeCrear={almacen.puedeCrear} />
          </Tarjeta>

          <Tarjeta
            titulo="Comunicados registrados"
            hint={`${solicitudes.length} ${solicitudes.length === 1 ? "solicitud" : "solicitudes"}`}
          >
            <ListaComunicados comunicados={solicitudes.map(resumir)} />
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
