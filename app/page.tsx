import { Promo, Hero, ComoFunciona, TabelaMedidas, NaturalVerniz, Encomenda, SobMedida, KitMesa, Depoimentos, Faq, Rodape } from "@/components/Secoes";
import Configurador from "@/components/Configurador";
import Galeria from "@/components/Galeria";
import Fixos from "@/components/Fixos";

export default function Home() {
  return (
    <>
      <Promo />
      <Hero />
      <main>
        <ComoFunciona />
        <Configurador />
        <TabelaMedidas />
        <NaturalVerniz />
        <Encomenda />
        <SobMedida />
        <KitMesa />
        <Galeria />
        <Depoimentos />
        <Faq />
      </main>
      <Rodape />
      <Fixos />
    </>
  );
}
