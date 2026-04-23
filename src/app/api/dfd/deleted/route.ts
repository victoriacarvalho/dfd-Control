import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  }),
});

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
