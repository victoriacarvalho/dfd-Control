import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    const token = await new SignJWT({
      id: usuario.id,
      email: usuario.email,
      primeiroAcesso: usuario.primeiroAcesso,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("12h")
      .sign(secret);

    const response = NextResponse.json({
      sucesso: true,
      primeiroAcesso: usuario.primeiroAcesso,
    });
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
