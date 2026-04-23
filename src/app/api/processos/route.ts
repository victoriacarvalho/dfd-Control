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

export async function GET() {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const processos = await prisma.processo.findMany({
    where: { usuarioId: userId },
    include: { _count: { select: { dfds: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(processos);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome } = await req.json();
  const novo = await prisma.processo.create({
    data: {
      nome,
      usuarioId: userId,
      status: "ATIVO", // Garante que nasce ativo
    },
  });
  return NextResponse.json(novo);
}
