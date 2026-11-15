"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bloquearDia, desbloquearDia } from "../actions";

/** Botão para marcar/desmarcar folga ou feriado em um dia. */
export default function BloqueioDia({ data, bloqueado }: { data: string; bloqueado: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const router = useRouter();
  const clicar = () => {
    const motivo = bloqueado ? "" : (prompt("Motivo (ex.: feriado, folga):", "Folga") ?? null);
    if (motivo === null) return;
    iniciar(async () => {
      const r = bloqueado ? await desbloquearDia(data) : await bloquearDia(data, motivo);
      if (!r.ok) setErro(r.erro);
      else router.refresh();
    });
  };
  return (
    <>
      <button className="p-btn claro" disabled={pendente} onClick={clicar}>{bloqueado ? "Liberar dia" : "Bloquear dia"}</button>
      {erro && <span className="p-erro">{erro}</span>}
    </>
  );
}
