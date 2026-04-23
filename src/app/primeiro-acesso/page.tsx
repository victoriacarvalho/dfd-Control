"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PrimeiroAcesso() {
  const [novaSenha, setNovaSenha] = useState("");
  const router = useRouter();

  const handleTroca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6)
      return alert("A senha deve ter no mínimo 6 caracteres.");

    const res = await fetch("/api/auth/nova-senha", {
      method: "POST",
      body: JSON.stringify({ novaSenha }),
    });

    if (res.ok) {
      alert("Senha atualizada com sucesso! Bem-vindo ao sistema.");
      router.push("/processos"); // <-- Ajustado para a página Lobby
    } else {
      alert("Erro ao atualizar a senha.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-yellow-200 border-t-4 border-t-yellow-400">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Primeiro Acesso
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">
          Por motivos de segurança, você é obrigado a alterar a senha aleatória
          recebida por e-mail para uma senha definitiva.
        </p>

        <form onSubmit={handleTroca} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nova Senha Definitiva
            </label>
            <Input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600">
            Salvar e Acessar Sistema
          </Button>
        </form>
      </div>
    </div>
  );
}
