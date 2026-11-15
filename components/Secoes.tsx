/* Seções estáticas do site (server components). */
import Foto from "./Foto";
import BotaoWhats from "./BotaoWhats";
import { config } from "@/lib/config";
import { brl, type TabelaPreco } from "@/lib/pedido";

const f = config.fotos;

export function Promo({ promo }: { promo: { ativa: boolean; texto: string } }) {
  if (!promo.ativa) return null;
  return <div className="promo">{promo.texto}</div>;
}

export function Hero({ tabela }: { tabela: TabelaPreco }) {
  const menor = Math.min(...tabela.medidas.map((m) => m.preco));
  return (
    <header className="hero">
      <Foto src={f.mesaEnvernizadaExterna.src} alt={f.mesaEnvernizadaExterna.alt} className="hero-foto" prioridade />
      <div className="hero-capa" />
      <div className="container hero-conteudo">
        <span className="selo">Pagamento após a entrega</span>
        <h1>O banco que vira mesa.</h1>
        <p>Eucalipto maciço, feito sob encomenda.</p>
        <p className="preco-hero">
          a partir de <b>{brl(menor).replace(",00", "")}</b>
        </p>
        <div className="botoes">
          <a href="#pedido" className="btn btn-primario btn-grande">Montar meu pedido</a>
          <BotaoWhats mensagem={config.mensagens.contatoGeral} texto="WhatsApp" className="btn btn-claro btn-grande" />
        </div>
      </div>
    </header>
  );
}

