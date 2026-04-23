"use client";

import { useEffect, useState, Suspense, ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Loader2, ArrowLeft } from "lucide-react";

interface DadosEquipamento {
  secretaria: string;
  total: number;
  itens: {
    especificacao: string;
    nome: string;
    quantidade: number;
  }[];
}

function EquipamentosContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const nome = decodeURIComponent(params.nome as string);
  const processoId = searchParams.get("processoId"); // <-- Captura o processo

  const [dados, setDados] = useState<DadosEquipamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = processoId
      ? `/api/equipamentos/${encodeURIComponent(nome)}?processoId=${processoId}`
      : `/api/equipamentos/${encodeURIComponent(nome)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setDados(data))
      .catch(() => setDados([]))
      .finally(() => setLoading(false));
  }, [nome, processoId]);

  const totalGeral = dados.reduce((acc, cur) => acc + cur.total, 0);

  const chartData = dados.map((d) => ({
    name: d.secretaria,
    total: d.total,
  }));

  const dadosOrdenados = [...dados].sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* BOTÃO DE VOLTAR CORRIGIDO */}
        <button
          onClick={() =>
            router.push(processoId ? `/processo/${processoId}` : "/processos")
          }
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        <div>
          <h1 className="text-3xl font-extrabold capitalize text-slate-800">
            {nome.replace("-", " ")}
          </h1>
          <p className="text-slate-500">Análise detalhada por secretaria</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-xs text-slate-500 uppercase">Total Geral</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? (
                <Loader2 className="animate-spin text-blue-600" />
              ) : (
                totalGeral
              )}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-xs text-slate-500 uppercase">Secretarias</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? (
                <Loader2 className="animate-spin text-blue-600" />
              ) : (
                dados.length
              )}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">
            Distribuição por Secretaria
          </h2>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Nenhum dado disponível neste processo
            </div>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-400">
              Carregando dados...
            </div>
          ) : dadosOrdenados.length === 0 ? (
            <div className="text-center text-slate-400">
              Nenhum dado encontrado.
            </div>
          ) : (
            dadosOrdenados.map((sec, index) => (
              <div
                key={index}
                className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    {sec.secretaria}
                  </h3>
                  <span className="text-sm font-bold text-blue-600">
                    {sec.total} unidades
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  {sec.itens.map((item, j) => (
                    <div
                      key={j}
                      className="flex justify-between border-b last:border-none pb-1 pt-2">
                      <div>
                        <p className="font-medium text-slate-800">
                          {item.nome}
                        </p>
                        <ul className="text-xs text-slate-600 mt-2 space-y-1">
                          {(item.especificacao || "Não informada")
                            .replace(/\n/g, ",")
                            .split(",")
                            .map((spec: string, i: number) => (
                              <li key={i}>• {spec.trim()}</li>
                            ))}
                        </ul>
                      </div>
                      <span className="font-medium text-slate-800">
                        {item.quantidade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function EquipamentoDetalhe() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }>
      <EquipamentosContent />
    </Suspense>
  );
}
