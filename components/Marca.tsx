import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Logotipo oficial de Adipa.
 *
 * El archivo se sirve tal cual desde `public/brand/logos/`. El manual prohíbe
 * redibujarlo con CSS, SVG manual o tipografía, así que si el archivo no está,
 * este componente no dibuja nada: es preferible la ausencia de logo a una
 * imitación.
 *
 * Sobre fondos de marca el logo a color no puede ir directo (manual §6.1): solo
 * se permite sobre blanco o sobre el gris `#F3F4FF`. Para el resto —los heros
 * en morado, por ejemplo— se usa la caja blanca de la sección §5, que es
 * exactamente para lo que existe.
 */

/** Se prefiere el vector si algún día llega el `.svg` oficial. */
const EXTENSIONES = ["svg", "png"] as const;

function archivoDelLogo(): string | null {
  for (const ext of EXTENSIONES) {
    const nombre = `adipa-logotype-full-color.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", "brand", "logos", nombre))) {
      return `/brand/logos/${nombre}`;
    }
  }
  return null;
}

export function Marca({
  contenedor = "ninguno",
  alto = "h-8",
}: {
  /** "blanco" para fondos de marca, donde el logo a color no puede ir suelto. */
  contenedor?: "ninguno" | "blanco";
  /** Clase de altura de Tailwind. El ancho sigue la proporción del archivo. */
  alto?: string;
}) {
  const src = archivoDelLogo();
  if (!src) return null;

  // El SVG oficial se sirve tal cual: no se reescala ni se optimiza.
  // eslint-disable-next-line @next/next/no-img-element
  const logo = <img src={src} alt="Adipa" className={`${alto} w-auto`} />;

  if (contenedor === "ninguno") return logo;

  return (
    // Rectángulo horizontal con bordes redondeados, una de las cajas aprobadas.
    <span className="inline-flex items-center rounded-adipa-card bg-white px-5 py-3">{logo}</span>
  );
}
