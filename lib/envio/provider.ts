import type { Solicitud } from "../modelo";
import { PAIS_KEYS, type PaisKey } from "../catalogos";

/**
 * Contrato del envío, con la misma forma que el de la redacción.
 *
 * En esta versión solo existe la simulación. La configuración de remitente y
 * Reply-To vive acá desde ya, porque es la decisión que no se puede improvisar
 * el día que se conecte el correo institucional: las respuestas de los
 * estudiantes tienen que seguir llegando a la casilla de atención.
 */

export type ConfiguracionCorreo = {
  /** Cuenta institucional desde la que salen los comunicados. */
  remitente: string;
  nombreRemitente: string;
  /** Las respuestas vuelven a info@adipa.cl, que atiende a todos los países. */
  responderA: string;
};

export const CORREO: ConfiguracionCorreo = {
  remitente: "info@adipa.cl",
  nombreRemitente: "Coordinación de Experiencia del Cliente · Adipa",
  responderA: "info@adipa.cl",
};

/**
 * Cada país atiende en su propia casilla. Un comunicado de varios países tiene
 * que nombrarlas todas, o el estudiante de México termina escribiendo a Chile.
 */
export const CASILLAS: Record<PaisKey, string> = {
  cl: "sac@adipa.cl",
  ar: "sac@adipa.ar",
  mx: "sac@adipa.mx",
  co: "sac@adipa.co",
};

/** Las casillas de los países del comunicado, siempre en el mismo orden. */
export function casillasDe(paises: readonly PaisKey[]): string[] {
  const orden = PAIS_KEYS.filter((p) => paises.includes(p));
  return (orden.length > 0 ? orden : (["cl"] as PaisKey[])).map((p) => CASILLAS[p]);
}

export type ResultadoEnvio = {
  enviados: number;
  fecha: string;
  /** `true` cuando no salió ningún correo de verdad. */
  simulado: boolean;
  detalle: string;
};

export interface EnvioProvider {
  readonly nombre: string;
  readonly simulado: boolean;
  enviar(s: Solicitud, destinatarios: string[]): Promise<ResultadoEnvio>;
}

/** No manda nada. Registra el envío para dejar constancia de qué y cuándo. */
export class EnvioSimulado implements EnvioProvider {
  readonly nombre = "Envío simulado";
  readonly simulado = true;

  async enviar(_s: Solicitud, destinatarios: string[]): Promise<ResultadoEnvio> {
    // Latencia para que la interfaz se comporte como frente a un envío real.
    await new Promise((r) => setTimeout(r, 900));
    return {
      enviados: destinatarios.length,
      fecha: new Date().toISOString(),
      simulado: true,
      detalle: "No se envió ningún correo. El comunicado quedó registrado como enviado.",
    };
  }
}

/**
 * Punto de reemplazo para Gmail o Google Workspace.
 *
 * Cuando se implemente debe respetar `CORREO`: salir desde la cuenta
 * institucional y dejar `Reply-To` apuntando a la casilla de atención, para que
 * las respuestas de los estudiantes sigan entrando al sistema de tickets.
 */
export class EnvioGmail implements EnvioProvider {
  readonly nombre = "Gmail institucional";
  readonly simulado = false;

  async enviar(): Promise<ResultadoEnvio> {
    throw new Error(
      "El envío por Gmail no está implementado en esta versión. Usa ENVIO_PROVIDER=simulado.",
    );
  }
}

export function obtenerProveedorEnvio(): EnvioProvider {
  return (process.env.ENVIO_PROVIDER ?? "simulado").toLowerCase() === "gmail"
    ? new EnvioGmail()
    : new EnvioSimulado();
}
