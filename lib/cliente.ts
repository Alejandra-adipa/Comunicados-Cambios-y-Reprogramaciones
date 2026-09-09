import type { Solicitud } from "./modelo";
import type { PaisKey } from "./catalogos";
import type { ResultadoEnvio } from "./envio/provider";

/** Llamadas a la API desde el navegador. */

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new Error(cuerpo?.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async nueva(tipo: string, programa: string): Promise<Solicitud> {
    const res = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, programa }),
    });
    return json<Solicitud>(res);
  },

  async obtener(id: string): Promise<Solicitud> {
    return json<Solicitud>(await fetch(`/api/solicitudes/${id}`, { cache: "no-store" }));
  },

  async actualizar(id: string, parche: Partial<Solicitud>): Promise<Solicitud> {
    const res = await fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parche),
    });
    return json<Solicitud>(res);
  },

  async eliminar(id: string): Promise<void> {
    await fetch(`/api/solicitudes/${id}`, { method: "DELETE" });
  },

  async subirBases(
    id: string,
    archivos: File[],
    paises: PaisKey[],
  ): Promise<{ solicitud: Solicitud; errores: string[] }> {
    const fd = new FormData();
    for (const p of paises) fd.append("paises", p);
    for (const a of archivos) fd.append("archivos", a);
    const res = await fetch(`/api/solicitudes/${id}/bases`, { method: "POST", body: fd });
    return json<{ solicitud: Solicitud; errores: string[] }>(res);
  },

  async quitarBase(id: string, archivo: string): Promise<Solicitud> {
    const res = await fetch(`/api/solicitudes/${id}/bases?archivo=${encodeURIComponent(archivo)}`, {
      method: "DELETE",
    });
    return json<Solicitud>(res);
  },

  /** Respuesta del validador desde su link de revisión. */
  async responderValidacion(
    id: string,
    accion: "aprobado" | "observaciones",
    comentario?: string,
  ): Promise<Solicitud> {
    const res = await fetch(`/api/solicitudes/${id}/validacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion, comentario }),
    });
    return json<Solicitud>(res);
  },

  async enviar(id: string): Promise<{ solicitud: Solicitud; resultado: ResultadoEnvio }> {
    const res = await fetch(`/api/solicitudes/${id}/envio`, { method: "POST" });
    return json<{ solicitud: Solicitud; resultado: ResultadoEnvio }>(res);
  },
};
