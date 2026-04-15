"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<any[]>([]);

  // Simulação de busca de dados do banco para o gráfico
  const fetchDashboardData = async () => {
    // Em produção, você chamaria um GET /api/dashboard aqui.
    // Dados de exemplo simulando o retorno do banco de dados:
    setDashboardData([
      { name: "Notebooks", quantidade: 45 },
      { name: "Projetores", quantidade: 12 },
      { name: "Roteadores", quantidade: 20 },
      { name: "Monitores", quantidade: 30 },
    ]);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("Processando documento com IA...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-dfd", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStatus("DFD processado e salvo com sucesso!");
        // Atualiza o gráfico após o upload
        fetchDashboardData();
      } else {
        setStatus("Erro ao processar arquivo.");
      }
    } catch (error) {
      setStatus("Erro na conexão.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-900">
          Sistema de Controle de DFDs
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Painel de Upload */}
          <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Anexar Novo DFD</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-blue-500 mb-2" />
                  <span className="text-sm text-gray-500">
                    {file ? file.name : "Clique para anexar PDF ou DOCX"}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={!file}
                className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition">
                Processar e Extrair Dados
              </button>
            </form>
            {status && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" /> {status}
              </div>
            )}
          </div>

          {/* Dashboard */}
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6">
              Volume de Equipamentos Solicitados
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="quantidade"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
