import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.equipamento.deleteMany({
    where: { dfdId: id },
  });

  await prisma.dfd.delete({
    where: { id },
  });

  return Response.json({ ok: true });
}
