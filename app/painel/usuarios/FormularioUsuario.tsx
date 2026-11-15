"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/auth";
import { criarUsuario, removerUsuario } from "../actions";

export function NovoUsuario() {
  const [v, setV] = useState({ nome: "", email: "", senha: "", papel: "vendedor" as Papel });
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const router = useRouter();
  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const r = await criarUsuario(v);
    if (r.ok) {
      setMsg({ ok: true, texto: "Usuário criado! Passe o e-mail e a senha para a pessoa." });
      setV({ nome: "", email: "", senha: "", papel: "vendedor" });
      router.refresh();
    } else setMsg({ ok: false, texto: r.erro });
  }
  return (
    <form className="p-card p-form" onSubmit={criar}>
      <h2>Novo usuário</h2>
      <label>Nome<input value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} required /></label>
      <label>E-mail<input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required /></label>
      <label>Senha (mínimo 8 caracteres)<input type="text" value={v.senha} onChange={(e) => setV({ ...v, senha: e.target.value })} required minLength={8} /></label>
      <label>Perfil
        <select value={v.papel} onChange={(e) => setV({ ...v, papel: e.target.value as Papel })}>
          <option value="vendedor">Vendedor</option>
          <option value="marceneiro">Marceneiro</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      {msg && <p className={msg.ok ? "p-ok" : "p-erro"}>{msg.texto}</p>}
      <button className="p-btn laranja">Criar usuário</button>
    </form>
  );
}

export function RemoverUsuario({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  return (
    <button
      className="p-btn vermelho"
      onClick={async () => {
        if (!confirm(`Remover ${nome}?`)) return;
        const r = await removerUsuario(id);
        if (!r.ok) alert(r.erro);
        else router.refresh();
      }}
    >Remover</button>
  );
}