/** Pares banco → mesa para mostrar a transformação */
export function ComoFunciona() {
  const pares = [
    { a: f.bancoNaturalGrama, b: f.mesaNaturalGramaRural, t: "Natural" },
    { a: f.bancoEnvernizadoVaranda, b: f.mesaEnvernizadaExterna, t: "Envernizado" },
  ];
  return (
    <section className="secao">
      <div className="container">
        <h2 className="h2">Banco de dia, mesa na hora do almoço</h2>
        <p className="sub">Com encosto, vira um banco confortável. Abre e vira uma mesa com dois bancos.</p>
        <div className="pares">
          {pares.map((p) => (
            <div key={p.t} className="par">
              <figure><Foto src={p.a.src} alt={p.a.alt} /><figcaption>Banco</figcaption></figure>
              <span className="seta" aria-hidden>→</span>
              <figure><Foto src={p.b.src} alt={p.b.alt} /><figcaption>Mesa · {p.t}</figcaption></figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TabelaMedidas({ tabela }: { tabela: TabelaPreco }) {
  return (
    <section className="secao secao-clara">
      <div className="container">
        <h2 className="h2">Tabela de medidas</h2>
        <div className="tabela-wrap">
          <table>
            <thead>
              <tr><th>Medida</th><th>Lugares</th><th>Natural</th><th>Envernizado</th></tr>
            </thead>
            <tbody>
              {tabela.medidas.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.medida}</b></td>
                  <td>{m.lugares}</td>
                  <td>{brl(m.preco)}</td>
                  <td>{brl(m.preco + tabela.adicionalVerniz)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota">Envernizado: + {brl(tabela.adicionalVerniz)} em qualquer tamanho. Entrega: taxa a consultar (depende do bairro).</p>
      </div>
    </section>
  );
}

export function NaturalVerniz({ tabela }: { tabela: TabelaPreco }) {
  return (
    <section className="secao">
      <div className="container">
        <h2 className="h2">Natural ou envernizado?</h2>
        <div className="duas">
          <article>
            <Foto src={f.bancoNaturalPisoBege.src} alt={f.bancoNaturalPisoBege.alt} />
            <h3>Natural</h3>
            <p>Madeira só lixada, em tom claro. Visual limpo e rústico. Incluso no preço base.</p>
          </article>
          <article>
            <Foto src={f.bancoEnvernizadoVaranda.src} alt={f.bancoEnvernizadoVaranda.alt} />
            <h3>Envernizado</h3>
            <p>
              Verniz <b>Mogno</b> (alaranjado/avermelhado) ou <b>Embuia</b> (marrom mais escuro). Mais proteção e acabamento. + {brl(tabela.adicionalVerniz)}.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Encomenda() {
  const passos = ["Você escolhe", "Confirmamos no WhatsApp", "Produzimos", "Entregamos", "Você paga na entrega"];
  return (
    <section className="secao secao-clara">
      <div className="container">
        <h2 className="h2">Como funciona a encomenda</h2>
        <ol className="passos">
          {passos.map((p, i) => (
            <li key={p}><b>{i + 1}</b>{p}</li>
          ))}
        </ol>
        <div className="pagto">
          <h3>Formas de pagamento</h3>
          <p>
            <strong>Pagamento só após a entrega.</strong> Parcelamos em até {config.pagamento.parcelasMax}x no cartão, com a taxa da maquininha.
          </p>
          <p className="aviso">⚠ {config.pagamento.aviso}</p>
        </div>
      </div>
    </section>
  );
}

export function SobMedida() {
  return (
    <section className="secao">
      <div className="container centro">
        <h2 className="h2">Móveis sob medida</h2>
        <p className="sub">Baús, aparadores e outros móveis planejados em eucalipto, do jeito que você precisa.</p>
        <BotaoWhats mensagem={config.mensagens.sobMedida} texto="Pedir orçamento" className="btn btn-primario btn-grande" />
      </div>
    </section>
  );
}

/** Outros produtos: mesa piquenique, banco avulso e kit mesa (com botão de orçamento no WhatsApp). */
export function OutrosProdutos() {
  return (
    <section className="secao secao-clara" id="outros-produtos">
      <div className="container">
        <h2 className="h2">Outros produtos</h2>
        <p className="sub">Também em eucalipto, feitos sob encomenda e com pagamento após a entrega.</p>
        <div className="produtos">
          {config.outrosProdutos.map((p) => (
            <article key={p.id} className="produto">
              {p.foto ? <Foto src={p.foto} alt={p.titulo} /> : <div className="foto-falta" role="img" aria-label={p.titulo}><span>Foto em breve</span></div>}
              <div className="produto-info">
                {p.emBreve && <span className="selo">Em breve</span>}
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
                {p.preco && <b className="produto-preco">{p.preco}</b>}
                {!p.emBreve && <BotaoWhats mensagem={p.mensagem} texto="Pedir orçamento" className="btn btn-whats" />}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Destaque de confiança (ex.: Oktoberfest de Curitiba). Curto, para não carregar a página. */
export function Destaque() {
  const d = config.destaque;
  if (!d.ativo) return null;
  return (
    <section className="secao">
      <div className="container">
        <div className="destaque">
          <Foto src={d.foto} alt={d.titulo} />
          <div>
            <span className="selo">Destaque</span>
            <h3>{d.titulo}</h3>
            <p>{d.texto}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function KitMesa() {
  const k = config.kitMesa;
  return (
    <section className="secao secao-clara">
      <div className="container">
        <div className="kit">
          {k.emBreve && <span className="selo">Em breve</span>}
          <h3>{k.titulo}</h3>
          <p>{k.texto}</p>
        </div>
      </div>
    </section>
  );
}

export function Depoimentos() {
  return (
    <section className="secao">
      <div className="container">
        <h2 className="h2">Quem comprou, aprovou</h2>
        <p className="sub">Mensagens reais que recebemos dos clientes. <a className="link" href={config.instagram} target="_blank" rel="noopener">Veja mais no Instagram</a>.</p>
        <div className="depos">
          {config.depoimentos.map((d, i) => (
            <blockquote key={i} className="depo">
              {d.imagem && <Foto src={d.imagem} alt={`Print de mensagem de cliente: ${d.texto}`} className="depo-print" />}
              “{d.texto}”<footer>{d.nome} · {d.cidade}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="secao secao-clara">
      <div className="container estreito">
        <h2 className="h2">Perguntas frequentes</h2>
        {config.faq.map((q) => (
          <details key={q.p}>
            <summary>{q.p}</summary>
            <p>{q.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="container">
        <strong className="logo">{config.nome}</strong>
        <p>Móveis rústicos em eucalipto, sob encomenda.</p>
        <p>
          WhatsApp: <BotaoWhats mensagem={config.mensagens.contatoGeral} className="link">{config.whatsappExibicao}</BotaoWhats>
        </p>
        <p>
          <a href={config.instagram} className="link" target="_blank" rel="noopener">Instagram</a> · {config.cidadeBase}
        </p>
        <small>© {new Date().getFullYear()} {config.nome}. Pagamento após a entrega.</small>
      </div>
    </footer>
  );
}
