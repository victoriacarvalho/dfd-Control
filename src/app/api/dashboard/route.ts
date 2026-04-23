import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const unificarItem = (nome: any, spec: any = "") => {
  const n = String(nome || "EQUIPAMENTO").toUpperCase().trim();
  const s = String(spec || "").toUpperCase().trim();
  const texto = `${n} ${s}`;
  
  let base = n;

  if (texto.includes("MICROCOMPUTADOR") || texto.includes("DESKTOP") || texto.includes("COMPUTADOR")) {
    base = "COMPUTADOR DESKTOP";
  } else if (texto.includes("NOTEBOOK") || texto.includes("LAPTOP")) {
    base = "NOTEBOOK";
  } else if (texto.includes("TABLET")) {
    base = "TABLET";
  }

  if (base.includes("COMPUTADOR") || base.includes("NOTEBOOK")) {
    if (texto.includes("16GB") || texto.includes("16 GB")) {
      return `${base} TIPO 2 (16GB)`;
    }
    
    if (texto.includes("4GB") || texto.includes("4 GB")) {
      return `${base} (4GB)`;
    }

    return `${base} TIPO 1 (8GB)`;
  }
  return base;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const processoId = searchParams.get("processoId");

    if (!processoId) {
      return NextResponse.json(
        { error: "ID do processo não fornecido" },
        { status: 400 },
      );
    }

    const dfds = await prisma.dfd.findMany({
      where: {
        processoId: processoId,
        deletedAt: null,
      },
      include: {
        equipamentos: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const equipamentosMap: Record<string, number> = {};
    dfds.forEach((dfd) => {
      dfd.equipamentos.forEach((eq) => {
        // 2. USANDO A FUNÇÃO AQUI!
        const nomeUnificado = unificarItem(eq.nome, eq.especificacao || "");
        equipamentosMap[nomeUnificado] = (equipamentosMap[nomeUnificado] || 0) + eq.quantidade;
      });
    });

    const grafico = Object.entries(equipamentosMap).map(([name, total]) => ({
      name,
      total,
    }));

    const historico = dfds.map((dfd) => ({
      id: dfd.id,
      data: new Date(dfd.createdAt).toLocaleDateString("pt-BR"),
      secretaria: dfd.secretaria,
      setor: dfd.setor,
      resumo: dfd.equipamentos
        .map((e) => `${e.quantidade}x ${e.nome}`)
        .join(", "),
    }));

    const totais = {
      dfds: dfds.length,
      equipamentos: Object.values(equipamentosMap).reduce((a, b) => a + b, 0),
      secretarias: new Set(dfds.map((d) => d.secretaria)).size,
    };

    return NextResponse.json({
      sucesso: true,
      dados: { grafico, historico, totais },
    });
  } catch (error) {
    console.error("ERRO DASHBOARD:", error);
    return NextResponse.json(
      { error: "Erro ao processar dados" },
      { status: 500 },
    );
  }
}