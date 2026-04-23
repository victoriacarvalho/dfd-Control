"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, email }),
    });

    if (res.ok) {
      alert(
        "Cadastro realizado! Verifique seu e-mail para pegar a senha provisória.",
      );
      router.push("/login");
    } else {
      const data = await res.json();
      alert(`Erro ao cadastrar: ${data.error || "Tente novamente."}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Solicitar Acesso
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">
          A senha de acesso será enviada para o seu e-mail.
        </p>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome Completo
            </label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              E-mail Institucional
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900">
            {loading ? "Enviando e-mail..." : "Cadastrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já possui conta?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline">
            Voltar para Login
          </Link>
        </p>
      </div>
    </div>
  );
}
