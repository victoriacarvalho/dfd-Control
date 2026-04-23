"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();

    if (data.sucesso) {
      if (data.primeiroAcesso) router.push("/primeiro-acesso");
      else router.push("/processos");
    } else {
      setErro(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">
          Acesso ao Sistema (DFD)
        </h1>
        {erro && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {erro}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-blue-600 font-bold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
