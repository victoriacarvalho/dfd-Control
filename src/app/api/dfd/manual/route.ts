import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const normalizarSetor = (str: string | null) => {
  if (!str) return null;
  const textoLimpo = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  const mapaSinonimos: Record<string, string> = {
    "VIGILANCIA EM SAUDE": "VISA",
    "VIGILANCIA SANITARIA": "VISA",
    "CENTRO DE TESTAGEM E ACONSELHAMENTO": "CTA",
    "UNIDADE BASICA DE SAUDE": "UBS",
  };
  return mapaSinonimos[textoLimpo] || textoLimpo;
};

const normalizarParaBanco = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

export async function POST(req: Request) {
  try {
    const { processoId, secretaria, setor, equipamentos } = await req.json();

    if (
      !processoId ||
      !secretaria ||
      !equipamentos ||
      equipamentos.length === 0
    ) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // Criamos um hash fictício único já que não temos um PDF real
    const fileHash = `manual-${crypto.randomBytes(16).toString("hex")}`;

    const secretariaLimpa = normalizarParaBanco(secretaria);
    const setorLimpo = normalizarSetor(setor);

    const ultima = await prisma.dfd.findFirst({
      where: { secretaria: secretariaLimpa, processoId: processoId },
      orderBy: { versao: "desc" },
    });

    const versao = ultima ? ultima.versao + 1 : 1;

    const novo = await prisma.dfd.create({
      data: {
        secretaria: secretariaLimpa,
        setor: setorLimpo,
        arquivoHash: fileHash,
        versao,
        processo: { connect: { id: processoId } },
        equipamentos: {
          create: equipamentos.map((eq: any) => ({
            nome: String(eq.nome).toUpperCase().trim(),
            quantidade: Number(eq.quantidade) || 1,
            especificacao: String(
              eq.especificacao || "Não informada na inserção manual",
            ),
          })),
        },
      },
    });

    return NextResponse.json({ sucesso: true, data: novo });
  } catch (error) {
    console.error("ERRO MANUAL:", error);
    return NextResponse.json(
      { error: "Erro ao salvar DFD manual" },
      { status: 500 },
    );
  }
}
