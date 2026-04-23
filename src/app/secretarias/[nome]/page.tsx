import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Laptop } from "lucide-react";
import Link from "next/link";
import EditableRow from "./EditableRow"; // <-- NOVO IMPORT

export default async function SecretariaDetails({
  params,
  searchParams,
}: {
  params: Promise<{ nome: string }>;
  searchParams: Promise<{ processoId?: string }>;
}) {
  const resolvido = await params;
  const query = await searchParams;
  const processoId = query.processoId;

  const nomeSecretaria = decodeURIComponent(resolvido.nome)
    .toUpperCase()
    .trim();

  const dfds = await prisma.dfd.findMany({
    where: {
      secretaria: nomeSecretaria,
      deletedAt: null,
      ...(processoId ? { processoId } : {}),
    },
    include: { equipamentos: true },
    orderBy: { createdAt: "desc" },
  });

  const setoresMap = new Map<
    string,
    Map<string, { nome: string; quantidade: number; especificacao: string }>
  >();
  let totalEquipamentosGeral = 0;

  dfds.forEach((dfd) => {
    const nomeSetor = (dfd.setor || "Geral / Sede Administrativa")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

    if (!setoresMap.has(nomeSetor)) {
      setoresMap.set(nomeSetor, new Map());
    }

    const equipamentosDoSetor = setoresMap.get(nomeSetor)!;
    dfd.equipamentos.forEach((eq) => {
      const nomeEqPadrao = eq.nome.toUpperCase();
      const specPadrao = (eq.especificacao || "Sem especificação")
        .trim()
        .toLowerCase();
      const chaveUnica = `${nomeEqPadrao}|${specPadrao}`;

      totalEquipamentosGeral += eq.quantidade;

      if (equipamentosDoSetor.has(chaveUnica)) {
        const existente = equipamentosDoSetor.get(chaveUnica)!;
        equipamentosDoSetor.set(chaveUnica, {
          nome: nomeEqPadrao,
          quantidade: existente.quantidade + eq.quantidade,
          especificacao: existente.especificacao,
        });
      } else {
        equipamentosDoSetor.set(chaveUnica, {
          nome: nomeEqPadrao,
          quantidade: eq.quantidade,
          especificacao: eq.especificacao || "Sem especificação",
        });
      }
    });
  });
  const setoresAgrupados = Array.from(setoresMap.entries()).map(
    ([setorNome, equipamentosMap]) => ({
      nome: setorNome,
      // Como o nome já está guardado dentro do objeto, usamos apenas .values()
      equipamentos: Array.from(equipamentosMap.values()),
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href={processoId ? `/processo/${processoId}` : "/processos"}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {nomeSecretaria}
          </h1>
          <p className="text-slate-500 mt-2">
            Visão detalhada de solicitações dividida por
            departamentos/sub-setores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase">
                  Sub-setores Atendidos
                </p>
                <p className="text-3xl font-black text-slate-800">
                  {setoresAgrupados.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase">
                  Total de Equipamentos Solicitados
                </p>
                <p className="text-3xl font-black text-slate-800">
                  {totalEquipamentosGeral}
                </p>
              </div>
              <Laptop className="w-8 h-8 text-blue-200" />
            </CardContent>
          </Card>
        </div>

        {setoresAgrupados.length === 0 ? (
          <Card className="shadow-sm border-dashed bg-transparent shadow-none">
            <CardContent className="p-10 text-center text-slate-500">
              Nenhum dado encontrado para esta secretaria neste processo.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {setoresAgrupados.map((setor, index) => (
              <Card
                key={index}
                className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-100/50 border-b border-slate-200 py-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {setor.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase w-[10%]">
                          Qtd
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase w-[30%]">
                          Equipamento
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase w-[45%]">
                          Especificação Técnica Resumida
                        </th>
                        {/* NOVO CABEÇALHO PARA ACOMODAR OS BOTÕES */}
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase w-[15%] text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {setor.equipamentos.map((eq, eqIndex) => (
                        <EditableRow
                          key={eqIndex}
                          eq={eq}
                          setorNome={setor.nome}
                          secretariaNome={nomeSecretaria}
                          processoId={processoId || ""}
                        />
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
