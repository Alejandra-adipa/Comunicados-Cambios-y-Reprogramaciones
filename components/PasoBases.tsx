"use client";

import { useRef, useState } from "react";
import { FileXlsIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import type { PropsPaso } from "./paso";
import { api } from "@/lib/cliente";
import { PAISES, type PaisKey } from "@/lib/catalogos";
import { destinatarios, excluidos, resumenPorPais } from "@/lib/destinatarios";
import { Tarjeta, Boton, Aviso, Girador, Vacio } from "./ui";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PasoBases({ s, set }: PropsPaso) {
  /**
   * A qué países aplica el archivo que se está por subir.
   *
   * Arranca en el primer país que todavía no tiene listado, porque lo normal es
   * un archivo por aula. Marcar varios sigue disponible para el caso en que un
   * mismo listado sirva a más de un país, pero tiene que ser una decisión
   * explícita: si viniera todo marcado por defecto, dos archivos distintos
   * quedarían contados en todos los países.
   */
  const [destino, setDestino] = useState<PaisKey[]>(() => {
    const sinArchivo = s.paises.find((p) => !s.archivos.some((a) => a.paises.includes(p)));
    const inicial = sinArchivo ?? s.paises[0];
    return inicial ? [inicial] : [];
  });
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const resumen = resumenPorPais(s);
  const totalIncluidos = destinatarios(s).length;
  const totalExcluidos = excluidos(s).length;

  async function subir(archivos: FileList | File[] | null) {
    const lista = Array.from(archivos ?? []);
    if (lista.length === 0) return;

    if (destino.length === 0) {
      setErrores(["Indica al menos un país para este listado."]);
      return;
    }

    setSubiendo(true);
    setErrores([]);
    try {
      const { solicitud, errores } = await api.subirBases(s.id, lista, destino);
      set({ archivos: solicitud.archivos, contactos: solicitud.contactos });
      setErrores(errores);
    } catch (e) {
      setErrores([e instanceof Error ? e.message : "No se pudieron cargar los archivos."]);
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function quitar(idArchivo: string) {
    const actualizada = await api.quitarBase(s.id, idArchivo);
    set({ archivos: actualizada.archivos, contactos: actualizada.contactos });
  }

  return (
    <>
      <Tarjeta titulo="Cargar participantes" hint={`${s.contactos.length} filas leídas`}>
        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
          Sube el listado de participantes que descargas del aula virtual de cada país. Se leen
          archivos <span className="font-semibold">.xlsx</span> y{" "}
          <span className="font-semibold">.csv</span>, y los encabezados se detectan solos. Si el
          archivo trae columna de rol, solo pasan quienes figuran como estudiante.
        </p>

        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold text-brand-navy">
            ¿A qué países aplica este archivo?
          </p>
          <p className="mb-2 text-xs text-ink-muted">
            Puedes marcar varios si el mismo listado sirve a más de un país.
          </p>
          <div className="flex flex-wrap gap-2">
            {s.paises.map((p) => {
              const activo = destino.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={activo}
                  onClick={() =>
                    setDestino((prev) =>
                      // Se reordena según los países del comunicado para que el
                      // orden no dependa de en qué secuencia se hizo clic.
                      s.paises.filter((k) =>
                        prev.includes(k) ? k !== p : k === p,
                      ),
                    )
                  }
                  className={`rounded-adipa-control border px-3.5 py-1.5 text-sm font-medium transition ${
                    activo
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white hover:border-brand/30"
                  }`}
                >
                  {PAISES[p].nombre}
                </button>
              );
            })}
            {s.paises.length > 1 && (
              <Boton
                variante="sutil"
                onClick={() => setDestino(destino.length === s.paises.length ? [] : s.paises)}
              >
                {destino.length === s.paises.length ? "Ninguno" : "Todos"}
              </Boton>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            subir(e.dataTransfer.files);
          }}
          className={`rounded-adipa-card border-2 border-dashed px-5 py-8 text-center transition ${
            arrastrando ? "border-brand bg-brand-soft" : "border-line bg-brand-soft/50"
          }`}
        >
          <UploadSimpleIcon aria-hidden className="mx-auto size-6 text-ink-subtle" />
          <p className="mt-2 text-sm text-ink-muted">
            Arrastra aquí el listado{" "}
            {destino.length > 0 && (
              <>
                de{" "}
                <strong className="font-semibold">
                  {destino.map((p) => PAISES[p].nombre).join(" · ")}
                </strong>
              </>
            )}
            , o
          </p>
          <div className="mt-3 flex justify-center">
            <Boton
              variante="secundario"
              onClick={() => entrada.current?.click()}
              disabled={subiendo || destino.length === 0}
            >
              {subiendo ? (
                <>
                  <Girador /> Leyendo…
                </>
              ) : (
                "Elegir archivos"
              )}
            </Boton>
          </div>
          <input
            ref={entrada}
            type="file"
            accept=".xlsx,.xls,.csv"
            multiple
            hidden
            onChange={(e) => subir(e.target.files)}
          />
        </div>

        {errores.length > 0 && (
          <div className="mt-4 space-y-2">
            {errores.map((e, i) => (
              <Aviso key={i} tono="error">
                {e}
              </Aviso>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-ink-subtle">
          Más adelante estos listados pueden llegar directo desde el aula virtual, ya filtrados por
          rol. La carga manual seguirá disponible como respaldo.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Totales" hint="Por país y consolidado">
        {s.contactos.length === 0 ? (
          <Vacio>Sin participantes cargados todavía.</Vacio>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 font-semibold">País</th>
                    <th className="py-2 text-right font-semibold">Cargados</th>
                    <th className="py-2 text-right font-semibold">Reciben</th>
                    <th className="py-2 text-right font-semibold">Excluidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resumen.map((r) => (
                    <tr key={r.pais}>
                      <td className="py-2">
                        <span className="block">{r.nombre}</span>
                        <span className="block text-xs text-ink-subtle">
                          {s.archivos
                            .filter((a) => a.paises.includes(r.pais))
                            .map((a) => a.nombre)
                            .join(" · ") || "sin listado cargado"}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{r.cargados}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-brand-navy">
                        {r.incluidos}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-subtle">{r.excluidos}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line font-semibold text-brand-navy">
                    <td className="py-2">Consolidado</td>
                    <td className="py-2 text-right tabular-nums">{s.contactos.length}</td>
                    <td className="py-2 text-right tabular-nums">{totalIncluidos}</td>
                    <td className="py-2 text-right tabular-nums">{totalExcluidos}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {resumen.some((r) => r.compartidos > 0) && (
              <p className="mt-3 text-xs text-ink-subtle">
                Hay listados asignados a más de un país, así que las filas por país suman más que
                el consolidado. El consolidado cuenta a cada persona una sola vez.
              </p>
            )}
            <p className="mt-3 text-xs text-ink-subtle">
              El detalle de cada exclusión está en el paso siguiente.
            </p>
          </>
        )}
      </Tarjeta>

      <Tarjeta titulo="Archivos cargados">
        {s.archivos.length === 0 ? (
          <Vacio>Sin archivos todavía.</Vacio>
        ) : (
          <ul className="divide-y divide-line">
            {s.archivos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <FileXlsIcon aria-hidden className="size-5 shrink-0 text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-brand-navy">
                    {a.nombre}
                  </span>
                  <span className="block text-xs text-ink-subtle">
                    {a.paises.map((p) => PAISES[p].nombre).join(" · ")} · {a.filas}{" "}
                    {a.filas === 1 ? "participante" : "participantes"} · {fecha(a.cargado)}
                  </span>
                </span>
                <Boton variante="peligro" onClick={() => quitar(a.id)}>
                  <TrashIcon aria-hidden className="size-4" />
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}
