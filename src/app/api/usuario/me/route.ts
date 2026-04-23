import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
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
  const id = await getUserId();
  if (!id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const user = await prisma.usuario.findUnique({ where: { id } });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const id = await getUserId();
  if (!id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome, email, senha } = await req.json();

  try {
    const dataToUpdate: any = { nome, email };
    let senhaAlterada = false;

    if (senha && senha.trim() !== "") {
      dataToUpdate.senhaHash = await bcrypt.hash(senha, 10);
      senhaAlterada = true;
    }

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });

    if (senhaAlterada) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: atualizado.email,
        subject: "Segurança: Sua senha foi alterada",
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Confirmação de Alteração</h2>
            <p>Olá, <strong>${atualizado.nome}</strong>,</p>
            <p>Este e-mail confirma que a sua senha de acesso ao <strong>Sistema de Controle de DFDs</strong> foi alterada recentemente.</p>
            <p style="background: #fef9c3; padding: 10px; border-left: 4px solid #facc15;">
              <strong>Se não foi você</strong> quem realizou esta alteração, entre em contato com o setor de TI imediatamente.
            </p>
            <p>Caso tenha sido você, pode ignorar este aviso.</p>
            <br>
            <p><em>Prefeitura Municipal - Setor de TI</em></p>
          </div>
        `,
      });
    }

    return NextResponse.json({ sucesso: true, user: atualizado });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar dados ou e-mail já em uso." },
      { status: 400 },
    );
  }
}
