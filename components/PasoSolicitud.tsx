"use client";

import type { Solicitud } from "@/lib/modelo";
import type { PropsPaso } from "./paso";
import { DIAS, TIPOS, TIPO_KEYS, camposDe, type Campo } from "@/lib/tipos";
import {
  PAISES,
  PAIS_KEYS,
  PROGRAMAS,
  PROGRAMA_KEYS,
  catalogos,
  type PaisKey,
  type ProgramaKey,
} from "@/lib/catalogos";
import { Tarjeta, Aviso, Etiqueta } from "./ui";
import { TarjetaOpcion } from "./NuevoComunicado";
import { CampoCatalogo } from "./CampoCatalogo";
import { HorariosPorPais } from "./HorariosPorPais";
import { ClasesAfectadas } from "./ClasesAfectadas";

/** Todo lo que falta para poder pasar a la redacción. */
export function faltantes(s: Solicitud): string[] {
  const def = TIPOS[s.tipo];
  const pendientes: string[] = [];

  for (const c of camposDe(s.tipo, s.programa)) {
    if (!c.req) continue;
    const v = s.datos[c.k];
    const vacio = Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
    if (vacio) pendientes.push(c.l.toLowerCase());
  }

  if (s.paises.length === 0) pendientes.push("países afectados");

  // Un comunicado sobre clases sin ninguna clase cargada saldría sin calendario.
  if (def.clases && s.alcance === "clase") {
    const utiles = s.clases.filter((c) => c.numero || c.fechaOriginal || c.fechaNueva);
    if (utiles.length === 0) pendientes.push("al menos una clase afectada");
    else if (def.clases.conFechaNueva && utiles.some((c) => !c.fechaNueva)) {
      pendientes.push("la nueva fecha de cada clase");
    } else if (def.clases.conFechaOriginal && utiles.some((c) => !c.fechaOriginal)) {
      pendientes.push("la fecha de cada clase");
    }
  }

  if (def.horarios) {
    const sinHorario = s.paises.filter((p) => !(s.horarios[p] ?? "").trim());
    for (const p of sinHorario) pendientes.push(`horario de ${PAISES[p].nombre}`);
  }

  // Si el enlace cambia, hay que publicar el nuevo.
  const pideZoom = def.zoomSiempre || !s.zoomSeMantiene;
  if (pideZoom && !s.zoom.link.trim()) pendientes.push("enlace de Zoom");

  return pendientes;
}

/**
 * Cosas que no impiden avanzar, pero que producirían un comunicado sin
 * sentido para el estudiante. Se avisan; la decisión sigue siendo de quien
 * redacta.
 */
export function advertencias(s: Solicitud): string[] {
  const avisos: string[] = [];
  const d = s.datos;

  if (s.tipo === "reprogramacion" && d.fechaOriginal && d.fechaOriginal === d.fechaNueva) {
    avisos.push(
      "La nueva fecha es la misma que la original. El comunicado diría que la clase se reprogramó para el mismo día.",
    );
  }

  return avisos;
}

