import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    }

    // ==========================================
    // AQUI ENTRA A INTEGRAÇÃO COM A IA (Ex: API do Gemini)
    // Você enviaria o 'file' para a API ler o PDF.
    // Para este MVP rodar na sua máquina agora,
    // vamos simular que a IA já leu o documento e retornou este JSON:
    // ==========================================
    const dadosExtraidosPelaIA = {
      secretaria: "Secretaria Municipal de Educação",
      equipamentos: [
        { nome: "Notebook Dell Inspiron", quantidade: 15 },
        { nome: "Projetor Epson", quantidade: 3 },
        { nome: "Roteador Wi-Fi 6", quantidade: 5 },
      ],
    };

    // 2. Salvar os dados extraídos no Banco de Dados via Prisma
    const novoDfd = await prisma.dfd.create({
      data: {
        secretaria: dadosExtraidosPelaIA.secretaria,
        equipamentos: {
          create: dadosExtraidosPelaIA.equipamentos,
        },
      },
      include: {
        equipamentos: true,
      },
    });

    return NextResponse.json({ success: true, data: novoDfd });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao processar DFD" },
      { status: 500 },
    );
  }
}
