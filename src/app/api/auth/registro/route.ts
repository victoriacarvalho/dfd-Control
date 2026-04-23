import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { nome, email } = await req.json();

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e e-mail são obrigatórios." },
        { status: 400 },
      );
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe)
      return NextResponse.json(
        { error: "E-mail já cadastrado." },
        { status: 400 },
      );

    const senhaAleatoria = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaAleatoria, 10);

    await prisma.usuario.create({
      data: { nome, email, senhaHash },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Acesso ao Sistema DFD - Prefeitura",
      html: `
        <h2>Olá, ${nome}!</h2>
        <p>Seu cadastro no sistema de controle de DFDs foi realizado.</p>
        <p>Sua senha provisória de primeiro acesso é: <strong>${senhaAleatoria}</strong></p>
        <p>Ao fazer o login, você será obrigado a cadastrar uma nova senha definitiva.</p>
      `,
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao criar usuário." },
      { status: 500 },
    );
  }
}
