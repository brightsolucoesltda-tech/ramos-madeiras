/* Galeria com filtro Natural/Envernizado e lightbox. */
"use client";
import { useState } from "react";
import Foto from "./Foto";
import { config } from "@/lib/config";

const f = config.fotos;
const itens = [
  { ...f.mesaEnvernizadaExterna, t: "verniz" },
  { ...f.bancoNaturalPisoBege, t: "natural" },
  { ...f.bancoNaturalGrama, t: "natural" },
  { ...f.bancoEnvernizadoVaranda, t: "verniz" },
  { ...f.mesaNaturalGramaRural, t: "natural" },
  { ...f.bancoNaturalGramaQuadrada, t: "natural" },
  { ...f.mesaEnvernizadaPosta, t: "verniz" },
];

const filtros = [
  ["todos", "Todos"],
  ["natural", "Natural"],
  ["verniz", "Envernizado"],
] as const;

export default function Galeria() {
  const [filtro, setFiltro] = useState<"todos" | "natural" | "verniz">("todos");
  const [aberta, setAberta] = useState<number | null>(null);
  const lista = itens.filter((i) => filtro === "todos" || i.t === filtro);
  return (
    <section className="secao">
      <div className="container">
        <h2 className="h2">Galeria</h2>
        <div className="filtros">
          {filtros.map(([k, n]) => (
            <button key={k} className={filtro === k ? "ativo" : ""} onClick={() => setFiltro(k)}>{n}</button>
          ))}
        </div>
        <div className="galeria">
          {lista.map((i, n) => (
            <button key={i.src} className="g-item" onClick={() => setAberta(n)} aria-label={`Ampliar: ${i.alt}`}>
              <Foto src={i.src} alt={i.alt} />
            </button>
          ))}
        </div>
      </div>
      {aberta !== null && lista[aberta] && (
        <div className="lightbox" role="dialog" aria-modal onClick={() => setAberta(null)}>
          <button className="lb-fechar" aria-label="Fechar">×</button>
          <button className="lb-nav lb-ant" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setAberta((aberta - 1 + lista.length) % lista.length); }}>‹</button>
          <Foto src={lista[aberta].src} alt={lista[aberta].alt} />
          <button className="lb-nav lb-prox" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); setAberta((aberta + 1) % lista.length); }}>›</button>
        </div>
      )}
    </section>
  );
}
