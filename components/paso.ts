import type { Solicitud } from "@/lib/modelo";

/** Contrato común de las seis pantallas del recorrido. */
export type PropsPaso = {
  s: Solicitud;
  set: (parche: Partial<Solicitud>) => void;
  ir: (paso: number) => void;
};
