"use client";

import { useEffect, useState, Suspense } from "react";
import {
  Loader2,
  Trash2,
  RotateCcw,
  ArrowLeft,
  CheckSquare,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";

interface DFD {
  id: string;
  secretaria: string;
  createdAt: string;
  resumo: string;
}

function LixeiraContent() {
  const [dados, setDados] = useState<DFD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dfdToDelete, setDfdToDelete] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const processoId = searchParams.get("processoId");

  const fetchLixeira = async () => {
    setLoading(true);
    try {
      const url = processoId
        ? `/api/dfd/lixeira?processoId=${processoId}`
        : "/api/dfd/lixeira";
      const res = await fetch(url);
      const data = await res.json();
      setDados(data);
    } catch {
      setDados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLixeira();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId]);

  const filteredDados = dados.filter((row) => {
    const term = searchTerm.toLowerCase();
    const dataFormatada = new Date(row.createdAt).toLocaleDateString();

    return (
      row.secretaria.toLowerCase().includes(term) ||
      row.resumo.toLowerCase().includes(term) ||
      dataFormatada.includes(term)
    );
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(filteredDados.map((d) => d.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const restaurar = async (id: string) => {
    await fetch(`/api/dfd/${id}/restore`, { method: "PATCH" });
    fetchLixeira();
    setSelected((prev) => prev.filter((item) => item !== id));
  };

  const confirmDelete = async () => {
    if (!dfdToDelete) return;

    await fetch(`/api/dfd/${dfdToDelete}/hard-delete`, {
      method: "DELETE",
    });

    setDfdToDelete(null);
    fetchLixeira();
    setSelected((prev) => prev.filter((item) => item !== dfdToDelete));
  };

  const handleBulkRestore = async () => {
    if (selected.length === 0) return;
    setLoading(true);

    await Promise.all(
      selected.map((id) =>
        fetch(`/api/dfd/${id}/restore`, { method: "PATCH" }),
      ),
    );

    setSelected([]);
    fetchLixeira();
  };

  const confirmBulkDelete = async () => {
    if (selected.length === 0) return;
    setLoading(true);

    await Promise.all(
      selected.map((id) =>
        fetch(`/api/dfd/${id}/hard-delete`, { method: "DELETE" }),
      ),
    );

    setIsBulkDeleting(false);
    setSelected([]);
    fetchLixeira();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                router.push(
                  processoId ? `/processo/${processoId}` : "/processos",
                )
              }
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Lixeira de DFDs
            </h1>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar secretaria, resumo, data..."
              className="pl-9 h-10 border-slate-200 bg-white focus-visible:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <CheckSquare className="w-5 h-5" />
              <span>
                {selected.length}{" "}
                {selected.length === 1
                  ? "item selecionado"
                  : "itens selecionados"}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBulkRestore}
                disabled={loading}
                className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-lg shadow-sm text-sm font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Restaurar Todos
              </button>
              <button
                onClick={() => setIsBulkDeleting(true)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Excluir Todos
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                      filteredDados.length > 0 &&
                      selected.length === filteredDados.length
                    }
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Data
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Secretaria
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Resumo
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600 w-6 h-6" />
                  </td>
                </tr>
              ) : dados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum item na lixeira para este processo.
                  </td>
                </tr>
              ) : filteredDados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 bg-slate-50/50">
                    Nenhum resultado encontrado na lixeira para{" "}
                    <span className="font-bold text-slate-700">
                      "{searchTerm}"
                    </span>
                    .
                  </td>
                </tr>
              ) : (
                filteredDados.map((d) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-slate-50 transition-colors ${selected.includes(d.id) ? "bg-blue-50/30" : ""}`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selected.includes(d.id)}
                        onChange={() => handleSelectOne(d.id)}
                      />
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {d.secretaria}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{d.resumo}</td>
                    <td className="p-4 flex gap-4">
                      <button
                        onClick={() => restaurar(d.id)}
                        className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors text-sm font-medium">
                        <RotateCcw className="w-4 h-4" />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setDfdToDelete(d.id)}
                        className="text-red-600 flex items-center gap-1 hover:text-red-800 transition-colors text-sm font-medium">
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AlertDialog
          open={!!dfdToDelete}
          onOpenChange={() => setDfdToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Definitivamente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é{" "}
                <strong className="text-red-600 font-bold">irreversível</strong>
                . Todos os equipamentos atrelados a este DFD serão apagados para
                sempre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                Sim, Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Excluir {selected.length} itens para sempre?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a excluir{" "}
                <strong className="text-red-600 font-bold">
                  {selected.length} DFDs
                </strong>{" "}
                definitivamente. Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                Sim, Excluir Todos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function LixeiraPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }>
      <LixeiraContent />
    </Suspense>
  );
}
