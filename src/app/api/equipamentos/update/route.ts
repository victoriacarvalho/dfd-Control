import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A mesma função de limpeza que usamos no visual para garantir que os dados batam!
const normalizar = (str: string | null) => {
  if (!str) return null;
  let limpo = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  if (limpo === "VIGILANCIA EM SAUDE" || limpo === "VIGILANCIA SANITARIA")
    limpo = "VISA";
  if (limpo === "CENTRO DE TESTAGEM E ACONSELHAMENTO") limpo = "CTA";

  return limpo;
};

export async function PATCH(req: Request) {
  try {
    const { nome, secretaria, setor, processoId, novaQuantidade } =
      await req.json();

    // 1. Busca todos os equipamentos deste processo
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        dfd: {
          processoId: processoId,
          deletedAt: null,
        },
      },
      include: { dfd: true },
    });

    const nomeAlvo = normalizar(nome);
    const secAlvo = normalizar(secretaria);
    const setAlvo = normalizar(setor);

    const alvos = equipamentos.filter((eq) => {
      const nomeEq = normalizar(eq.nome);
      const secEq = normalizar(eq.dfd.secretaria);
      const setEq = normalizar(eq.dfd.setor);

      return nomeEq === nomeAlvo && secEq === secAlvo && setEq === setAlvo;
    });

    if (alvos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum equipamento encontrado para atualizar." },
        { status: 404 },
      );
    }

    const qtd = Number(novaQuantidade);

    if (qtd <= 0) {
      const ids = alvos.map((a) => a.id);
      await prisma.equipamento.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      await prisma.equipamento.update({
        where: { id: alvos[0].id },
        data: { quantidade: qtd },
      });

      if (alvos.length > 1) {
        const idsRestantes = alvos.slice(1).map((a) => a.id);
        await prisma.equipamento.deleteMany({
          where: { id: { in: idsRestantes } },
        });
      }
    }

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro na atualização:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar" },
      { status: 500 },
    );
  }
}
