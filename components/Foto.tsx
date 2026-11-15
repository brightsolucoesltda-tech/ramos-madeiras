/* Foto com carregamento preguiçoso e um fundo de madeira caso o arquivo ainda não exista. */
"use client";
import { useState } from "react";

export default function Foto({ src, alt, className = "", prioridade = false }: { src: string; alt: string; className?: string; prioridade?: boolean }) {
  const [erro, setErro] = useState(false);
  if (erro) return <div className={`foto-falta ${className}`} role="img" aria-label={alt}><span>Foto em breve</span></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading={prioridade ? "eager" : "lazy"} decoding="async" onError={() => setErro(true)} />;
}
