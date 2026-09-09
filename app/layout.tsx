import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/**
 * Poppins es la tipografía de marca. El peso máximo en producto digital es
 * Bold (700): el 800 se lee demasiado cargado en pantalla (DESIGN.md §11.2).
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sala de Comunicados · Adipa",
  description:
    "Del pedido de un comunicado hasta la lista de envío, en un solo recorrido.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full font-sans flex flex-col">{children}</body>
    </html>
  );
}
