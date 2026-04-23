import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { extractTextFromPDF } from "@/lib/pdf";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const processoId = formData.get("processoId") as string;

    if (!file || !processoId) {
      return NextResponse.json(
        { error: "Arquivo ou Processo não enviados" },
        { status: 400 },
      );
    } // --- NOVA BLINDAGEM: Verifica se o processo realmente existe no banco ---

    const processoExiste = await prisma.processo.findUnique({
      where: { id: processoId },
    });

    if (!processoExiste) {
      return NextResponse.json(
        {
          error:
            "Processo inválido ou não encontrado. Por favor, volte à lista de processos e entre novamente.",
        },
        { status: 404 },
      );
    } // -----------------------------------------------------------------------
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(arrayBuffer);

    const fileHash = crypto
      .createHash("sha256")
      .update(buffer)
      .update(processoId)
      .digest("hex");

    const arquivoJaExiste = await prisma.dfd.findFirst({
      where: {
        arquivoHash: fileHash,
        processoId: processoId,
      },
    });

    if (arquivoJaExiste) {
      return NextResponse.json(
        { error: "Este exato documento já foi cadastrado no sistema." },
        { status: 409 },
      );
    }

    const textoDoDocumento = await extractTextFromPDF(uint8);

    let textoString = "";

    if (textoDoDocumento) {
      textoString = String(textoDoDocumento).trim();
    }

    if (!textoString || textoString.length < 10) {
      return NextResponse.json(
        {
          error:
            "O PDF não contém texto legível (pode ser uma imagem escaneada ou estar vazio).",
        },
        { status: 422 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Retorne APENAS JSON válido.
          REGRAS IMPORTANTES:
          - PADRONIZE o nome da Secretaria principal (ex: "SECRETARIA MUNICIPAL DE SAÚDE"). NÃO INCLUA O NOME DO SETOR AQUI.
          - Identifique o Setor/Sub-setor/Departamento solicitante. Se não houver, retorne null.
          - Leia todo o arquivo e busque por essa informaçõ, as Vezes pode esta como Vigilancia em saúde e estar se referindo à VISA. 
          - Use o campo RESPONSÁVEL PELA
DEMANDA e E–MAIL do DFD no arquivo para juntar e localizar as secretarias.
          - Agrupe equipamentos iguais somando a quantidade.

REGRAS DE EXTRAÇÃO:
          1. 'secretaria': Nome da Secretaria Principal (ex: SECRETARIA MUNICIPAL DE SAUDE).
          2. 'setor': Sub-setor, unidade ou departamento (ex: VISA, UBS CENTRAL, CTA, CAPS). 
             - Procure por siglas e nomes próximos ao campo RESPONSÁVEL PELA DEMANDA ou e-mails.
             - "Vigilância em Saúde" ou "Vigilância Sanitária" deve ser extraído como "VISA".
             - "Centro de Testagem e Aconselhamento" deve ser extraído como "CTA".
          3. 'equipamentos': Lista de objetos com 'nome', 'quantidade' e 'especificacao'. Se não houver equipamentos, a lista deve ser vazia [].

          Formato exigido:
          {
            "secretaria": "NOME DA SECRETARIA PRINCIPAL",
            "setor": "Nome do sub-setor específico ou null",
            "equipamentos": [
              {
                "nome": "Equipamento",
                "quantidade": 1,
                "especificacao": "texto"
              }
            ]
          }`,
        },
        {
          role: "user",
          content: `Extraia os dados e retorne em JSON:\n\n${textoString}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
    });

    const dados = JSON.parse(completion.choices[0].message.content!);

    let rawSecretaria = dados.secretaria || "NÃO INFORMADA";
    let rawSetor = dados.setor || null;

    const separadorRegex = /[-–—]/;

    if (separadorRegex.test(rawSecretaria)) {
      const partes = rawSecretaria.split(separadorRegex);
      rawSecretaria = partes[0];

      if (!rawSetor && partes[1]) {
        rawSetor = partes[1];
      }
    }

    const secretariaLimpa = rawSecretaria.toUpperCase().trim();
    const setorLimpo = rawSetor ? rawSetor.trim() : null;

    const ultima = await prisma.dfd.findFirst({
      where: { secretaria: secretariaLimpa, processoId: processoId },
      orderBy: { versao: "desc" },
    });

    const versao = ultima ? ultima.versao + 1 : 1; // --- NOVA FORMA DE SALVAR: Usando o método 'connect' do Prisma ---

    const novo = await prisma.dfd.create({
      data: {
        secretaria: secretariaLimpa,
        setor: setorLimpo,
        arquivoHash: fileHash,
        versao,
        processo: {
          connect: { id: processoId }, // Conecta ao processo de forma segura
        },
        equipamentos: {
          create: (dados.equipamentos || []).map((eq: any) => ({
            nome: eq.nome?.toUpperCase().trim() || "DESCONHECIDO",
            quantidade: Number(eq.quantidade) || 1,
            especificacao: eq.especificacao || "Não informada",
          })),
        },
      },
    });

    return NextResponse.json({ sucesso: true, data: novo });
  } catch (error: any) {
    if (error?.status === 429 || error?.response?.status === 429) {
      return NextResponse.json(
        {
          error:
            "Limite de uso da IA atingido. Por favor, aguarde alguns minutos antes de enviar novos PDFs.",
        },
        { status: 429 },
      );
    }

    console.error("ERRO UPLOAD:", error);

    return NextResponse.json(
      { error: "Erro interno no servidor ou falha na leitura do PDF" },
      { status: 500 },
    );
  }
}
