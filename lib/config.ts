/**
 * CONFIGURAÇÃO DO SITE — RAMOS MADEIRAS
 * Tudo que muda com o tempo (preços, medidas, textos, capacidade) fica aqui.
 * Na Fase 2 estes valores passam a ser editáveis pelo painel (tela de configurações);
 * este arquivo continua como valor padrão/reserva.
 */

export const config = {
  nome: "Ramos Madeiras",
  // Número do WhatsApp com DDI+DDD, só dígitos. Pode ser trocado pela variável NEXT_PUBLIC_WHATSAPP.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "5541984036014",
  whatsappExibicao: process.env.NEXT_PUBLIC_WHATSAPP_EXIBICAO || "(41) 98403-6014",
  instagram: "https://instagram.com/ramosmadeiras",
  cidadeBase: "Fazenda Rio Grande - PR",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://ramos-madeiras.vercel.app",

  // ID do Meta Pixel (Facebook/Instagram). Deixe vazio para desligar.
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",

  // Faixa de promoção no topo
  promo: {
    ativa: true,
    texto: "Oferta especial desta semana. Pagamento só após a entrega.",
  },

  // Acréscimo do verniz, em reais, para qualquer tamanho
  adicionalVerniz: 100,

  // Medidas e preços (acabamento natural)
  medidas: [
    { id: "100x135", medida: "100x135 cm", lugares: "1 pessoa de cada lado", preco: 170 },
    { id: "120x135", medida: "120x135 cm", lugares: "2 pessoas de cada lado", preco: 210 },
    { id: "160x135", medida: "160x135 cm", lugares: "3 pessoas de cada lado", preco: 240 },
    { id: "180x135", medida: "180x135 cm", lugares: "4 pessoas de cada lado", preco: 260 },
    { id: "200x135", medida: "200x135 cm", lugares: "4 a 5 pessoas de cada lado", preco: 290 },
  ],

  // Acabamentos. "verniz: true" soma o adicional.
  acabamentos: [
    { id: "natural", nome: "Natural", descricao: "Madeira só lixada, tom claro", verniz: false, cor: "#d9b98a" },
    { id: "mogno", nome: "Envernizado Mogno", descricao: "Alaranjado/avermelhado", verniz: true, cor: "#a8501f" },
    { id: "embuia", nome: "Envernizado Embuia", descricao: "Mais escuro, marrom", verniz: true, cor: "#4a2c17" },
  ],

  // Agenda pública: quantos dias à frente mostrar, antecedência mínima e dias sem produção
  // (0=domingo ... 6=sábado). Na Fase 2 isto vem da agenda real do painel.
  agenda: {
    diasParaFrente: 30,
    antecedenciaMinimaDias: 3,
    diasSemProducao: [0],
  },

  pagamento: {
    parcelasMax: 10,
    aviso: "Não aceitamos cartão Will.",
  },

  // Fotos (salvas em /public/images). Troque os nomes aqui se mudar os arquivos.
  fotos: {
    mesaEnvernizadaExterna: { src: "/images/mesa-envernizada-externa.webp", alt: "Banco-mesa envernizado aberto como mesa em área externa" },
    bancoNaturalPisoBege: { src: "/images/banco-natural-piso-bege.webp", alt: "Banco de eucalipto natural na posição banco" },
    bancoNaturalGrama: { src: "/images/banco-natural-grama.webp", alt: "Banco natural na grama" },
    bancoEnvernizadoVaranda: { src: "/images/banco-envernizado-varanda.webp", alt: "Banco envernizado em varanda com piso de madeira" },
    mesaNaturalGramaRural: { src: "/images/mesa-natural-grama-rural.webp", alt: "Mesa natural aberta na grama, área rural" },
    bancoNaturalGramaQuadrada: { src: "/images/banco-natural-grama-quadrada.webp", alt: "Banco natural na grama" },
    mesaEnvernizadaPosta: { src: "/images/mesa-envernizada-posta-toalha-preta.webp", alt: "Mesa envernizada posta com pratos e toalha preta" },
  },

  // KIT MESA (em breve). Para liberar, mude "emBreve" para false e edite o texto.
  kitMesa: {
    emBreve: true,
    titulo: "Kit Mesa",
    texto: "Mesa + banquetas em kit completo. Em breve por aqui!",
  },

  depoimentos: [
    { nome: "Cliente 1", cidade: "Cidade", texto: "Depoimento de exemplo. Substitua por um relato real de cliente." },
    { nome: "Cliente 2", cidade: "Cidade", texto: "Depoimento de exemplo. Substitua por um relato real de cliente." },
    { nome: "Cliente 3", cidade: "Cidade", texto: "Depoimento de exemplo. Substitua por um relato real de cliente." },
  ],

  faq: [
    { p: "Qual o prazo de entrega?", r: "Tudo é feito sob encomenda. O prazo depende da agenda da marcenaria; no pedido você escolhe a data preferida e confirmamos pelo WhatsApp." },
    { p: "Como funciona a entrega e quanto custa?", r: "Nós mesmos entregamos. A taxa depende do bairro e é informada no WhatsApp antes de você confirmar." },
    { p: "Preciso pagar antes?", r: "Não. O pagamento é só depois que o móvel chegar na sua casa." },
    { p: "Posso parcelar?", r: "Sim, em até 10x no cartão, com a taxa da maquininha. Não aceitamos cartão Will." },
    { p: "Qual a diferença entre natural e envernizado?", r: "O natural é a madeira lixada, em tom claro. O envernizado recebe verniz Mogno (alaranjado) ou Embuia (marrom escuro), por +R$ 100,00 em qualquer tamanho." },
    { p: "É resistente?", r: "Sim. É feito em eucalipto maciço, madeira firme e durável. Para área externa, recomendamos o envernizado e deixar sob cobertura." },
    { p: "Fazem outros tamanhos?", r: "Fazemos também móveis sob medida. Peça um orçamento pelo WhatsApp." },
  ],

  mensagens: {
    sobMedida: "Olá, Ramos Madeiras! Gostaria de um orçamento de móvel sob medida.",
    contatoGeral: "Olá, Ramos Madeiras! Vim pelo site e quero tirar uma dúvida.",
  },
};

export type Medida = (typeof config.medidas)[number];
export type Acabamento = (typeof config.acabamentos)[number];
