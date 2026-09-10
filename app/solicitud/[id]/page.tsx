import { notFound } from "next/navigation";
import { leer } from "@/lib/store";
import { Asistente } from "@/components/Asistente";
import { Marca } from "@/components/Marca";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitud({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solicitud = await leer(id);
  if (!solicitud) notFound();
  // El logo se resuelve acá, en el servidor, y baja como nodo hasta la vista
  // del correo: así no hace falta comprobar el archivo desde el navegador.
  return <Asistente inicial={solicitud} marca={<Marca alto="h-9" />} />;
}
