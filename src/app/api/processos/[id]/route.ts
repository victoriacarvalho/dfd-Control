import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function getUserId() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    const { payload } = await jwtVerify(token, secret);
    return payload.id as string;
  } catch {
    return null;
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  if (!id || id === "undefined")
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();

  try {
    const processoExistente = await prisma.processo.findFirst({
      where: { id: id, usuarioId: userId },
    });

    if (!processoExistente)
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 },
      );

    await prisma.processo.update({
      where: { id: id },
      data: {
        ...(body.nome && { nome: body.nome }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  if (!id || id === "undefined")
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const processoExistente = await prisma.processo.findFirst({
      where: { id: id, usuarioId: userId },
    });

    if (!processoExistente)
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 },
      );

    // Exclusão segura
    await prisma.equipamento.deleteMany({ where: { dfd: { processoId: id } } });
    await prisma.dfd.deleteMany({ where: { processoId: id } });
    await prisma.processo.delete({ where: { id: id } });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir processo" },
      { status: 500 },
    );
  }
}
