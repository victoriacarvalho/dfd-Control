import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.dfd.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: "admin",
    },
  });

  await prisma.log.create({
    data: {
      acao: "DELETE",
      entidade: "DFD",
      entidadeId: id,
      usuario: "admin",
    },
  });

  return Response.json({ sucesso: true });
}
