"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen,
  Loader2,
  Plus,
  LogOut,
  Edit2,
  CheckCircle,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

interface Processo {
  id: string;
  nome: string;
  status: "ATIVO" | "CONCLUIDO" | "ARQUIVADO";
  createdAt: string;
  _count?: { dfds: number };
}

export default function LobbyProcessos() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);

  // Hydration fix
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();

  const [processoToEdit, setProcessoToEdit] = useState<Processo | null>(null);
  const [editName, setEditName] = useState("");
  const [processoToDelete, setProcessoToDelete] = useState<Processo | null>(
    null,
  );
  const [processoToStatus, setProcessoToStatus] = useState<{
    proc: Processo;
    status: "CONCLUIDO" | "ARQUIVADO" | "ATIVO";
  } | null>(null);

  const fetchProcessos = async () => {
    try {
      const res = await fetch("/api/processos");
      if (res.ok) {
        const data = await res.json();
        setProcessos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
  }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    setCriando(true);
    try {
      const res = await fetch("/api/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome }),
      });

      if (res.ok) {
        setNovoNome("");
        await fetchProcessos();
      }
    } finally {
      setCriando(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "rename" | "status" | "delete",
    data?: any,
  ) => {
    setLoading(true);
    try {
      if (action === "delete") {
        await fetch(`/api/processos/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/processos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      await fetchProcessos();
    } catch (error) {
      alert("Erro ao processar ação.");
    } finally {
      setProcessoToEdit(null);
      setProcessoToDelete(null);
      setProcessoToStatus(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-20">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Seus Processos
            </h1>
            <p className="text-slate-500">
              Gerencie suas licitações e captações de demanda.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-red-500 hover:bg-red-50 font-bold">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        <form
          onSubmit={handleCriar}
          className="flex gap-2 bg-white p-4 rounded-xl border shadow-sm">
          <Input
            placeholder="Nome do novo processo (ex: Compra de TI 2026)"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            disabled={criando}
          />
          {/* Hydration safe button */}
          {isClient && (
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
              disabled={criando || novoNome.trim().length === 0}>
              {criando ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Criar
                </>
              )}
            </Button>
          )}
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && processos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
              <p className="text-slate-500 text-sm">Carregando processos...</p>
            </div>
          ) : processos.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400 border-2 border-dashed rounded-xl bg-white/50">
              Nenhum processo criado. Comece criando um acima!
            </div>
          ) : (
            processos.map((p) => (
              <Card
                key={p.id}
                className="flex flex-col border-slate-200 hover:border-blue-300 transition-all hover:shadow-md bg-white">
                <Link
                  href={`/processo/${p.id}`}
                  className="flex-1 p-6 group cursor-pointer block relative">
                  {p.status === "CONCLUIDO" && (
                    <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                      Concluído
                    </span>
                  )}
                  {p.status === "ARQUIVADO" && (
                    <span className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                      Arquivado
                    </span>
                  )}

                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg transition-colors ${p.status === "ATIVO" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" : "bg-slate-50 text-slate-400"}`}>
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 overflow-hidden pr-16">
                      <h3
                        className={`font-bold truncate transition-colors ${p.status === "ATIVO" ? "text-slate-800 group-hover:text-blue-700" : "text-slate-500 line-through"}`}>
                        {p.nome}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {p._count?.dfds || 0} DFDs •{" "}
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="border-t border-slate-100 p-2 flex justify-end gap-1 bg-slate-50/50 rounded-b-xl">
                  <button
                    onClick={() => {
                      setProcessoToEdit(p);
                      setEditName(p.nome);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Renomear">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {p.status !== "CONCLUIDO" && (
                    <button
                      onClick={() =>
                        setProcessoToStatus({ proc: p, status: "CONCLUIDO" })
                      }
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Marcar como Concluído">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {p.status !== "ARQUIVADO" && (
                    <button
                      onClick={() =>
                        setProcessoToStatus({ proc: p, status: "ARQUIVADO" })
                      }
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                      title="Arquivar">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  {p.status !== "ATIVO" && (
                    <button
                      onClick={() =>
                        setProcessoToStatus({ proc: p, status: "ATIVO" })
                      }
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Reativar">
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setProcessoToDelete(p)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        <AlertDialog
          open={!!processoToEdit}
          onOpenChange={() => setProcessoToEdit(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Renomear Processo</AlertDialogTitle>
              <AlertDialogDescription>
                Insira o novo nome para o processo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  processoToEdit &&
                  handleAction(processoToEdit.id, "rename", { nome: editName })
                }
                disabled={!editName.trim()}>
                Salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!processoToStatus}
          onOpenChange={() => setProcessoToStatus(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja marcar o processo{" "}
                <strong>{processoToStatus?.proc.nome}</strong> como{" "}
                {processoToStatus?.status === "CONCLUIDO"
                  ? "CONCLUÍDO"
                  : processoToStatus?.status === "ARQUIVADO"
                    ? "ARQUIVADO"
                    : "ATIVO"}
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  processoToStatus &&
                  handleAction(processoToStatus.proc.id, "status", {
                    status: processoToStatus.status,
                  })
                }
                className="bg-blue-600">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!processoToDelete}
          onOpenChange={() => setProcessoToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Definitivamente?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a excluir o processo{" "}
                <strong>{processoToDelete?.nome}</strong>.<br />
                <br />
                <span className="text-red-600 font-bold">Atenção:</span> Todos
                os DFDs e Equipamentos vinculados a este processo também serão
                destruídos para sempre. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  processoToDelete &&
                  handleAction(processoToDelete.id, "delete")
                }
                className="bg-red-600 hover:bg-red-700 border-transparent">
                Sim, Excluir Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
