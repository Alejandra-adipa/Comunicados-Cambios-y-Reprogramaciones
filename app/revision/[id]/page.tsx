import { notFound } from "next/navigation";
import { leer } from "@/lib/store";
import { Revision } from "@/components/Revision";
import { Marca } from "@/components/Marca";

export const dynamic = "force-dynamic";

export default async function PaginaRevision({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solicitud = await leer(id);
  if (!solicitud) notFound();
  return <Revision inicial={solicitud} marca={<Marca contenedor="blanco" alto="h-8" />} />;
}