export function PasoSolicitud({ s, set }: PropsPaso) {
  const def = TIPOS[s.tipo];
  const campos = camposDe(s.tipo, s.programa);
  const pendientes = faltantes(s);
  const avisos = advertencias(s);
  const pideZoom = def.zoomSiempre || !s.zoomSeMantiene;

  const campo = (k: string, v: string | string[]) => set({ datos: { ...s.datos, [k]: v } });

  function alternarPais(p: PaisKey) {
    const dentro = s.paises.includes(p);
    const paises = dentro ? s.paises.filter((x) => x !== p) : [...s.paises, p];
    // El horario de un país que sale deja de tener sentido.
    const horarios = { ...s.horarios };
    if (dentro) delete horarios[p];
    set({ paises: PAIS_KEYS.filter((k) => paises.includes(k)), horarios });
  }

  return (
    <>
      <Tarjeta titulo="Tipo de programa" hint="Define qué datos se piden y quién valida">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PROGRAMA_KEYS.map((k) => (
            <TarjetaOpcion
              key={k}
              nombre={PROGRAMAS[k].nombre}
              desc={PROGRAMAS[k].desc}
              activo={s.programa === k}
              onClick={() => set({ programa: k })}
            />
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-sm font-semibold text-brand-navy">¿Sobre qué se comunica?</p>
          <div className="flex flex-wrap gap-2">
            <Pildora
              activo={s.alcance === "inicio"}
              onClick={() => set({ alcance: "inicio" })}
              texto="Inicio del programa"
            />
            <Pildora
              activo={s.alcance === "clase"}
              onClick={() => set({ alcance: "clase" })}
              texto="Clases específicas"
            />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Tipo de comunicado" hint="Cambiarlo cambia los campos de abajo">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {TIPO_KEYS.map((k) => (
            <TarjetaOpcion
              key={k}
              nombre={TIPOS[k].nombre}
              desc={TIPOS[k].desc}
              activo={s.tipo === k}
              onClick={() => set({ tipo: k })}
            />
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Países afectados" hint="Cada país recibe su propio horario">
        <div className="flex flex-wrap gap-2">
          {PAIS_KEYS.map((p) => (
            <Pildora
              key={p}
              activo={s.paises.includes(p)}
              onClick={() => alternarPais(p)}
              texto={PAISES[p].nombre}
            />
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo={`Datos de ${def.nombre.toLowerCase()}`} hint="Los campos varían según el tipo">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoFormulario
            campo={{
              k: "solicitante",
              l: "Quién lo solicita",
              t: "text",
              cat: "solicitantes",
              req: true,
            }}
            valor={s.solicitante}
            programa={s.programa}
            onChange={(v) => set({ solicitante: String(v) })}
          />
          {campos.map((c) => (
            <CampoFormulario
              key={c.k}
              campo={c}
              valor={s.datos[c.k] ?? ""}
              programa={s.programa}
              onChange={(v) => campo(c.k, v)}
            />
          ))}
        </div>
      </Tarjeta>

      {def.clases && s.alcance === "clase" && (
        <ClasesAfectadas
          s={s}
          set={set}
          titulo={def.clases.titulo}
          conFechaOriginal={def.clases.conFechaOriginal}
          conFechaNueva={def.clases.conFechaNueva}
        />
      )}

      {def.horarios && <HorariosPorPais s={s} set={set} titulo={def.horarios} />}

      <Tarjeta
        titulo="Conexión a la sesión"
        hint={def.zoomSiempre ? "La reunión tiene su propio enlace" : "Las sesiones son por Zoom"}
      >
        {!def.zoomSiempre && (
          <div className="mb-4">
            <p className="mb-1.5 text-sm font-semibold text-brand-navy">
              ¿El enlace de Zoom se mantiene?
            </p>
            <div className="flex flex-wrap gap-2">
              <Pildora
                activo={s.zoomSeMantiene}
                onClick={() => set({ zoomSeMantiene: true })}
                texto="Sí"
              />
              <Pildora
                activo={!s.zoomSeMantiene}
                onClick={() => set({ zoomSeMantiene: false })}
                texto="No"
              />
            </div>
            {s.zoomSeMantiene && (
              <p className="mt-2 text-xs text-ink-subtle">
                El comunicado indicará que se usa el enlace habitual, disponible en el aula virtual.
              </p>
            )}
          </div>
        )}

        {pideZoom && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="z-link" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                Enlace de Zoom <span className="text-xs font-normal text-ink-subtle">obligatorio</span>
              </label>
              <input
                id="z-link"
                type="text"
                value={s.zoom.link}
                placeholder="https://zoom.us/j/00000000000"
                onChange={(e) => set({ zoom: { ...s.zoom, link: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor="z-id" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                ID de reunión
              </label>
              <input
                id="z-id"
                type="text"
                value={s.zoom.id}
                placeholder="000 0000 0000"
                onChange={(e) => set({ zoom: { ...s.zoom, id: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor="z-cod" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                Código de acceso
              </label>
              <input
                id="z-cod"
                type="text"
                value={s.zoom.codigo}
                placeholder="123456"
                onChange={(e) => set({ zoom: { ...s.zoom, codigo: e.target.value } })}
              />
            </div>
          </div>
        )}
      </Tarjeta>

      {pendientes.length > 0 && (
        <Aviso tono="aviso">
          Falta completar <strong className="font-semibold">{pendientes.join(", ")}</strong> antes de
          pasar a la redacción.
        </Aviso>
      )}

      {avisos.map((a) => (
        <Aviso key={a} tono="aviso">
          {a}
        </Aviso>
      ))}
    </>
  );
}

function Pildora({
  activo,
  onClick,
  texto,
}: {
  activo: boolean;
  onClick: () => void;
  texto: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`rounded-adipa-control border px-3.5 py-1.5 text-sm font-medium transition ${
        activo ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/30"
      }`}
    >
      {texto}
    </button>
  );
}

function CampoFormulario({
  campo: c,
  valor,
  programa,
  onChange,
}: {
  campo: Campo;
  valor: string | string[];
  programa: ProgramaKey;
  onChange: (v: string | string[]) => void;
}) {
  const ancho = c.t === "textarea" || c.t === "dias" ? "sm:col-span-2" : "";
  const id = `f-${c.k}`;

  return (
    <div className={ancho}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-brand-navy"
      >
        {c.l}
        {c.req && <span className="text-xs font-normal text-ink-subtle">obligatorio</span>}
        {c.interno && <Etiqueta tono="neutro">uso interno</Etiqueta>}
      </label>

      {c.cat ? (
        <CampoCatalogo
          id={id}
          // El catálogo de programas depende del tipo elegido arriba.
          opciones={c.cat === "programas" ? catalogos.programas(programa) : catalogos[c.cat]()}
          valor={String(valor)}
          onChange={onChange}
        />
      ) : c.t === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          placeholder={c.ph}
          value={String(valor)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : c.t === "select" ? (
        <select id={id} value={String(valor)} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecciona…</option>
          {c.opts?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : c.t === "dias" ? (
        <div id={id} className="flex flex-wrap gap-1.5">
          {DIAS.map((d) => {
            const sel = Array.isArray(valor) && valor.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={sel}
                onClick={() => {
                  const actuales = Array.isArray(valor) ? valor : [];
                  onChange(sel ? actuales.filter((x) => x !== d) : [...actuales, d]);
                }}
                className={`rounded-adipa-control border px-3 py-1.5 text-sm font-medium transition ${
                  sel
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white hover:border-brand/30"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          id={id}
          type={c.t === "numero" ? "text" : c.t}
          inputMode={c.t === "numero" ? "numeric" : undefined}
          placeholder={c.ph}
          value={String(valor)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {c.interno && (
        <p className="mt-1 text-xs text-ink-subtle">
          Uso interno. No se incorpora literalmente en el comunicado: solo ajusta el tono.
        </p>
      )}
    </div>
  );
}
