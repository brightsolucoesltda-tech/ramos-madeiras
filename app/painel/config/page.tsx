import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import FormularioConfig from "./FormularioConfig";

export default async function Config() {
  await exigirPagina(["admin"]);
  return (
    <>
      <h1>Configurações</h1>
      <FormularioConfig inicial={await carregarConfig()} />
    </>
  );
}
