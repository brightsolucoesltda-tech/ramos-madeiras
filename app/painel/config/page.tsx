import Link from "next/link";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import FormularioConfig from "./FormularioConfig";

export default async function Config() {
  await exigirPagina(["admin"]);
  return (
    <>
      <h1>Configurações</h1>
      <Link href="/painel/usuarios" className="p-btn claro">👥 Usuários e senhas da equipe</Link>
      <FormularioConfig inicial={await carregarConfig()} />
    </>
  );
}
