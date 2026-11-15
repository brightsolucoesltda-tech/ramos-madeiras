/* Botão/link do WhatsApp que também dispara o evento do Meta Pixel. */
"use client";
import { linkWhatsApp, rastrear } from "@/lib/pedido";

export default function BotaoWhats({ texto, mensagem, className = "btn btn-whats", children }: { texto?: string; mensagem: string; className?: string; children?: React.ReactNode }) {
  return (
    <a href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" className={className} onClick={() => rastrear("Contact")}>
      {children ?? texto ?? "WhatsApp"}
    </a>
  );
}
