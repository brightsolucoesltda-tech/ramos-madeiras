// Converte fotos de /public/images-originais para WebP otimizado em /public/images.
// Uso: coloque as fotos em public/images-originais (jpg/png) com os nomes do config e rode: npm run imagens
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";
const origem = "public/images-originais", destino = "public/images";
mkdirSync(destino, { recursive: true });
for (const arq of readdirSync(origem)) {
  const { name, ext } = parse(arq);
  if (!/\.(jpe?g|png|webp)$/i.test(ext)) continue;
  await sharp(join(origem, arq)).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(destino, `${name}.webp`));
  console.log("ok", name);
}
