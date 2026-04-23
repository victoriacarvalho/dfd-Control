import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.dfd.update({
    where: { id },
    data: { deletedAt: null },
  });

  return Response.json({ ok: true });
}
