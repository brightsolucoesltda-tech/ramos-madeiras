"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }
    window.location.href = "/painel"; // recarrega para o servidor ler o login
  }

  return (
    <div className="p-login">
      <form className="p-card p-form" onSubmit={entrar}>
        <h1>Ramos Madeiras</h1>
        <p>Entre para ver os pedidos.</p>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
        {erro && <p className="p-erro">{erro}</p>}
        <button className="p-btn laranja" disabled={carregando}>{carregando ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
