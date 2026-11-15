import { Promo, Hero, ComoFunciona, TabelaMedidas, NaturalVerniz, Encomenda, SobMedida, OutrosProdutos, Destaque, Depoimentos, Faq, Rodape } from "@/components/Secoes";
import Configurador from "@/components/Configurador";
import Galeria from "@/components/Galeria";
import Fixos from "@/components/Fixos";
import { carregarConfig } from "@/lib/configDb";

// Preços e faixa de promoção vêm do painel; a página se atualiza sozinha a cada 60 segundos.
export const revalidate = 60;

export default async function Home() {
  const cfg = await carregarConfig();
  const tabela = { medidas: cfg.medidas, adicionalVerniz: cfg.adicionalVerniz };
  return (
    <>
      <Promo promo={cfg.promo} />
      <Hero tabela={tabela} />
      <main>
        <ComoFunciona />
        <Configurador tabela={tabela} />
        <TabelaMedidas tabela={tabela} />
        <NaturalVerniz tabela={tabela} />
        <Encomenda />
        <OutrosProdutos />
        <SobMedida />
        <Galeria />
        <Depoimentos />
        <Destaque />
        <Faq />
      </main>
      <Rodape />
      <Fixos />
    </>
  );
}
