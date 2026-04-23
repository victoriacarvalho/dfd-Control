import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ nome: string }> },
) {
  const { nome } = await context.params;
  const { searchParams } = new URL(req.url);
  const processoId = searchParams.get("processoId");
  const normalizar = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const nomeFiltro = normalizar(decodeURIComponent(nome));

  const dados = await prisma.equipamento.findMany({
    where: {
      dfd: {
        deletedAt: null,
        ...(processoId ? { processoId } : {}),
      },
    },
    include: {
      dfd: true,
    },
  });

  const agrupado: any = {};

  dados.forEach((eq: any) => {
    const nomeEquipamento = normalizar(eq.nome);

    if (nomeEquipamento !== nomeFiltro) return;

    const secNome = eq.dfd.secretaria
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    const setNome = eq.dfd.setor
      ? eq.dfd.setor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
      : null;

    const nomeCompleto = setNome ? `${secNome} - ${setNome}` : secNome;

    if (!agrupado[nomeCompleto]) {
      agrupado[nomeCompleto] = {
        secretaria: nomeCompleto,
        total: 0,
        itens: [],
      };
    }

    agrupado[nomeCompleto].total += eq.quantidade;

    const itemExistente = agrupado[nomeCompleto].itens.find(
      (i: any) => i.nome === eq.nome,
    );

    if (itemExistente) {
      itemExistente.quantidade += eq.quantidade;
    } else {
      agrupado[nomeCompleto].itens.push({
        nome: eq.nome,
        quantidade: eq.quantidade,
        especificacao: eq.especificacao,
      });
    }
  });

  return Response.json(Object.values(agrupado));
}
