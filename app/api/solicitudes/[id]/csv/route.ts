import { NextResponse } from "next/server";
import { cargar } from "@/lib/api";
import { csvDestinatarios } from "@/lib/destinatarios";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { s, error } = await cargar(id);
  if (error) return error;

  return new NextResponse(csvDestinatarios(s), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="destinatarios-${id.slice(0, 8)}.csv"`,
    },
  });
}
