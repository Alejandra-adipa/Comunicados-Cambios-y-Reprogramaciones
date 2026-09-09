import type { Contacto, Solicitud } from "./modelo";
import { PAISES, type PaisKey } from "./catalogos";

/**
 * Clasificación de la lista consolidada. Sin dependencias de lectura de
 * archivos, para que las pantallas puedan usarla en el navegador.
 */

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type MotivoExclusion =
  | "profesor"
  | "gestor"
  | "monitor"
  | "otro_rol"
  | "correo_invalido"
  | "duplicado"
  | "manual";

export const TEXTO_MOTIVO: Record<MotivoExclusion, string> = {
  profesor: "Profesor",
  gestor: "Gestor",
  monitor: "Monitor",
  otro_rol: "Rol no habilitado",
  correo_invalido: "Correo inválido",
  duplicado: "Duplicado",
  manual: "Excluido a mano",
};

export type ContactoClasificado = Contacto & {
  excluido: boolean;
  motivo?: MotivoExclusion;
};

const normalizar = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/**
 * Traduce la columna de rol del aula virtual.
 *
 * Solo el estudiante recibe el comunicado. Un rol que no se reconoce tampoco
 * pasa: es preferible dejar a alguien fuera y revisarlo, a mandarle un
 * comunicado de estudiante a quien no lo es.
 */
export function motivoPorRol(rol: string): MotivoExclusion | null {
  const r = normalizar(rol);
  if (!r) return null; // El archivo no trae rol: no hay nada que filtrar.
  if (r.includes("estudiante") || r.includes("alumn") || r.includes("student")) return null;
  if (r.includes("profesor") || r.includes("docente") || r.includes("teacher")) return "profesor";
  if (r.includes("gestor") || r.includes("gestion") || r.includes("manager")) return "gestor";
  if (r.includes("monitor") || r.includes("tutor")) return "monitor";
  return "otro_rol";
}

/**
 * Reglas de la lista final, en orden de precedencia:
 *
 *  1. el rol dice que la persona no es estudiante;
 *  2. el correo no se puede enviar;
 *  3. la coordinadora lo dejó fuera a mano;
 *  4. el correo ya apareció antes — se conserva la primera aparición.
 */
export function clasificar(s: Solicitud): ContactoClasificado[] {
  const fuera = new Set(s.excluidos.map((c) => c.toLowerCase()));
  const yaVisto = new Set<string>();

  return s.contactos.map((c) => {
    const clave = c.correo.toLowerCase().trim();
    let motivo: MotivoExclusion | null = motivoPorRol(c.rol);

    if (!motivo && !CORREO_OK.test(c.correo)) motivo = "correo_invalido";
    if (!motivo && fuera.has(clave)) motivo = "manual";
    if (!motivo && yaVisto.has(clave)) motivo = "duplicado";

    // Solo un contacto que efectivamente entra ocupa el correo.
    if (!motivo) yaVisto.add(clave);

    return { ...c, excluido: motivo !== null, motivo: motivo ?? undefined };
  });
}

export function destinatarios(s: Solicitud): ContactoClasificado[] {
  return clasificar(s).filter((c) => !c.excluido);
}

export function excluidos(s: Solicitud): ContactoClasificado[] {
  return clasificar(s).filter((c) => c.excluido);
}

export type ResumenPais = {
  pais: PaisKey;
  nombre: string;
  cargados: number;
  incluidos: number;
  excluidos: number;
  /** De esos, cuántos vienen de un archivo compartido con otro país. */
  compartidos: number;
};

/**
 * Totales por país y consolidado, para el panel del paso de bases.
 *
 * Un listado puede estar asignado a varios países a la vez. En ese caso sus
 * contactos cuentan en cada uno, así que las filas por país pueden sumar más
 * que el consolidado —que cuenta a cada persona una sola vez—. `compartidos`
 * dice cuántos vienen de un archivo que sirve a más de un país.
 */
export function resumenPorPais(s: Solicitud): ResumenPais[] {
  const clasificados = clasificar(s);
  return s.paises.map((p) => {
    const delPais = clasificados.filter((c) => c.paises.includes(p));
    return {
      pais: p,
      nombre: PAISES[p].nombre,
      cargados: delPais.length,
      incluidos: delPais.filter((c) => !c.excluido).length,
      excluidos: delPais.filter((c) => c.excluido).length,
      compartidos: delPais.filter((c) => c.paises.length > 1).length,
    };
  });
}

/** Cuántos quedaron fuera por cada motivo. */
export function conteoPorMotivo(s: Solicitud): { motivo: MotivoExclusion; n: number }[] {
  const conteo = new Map<MotivoExclusion, number>();
  for (const c of excluidos(s)) {
    if (!c.motivo) continue;
    conteo.set(c.motivo, (conteo.get(c.motivo) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .map(([motivo, n]) => ({ motivo, n }))
    .sort((a, b) => b.n - a.n);
}

/** CSV para Yamm: una fila por destinatario. */
export function csvDestinatarios(s: Solicitud): string {
  // Las tres primeras columnas se mantienen en el orden de siempre para no
  // romper la plantilla de Yamm; país y rol se agregan al final.
  const cabecera = ["Nombre", "Apellidos", "Correo", "Grupos", "Origen", "País", "Rol"];
  const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const filas = destinatarios(s).map((c) =>
    [
      c.nombre,
      c.apellidos,
      c.correo,
      c.grupos,
      c.origen,
      c.paises.map((p) => PAISES[p].nombre).join(" · "),
      c.rol,
    ]
      .map(escapar)
      .join(","),
  );
  // BOM para que Excel abra los acentos correctamente.
  return "\uFEFF" + [cabecera.map(escapar).join(","), ...filas].join("\r\n");
}
