import { prisma } from "@/lib/prisma";

export async function GET() {
  const dados = await prisma.dfd.findMany({
    where: {
      deletedAt: { not: null },
    },
    include: {
      equipamentos: true,
    },
  });

  return Response.json(dados);
}
