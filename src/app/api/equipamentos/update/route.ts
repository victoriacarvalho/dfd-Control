import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    // 1. Já incluímos a especificação para não misturar itens!
    const {
      nome,
      secretaria,
      setor,
      processoId,
      novaQuantidade,
      especificacao,
    } = await req.json();

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
    const specAlvo = (especificacao || "").trim().toLowerCase();

    // 2. Colocamos o ': any' no eq!
    const alvos = equipamentos.filter((eq: any) => {
      const nomeEq = normalizar(eq.nome);
      const secEq = normalizar(eq.dfd.secretaria);
      const setEq = normalizar(eq.dfd.setor);
      const specEq = (eq.especificacao || "").trim().toLowerCase();

      return (
        nomeEq === nomeAlvo &&
        secEq === secAlvo &&
        setEq === setAlvo &&
        specEq === specAlvo
      );
    });

    if (alvos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum equipamento encontrado para atualizar." },
        { status: 404 },
      );
    }

    const qtd = Number(novaQuantidade);

    if (qtd <= 0) {
      // 3. Colocamos o ': any' no 'a' também para ele não reclamar na próxima linha!
      const ids = alvos.map((a: any) => a.id);
      await prisma.equipamento.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      await prisma.equipamento.update({
        where: { id: alvos[0].id },
        data: { quantidade: qtd },
      });

      if (alvos.length > 1) {
        // E aqui também!
        const idsRestantes = alvos.slice(1).map((a: any) => a.id);
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
