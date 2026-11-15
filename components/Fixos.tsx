/* Botão flutuante do WhatsApp + barra fixa no celular. */
import BotaoWhats from "./BotaoWhats";
import { config } from "@/lib/config";

export default function Fixos() {
  return (
    <>
      <BotaoWhats mensagem={config.mensagens.contatoGeral} className="whats-flutuante">
        <span aria-hidden>💬</span><span className="sr">WhatsApp</span>
      </BotaoWhats>
      <div className="barra-mobile">
        <a href="#pedido" className="btn btn-primario">Montar pedido</a>
        <BotaoWhats mensagem={config.mensagens.contatoGeral} texto="WhatsApp" />
      </div>
    </>
  );
}
