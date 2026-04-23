import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
<<<<<<< HEAD
import { cookies } from "next/headers";
=======
import { cookies } from "next/headers"; 
>>>>>>> 5544a23ac2e6d3edf189a54fe551d4f71b16cec1

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token")?.value;

    if (!tokenCookie)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    const { payload } = await jwtVerify(tokenCookie, secret);

    const { novaSenha } = await req.json();
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: payload.id as string },
      data: { senhaHash, primeiroAcesso: false },
    });

    const novoToken = await new SignJWT({
      id: payload.id,
      email: payload.email,
      primeiroAcesso: false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("12h")
      .sign(secret);

    const response = NextResponse.json({ sucesso: true });
    response.cookies.set("token", novoToken, { httpOnly: true, path: "/" });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao trocar senha." },
      { status: 500 },
    );
  }
}
