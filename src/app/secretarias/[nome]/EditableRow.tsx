"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check, X, Loader2 } from "lucide-react";

export default function EditableRow({
  eq,
  setorNome,
  secretariaNome,
  processoId,
}: {
  eq: { nome: string; quantidade: number; especificacao?: string };
  setorNome: string;
  secretariaNome: string;
  processoId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [qtd, setQtd] = useState(eq.quantidade.toString());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/equipamentos/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: eq.nome,
        secretaria: secretariaNome,
        setor: setorNome === "GERAL / SEDE ADMINISTRATIVA" ? null : setorNome,
        processoId,
        novaQuantidade: Number(qtd),
        especificacao: eq.especificacao, // Envia a especificação para não misturar os itens!
      }),
    });

    if (res.ok) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert("Erro ao atualizar a quantidade.");
    }
    setLoading(false);
  };

  // Previne erro caso a especificação seja null/undefined no banco
  const specText = eq.especificacao || "Sem especificação";

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <td className="p-4">
        {isEditing ? (
          <input
            type="number"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            className="w-16 px-2 py-1 border border-blue-400 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            autoFocus
          />
        ) : (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
            {eq.quantidade}
          </span>
        )}
      </td>
      <td className="p-4 text-sm font-bold text-slate-800">{eq.nome}</td>
      <td className="p-4 text-xs text-slate-600 line-clamp-2" title={specText}>
        {specText.substring(0, 150)}
        {specText.length > 150 ? "..." : ""}
      </td>
      <td className="p-4 text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="text-green-600 hover:bg-green-100 p-1.5 rounded-md transition"
              title="Salvar">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setQtd(eq.quantidade.toString());
              }}
              disabled={loading}
              className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition"
              title="Cancelar">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md transition"
            title="Editar quantidade">
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
