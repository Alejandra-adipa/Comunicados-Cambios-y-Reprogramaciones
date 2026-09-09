import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Ranura para el logo oficial.
 *
 * El manual prohíbe reconstruir el logo con CSS, SVG manual o tipografía, así
 * que este componente solo muestra el archivo original si está en
 * `public/brand/logos/`. Si no está, no dibuja nada: es preferible la ausencia
 * de logo a una imitación. La existencia se comprueba en el servidor para no
 * mostrar una imagen rota mientras tanto.
 */
export function Marca({ modo = "full-color" }: { modo?: "full-color" | "white" }) {
  const archivo = `adipa-logotype-${modo}.svg`;
  const hay = existsSync(path.join(process.cwd(), "public", "brand", "logos", archivo));
  if (!hay) return null;

  return (
    // El SVG oficial se sirve tal cual: no se reescala ni se optimiza.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/brand/logos/${archivo}`} alt="Adipa" className="h-7 w-auto" />
  );
}
