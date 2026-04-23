"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  UploadCloud,
  CheckCircle,
  FileText,
  LayoutDashboard,
  Laptop,
  Loader2,
  Trash2,
  Search,
  LogOut,
  User,
  Settings,
  ArrowLeft,
  Plus,
  X,
  Keyboard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  grafico: { name: string; total: number }[];
  historico: {
    setor: string;
    id: string;
    data: string;
    secretaria: string;
    resumo: string;
    status: string;
  }[];
  totais: { dfds: number; equipamentos: number; secretarias: number };
}

export default function Dashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: processoId } = React.use(params);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    grafico: [],
    historico: [],
    totais: { dfds: 0, equipamentos: 0, secretarias: 0 },
  });

  const [dfdToDelete, setDfdToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    nome: string;
    email: string;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", email: "", senha: "" });
  const [editStatus, setEditStatus] = useState("");

  // ESTADOS DO FORMULÁRIO MANUAL
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    secretaria: "",
    setor: "",
    equipamentos: [{ nome: "", quantidade: 1, especificacao: "" }],
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/dashboard?processoId=${processoId}`);
      const result = await response.json();
      if (result.sucesso) setDashboardData(result.dados);
    } catch (error) {
      console.error("Erro ao buscar dados");
    } finally {
      setIsLoadingData(false);
    }
  }, [processoId]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/usuario/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setEditForm({ nome: data.nome, email: data.email, senha: "" });
      }
    } catch (e) {
      console.error("Erro ao buscar usuário");
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
    fetchUser();
  }, [fetchDashboardData, fetchUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStatus("Salvando...");
    const res = await fetch("/api/usuario/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
      setIsEditModalOpen(false);
      setEditStatus("");
      setEditForm((prev) => ({ ...prev, senha: "" }));
      if (editForm.senha) alert("Perfil e senha atualizados!");
    } else {
      const data = await res.json();
      setEditStatus(data.error || "Erro ao salvar.");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoadingUpload(true);
    setStatus("Analisando e salvando DFD...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("processoId", processoId);

    try {
      const response = await fetch("/api/upload-dfd", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("DFD processado e salvo com sucesso!");
        setFile(null);
        fetchDashboardData();
      } else {
        setStatus(`Erro: ${result.error || "Falha no processamento."}`);
        setFile(null);
      }
    } catch {
      setStatus("Erro: Falha de conexão com o servidor.");
    } finally {
      setIsLoadingUpload(false);
    }
  };

  // FUNÇÕES DA INSERÇÃO MANUAL
  const handleAddEquipamento = () => {
    setManualForm({
      ...manualForm,
      equipamentos: [
        ...manualForm.equipamentos,
        { nome: "", quantidade: 1, especificacao: "" },
      ],
    });
  };

  const handleRemoveEquipamento = (index: number) => {
    const novos = [...manualForm.equipamentos];
    novos.splice(index, 1);
    setManualForm({ ...manualForm, equipamentos: novos });
  };

  const handleEquipamentoChange = (
    index: number,
    campo: string,
    valor: string | number,
  ) => {
    const novos = [...manualForm.equipamentos];
    novos[index] = { ...novos[index], [campo]: valor };
    setManualForm({ ...manualForm, equipamentos: novos });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const response = await fetch("/api/dfd/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manualForm, processoId }),
      });
      if (response.ok) {
        setIsManualModalOpen(false);
        setManualForm({
          secretaria: "",
          setor: "",
          equipamentos: [{ nome: "", quantidade: 1, especificacao: "" }],
        });
        setStatus("Dados inseridos manualmente com sucesso!");
        fetchDashboardData();
      } else {
        alert("Erro ao salvar dados manuais.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDownloadRelatorio = () =>
    (window.location.href = `/api/processos/${processoId}/relatorio`);
  const handleDelete = (id: string) => setDfdToDelete(id);
  const confirmDelete = async () => {
    if (!dfdToDelete) return;
    await fetch(`/api/dfd/${dfdToDelete}`, { method: "DELETE" });
    setDfdToDelete(null);
    fetchDashboardData();
  };

  if (!isMounted) return null;

  const filteredHistorico = dashboardData.historico.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      row.secretaria.toLowerCase().includes(term) ||
      (row.setor && row.setor.toLowerCase().includes(term)) ||
      row.resumo.toLowerCase().includes(term) ||
      row.data.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <button
              onClick={() => router.push("/processos")}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2 hover:underline uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3" /> Voltar para a Lista de Processos
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Controle de Demandas (DFD)
            </h1>
            <p className="text-slate-500 text-lg mt-1">
              Gestão de requisições de TI — Base de Dados Real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadRelatorio}
              variant="outline"
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hidden sm:flex">
              <FileText className="w-4 h-4 mr-2" /> Planilha de Demanda (Excel)
            </Button>
            <button
              onClick={() => router.push(`/lixeira?processoId=${processoId}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
              <Trash2 className="w-4 h-4" /> Lixeira
            </button>
            <div className="bg-white pl-4 pr-2 py-2 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block leading-tight">
                    Operador
                  </span>
                  <p className="text-sm font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {currentUser?.nome || "Carregando..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center border-l border-slate-100 pl-2 gap-1">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar Perfil">
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sair">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "DFDs Processados",
              val: dashboardData.totais.dfds,
              icon: FileText,
            },
            {
              label: "Total de Equipamentos",
              val: dashboardData.totais.equipamentos,
              icon: Laptop,
            },
            {
              label: "Secretarias Atendidas",
              val: dashboardData.totais.secretarias,
              icon: LayoutDashboard,
            },
          ].map((item, i) => (
            <Card key={i} className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-3xl font-black text-slate-800 mt-1">
                    {isLoadingData ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                    ) : (
                      item.val
                    )}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 shadow-sm border border-slate-200 flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Processar Novo DFD</CardTitle>
              <CardDescription>
                Envie o PDF ou insira os dados manualmente caso não tenha o
                arquivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all group flex items-center justify-center min-h-[120px]">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                  />
                  <div className="flex flex-col items-center space-y-2 pointer-events-none">
                    {file ? (
                      <FileText className="w-8 h-8 text-blue-600" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                    )}
                    <p className="font-medium text-sm text-slate-600 px-2">
                      {file ? file.name : "Arraste o PDF aqui"}
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={!file || isLoadingUpload}>
                  {isLoadingUpload ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Extraindo...
                    </>
                  ) : (
                    "Ler PDF e Salvar"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-3">
                  Não tem o documento em PDF?
                </p>
                <Button
                  onClick={() => setIsManualModalOpen(true)}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Keyboard className="w-4 h-4 mr-2" /> Cadastrar Manualmente
                </Button>
              </div>

              {status && (
                <div
                  className={`mt-4 p-3 rounded-md text-sm font-medium flex items-center gap-2 ${status.includes("Erro") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {!status.includes("Erro") && (
                    <CheckCircle className="w-4 h-4" />
                  )}{" "}
                  {status}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-sm border border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Demanda Consolidada</CardTitle>
              <CardDescription>
                Soma de todos os equipamentos extraídos e salvos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingData ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : dashboardData.grafico.length === 0 ? (
                <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BarChart className="w-12 h-12 opacity-20" />
                  <p>Nenhum dado cadastrado ainda.</p>
                </div>
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.grafico}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        stroke="#64748b"
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="total"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                        onClick={(data) => {
                          if (data && data.name) {
                            router.push(
                              `/equipamentos/${data.name.toLowerCase()}?processoId=${processoId}`,
                            );
                          }
                        }}
                        className="cursor-pointer hover:opacity-80"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg">
                  Histórico de DFDs Cadastrados
                </CardTitle>
                <CardDescription>
                  Registro exato dos documentos processados pela IA ou
                  digitados.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar secretaria, equipamento..."
                  className="pl-9 h-10 border-slate-200 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-200">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                      Data
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                      Secretaria Origem
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                      Equipamentos Extraídos
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingData ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-slate-400">
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredHistorico.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-slate-400">
                        Nenhum resultado.
                      </td>
                    </tr>
                  ) : (
                    filteredHistorico.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                          {row.data}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800">
                          <Link
                            href={`/secretarias/${encodeURIComponent(row.secretaria)}?processoId=${processoId}`}
                            className="font-bold text-blue-600 hover:underline">
                            {row.secretaria}
                          </Link>
                          {row.setor && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              ↳ {row.setor}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {row.resumo}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* MODAL INSERÇÃO MANUAL */}
        <AlertDialog
          open={isManualModalOpen}
          onOpenChange={setIsManualModalOpen}>
          <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Cadastrar DFD Manualmente</AlertDialogTitle>
              <AlertDialogDescription>
                Preencha os dados da Secretaria e a lista de equipamentos
                solicitados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Secretaria (Obrigatório)
                  </label>
                  <Input
                    required
                    placeholder="Ex: SECRETARIA DE SAÚDE"
                    value={manualForm.secretaria}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        secretaria: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Setor/Unidade (Opcional)
                  </label>
                  <Input
                    placeholder="Ex: VISA, UBS CENTRAL"
                    value={manualForm.setor}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, setor: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700">
                    Equipamentos Solicitados
                  </h3>
                </div>

                {manualForm.equipamentos.map((eq, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-lg border shadow-sm relative space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      <div className="w-full md:w-20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Qtd
                        </label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={eq.quantidade}
                          onChange={(e) =>
                            handleEquipamentoChange(
                              idx,
                              "quantidade",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Equipamento
                        </label>
                        <Input
                          required
                          placeholder="Ex: MICROCOMPUTADOR"
                          value={eq.nome}
                          onChange={(e) =>
                            handleEquipamentoChange(idx, "nome", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* NOVO CAMPO: Descrição Técnica */}
                    <div className="w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Especificação Técnica / Descrição
                      </label>
                      <textarea
                        className="w-full min-h-[80px] p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ex: Processador i5, 16GB RAM, SSD 512GB..."
                        value={eq.especificacao}
                        onChange={(e) =>
                          handleEquipamentoChange(
                            idx,
                            "especificacao",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {manualForm.equipamentos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipamento(idx)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 shadow-sm">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={handleAddEquipamento}
                  variant="outline"
                  className="w-full border-dashed border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-100">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar outro equipamento
                </Button>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmittingManual}>
                  {isSubmittingManual ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Salvando...
                    </>
                  ) : (
                    "Salvar no Banco"
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {/* Outros Modais (Excluir, Perfil) - mantidos iguais mas omitidos aqui para brevidade caso tivessem sidos alterados, o código de Delete já foi linkado ali em cima */}
        <AlertDialog
          open={!!dfdToDelete}
          onOpenChange={() => setDfdToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir DFD</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação enviará o DFD para a lixeira. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white">
                Mandar para Lixeira
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
