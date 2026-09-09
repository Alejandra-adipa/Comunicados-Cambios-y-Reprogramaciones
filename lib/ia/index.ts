import type { IAProvider } from "./provider";
import { ProveedorSimulado } from "./mock";
import { ProveedorClaude } from "./claude";

/**
 * Selector del proveedor de redacción.
 * Por defecto, simulado: esta versión no llama a ningún servicio externo.
 */
export function obtenerProveedor(): IAProvider {
  const cual = (process.env.IA_PROVIDER ?? "simulado").toLowerCase();
  switch (cual) {
    case "claude":
      return new ProveedorClaude();
    case "simulado":
    default:
      return new ProveedorSimulado();
  }
}

export * from "./provider";
export { plantilla } from "./plantillas";
