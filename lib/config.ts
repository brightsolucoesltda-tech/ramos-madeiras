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
  instagram: "https://www.instagram.com/ramos_madeiras/",
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
    // Fotos do Instagram
    bancoNaturalDeck: { src: "/images/banco-natural-deck.webp", alt: "Banco que vira mesa natural em deck de madeira" },
    mesaMognoCalcada: { src: "/images/mesa-mogno-calcada.webp", alt: "Mesa envernizada mogno aberta ao sol" },
    bancoEnvernizadoJardim: { src: "/images/banco-envernizado-jardim.webp", alt: "Banco envernizado em jardim" },
    bancoEnvernizadoGrama: { src: "/images/banco-envernizado-grama-sintetica.webp", alt: "Banco envernizado na grama sintética" },
    mesaPostaCafe: { src: "/images/mesa-envernizada-posta-cafe.webp", alt: "Mesa envernizada posta para café" },
    mesaCom2Bancos: { src: "/images/mesa-com-2-bancos-natural.webp", alt: "Mesa natural com dois bancos separados e banqueta" },
    mesaPiquenique: { src: "/images/mesa-piquenique-envernizada.webp", alt: "Mesa piquenique envernizada com bancos presos" },
    kitMesa: { src: "/images/kit-mesa-dobravel.webp", alt: "Kit mesa com cadeiras dobráveis de eucalipto" },
    oktoberfest: { src: "/images/oktoberfest-curitiba.webp", alt: "Bancos-mesa da Ramos Madeiras na Oktoberfest de Curitiba" },
  },

  // GALERIA: ordem das fotos e filtro (natural | verniz). Para tirar uma foto, apague a linha.
  galeria: [
    { foto: "mesaEnvernizadaExterna", tipo: "verniz" },
    { foto: "bancoNaturalDeck", tipo: "natural" },
    { foto: "mesaMognoCalcada", tipo: "verniz" },
    { foto: "bancoNaturalPisoBege", tipo: "natural" },
    { foto: "bancoEnvernizadoJardim", tipo: "verniz" },
    { foto: "mesaNaturalGramaRural", tipo: "natural" },
    { foto: "bancoEnvernizadoVaranda", tipo: "verniz" },
    { foto: "bancoNaturalGrama", tipo: "natural" },
    { foto: "mesaPostaCafe", tipo: "verniz" },
    { foto: "bancoNaturalGramaQuadrada", tipo: "natural" },
    { foto: "bancoEnvernizadoGrama", tipo: "verniz" },
    { foto: "mesaCom2Bancos", tipo: "natural" },
    { foto: "mesaEnvernizadaPosta", tipo: "verniz" },
    { foto: "mesaPiquenique", tipo: "verniz" },
  ] as { foto: string; tipo: "natural" | "verniz" }[],

  // OUTROS PRODUTOS (cards com "Pedir orçamento"). preco: texto livre, ex.: "a partir de R$ 300". foto: "" = "Foto em breve".
  outrosProdutos: [
    {
      id: "mesa-piquenique",
      titulo: "Mesa piquenique",
      texto: "Mesa com os bancos já presos. Firme e prática para área externa, chácara, bar e restaurante.",
      foto: "/images/mesa-piquenique-envernizada.webp",
      preco: "Preço sob consulta",
      emBreve: false,
      mensagem: "Olá, Ramos Madeiras! Vi no site a MESA PIQUENIQUE e quero um orçamento.",
    },
    {
      id: "mesa-2-bancos",
      titulo: "Mesa + 2 bancos",
      texto: "Conjunto com mesa e dois bancos separados (soltos). Ótimo para varanda, área de churrasco e cozinha.",
      foto: "/images/mesa-com-2-bancos-natural.webp",
      preco: "Preço sob consulta",
      emBreve: false,
      mensagem: "Olá, Ramos Madeiras! Vi no site o conjunto MESA + 2 BANCOS e quero um orçamento.",
    },
    {
      id: "kit-mesa",
      titulo: "Kit mesa",
      texto: "Mesa + cadeiras dobráveis de eucalipto. Em breve por aqui!",
      foto: "/images/kit-mesa-dobravel.webp",
      preco: "",
      emBreve: true,
      mensagem: "Olá, Ramos Madeiras! Quero saber mais sobre o KIT MESA.",
    },
  ],

  // DESTAQUE de confiança (Oktoberfest). Para esconder, mude ativo para false.
  destaque: {
    ativo: true,
    titulo: "Presentes na 1ª Oktoberfest de Curitiba",
    texto: "Fornecemos 100 bancos-mesa para o evento. Qualidade que aguenta muita gente!",
    foto: "/images/oktoberfest-curitiba.webp",
  },

  // KIT MESA (em breve). Para liberar, mude "emBreve" para false e edite o texto.
  kitMesa: {
    emBreve: true,
    titulo: "Kit Mesa",
    texto: "Mesa + banquetas em kit completo. Em breve por aqui!",
  },

  // Depoimentos reais (prints do destaque "feedbacks" do Instagram). Sem nomes, para preservar os clientes.
  depoimentos: [
    { nome: "Cliente", cidade: "via WhatsApp", texto: "Obrigado pelo trabalho de vocês, atenção e honestidade. Gratidão por tudo. Que Deus abençoe o trabalho e a empresa.", imagem: "/images/depoimento-gratidao.webp" },
    { nome: "Cliente", cidade: "via WhatsApp", texto: "Obrigado pela atenção. Adorei as mesas!", imagem: "/images/depoimento-adorei-as-mesas.webp" },
    { nome: "Cliente", cidade: "via WhatsApp", texto: "Só vim agradecer, já chegou a mesa! Depois que tiver tudo montado mando uma foto melhor.", imagem: "/images/depoimento-chegou-a-mesa.webp" },
  ] as { nome: string; cidade: string; texto: string; imagem?: string }[],

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
