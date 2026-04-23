import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const processoId = searchParams.get("processoId");

  const dados = await prisma.dfd.findMany({
    where: {
      deletedAt: { not: null },
      ...(processoId ? { processoId } : {}), // <-- Só procura os registos deste processo
    },
    orderBy: { deletedAt: "desc" },
  });

  return Response.json(dados);
}
