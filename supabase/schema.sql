-- ============================================================
-- RAMOS MADEIRAS — banco de dados (Supabase / Postgres)
-- Rode este arquivo uma vez no "Editor SQL" do Supabase.
-- Segurança: RLS ligado e SEM políticas = ninguém acessa pela chave pública.
-- Todo acesso passa pelo servidor do site (chave secreta), que confere o login e o perfil.
-- ============================================================

-- Perfis de usuário (liga ao login do Supabase Auth)
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('admin','vendedor','marceneiro')),
  criado_em timestamptz not null default now()
);

-- Configurações editáveis pelo admin (uma linha: chave 'geral')
create table if not exists public.configuracoes (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Dias de folga / feriado (bloqueados na agenda)
create table if not exists public.dias_bloqueados (
  data date primary key,
  motivo text
);

-- Bairros com coordenadas aproximadas (usado para agrupar/ordenar rotas)
create table if not exists public.bairros (
  nome text not null,
  cidade text not null default 'Curitiba',
  lat double precision not null,
  lng double precision not null,
  primary key (nome, cidade)
);

-- Pedidos
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  numero text not null unique,
  status text not null default 'novo'
    check (status in ('novo','confirmado','em_producao','pronto','saiu_entrega','entregue','reagendado','cancelado')),
  -- Aceite do marceneiro sobre a data pedida
  aceite text not null default 'pendente'
    check (aceite in ('pendente','aceito','proposto','recusado')),
  cliente_nome text,
  telefone text,
  endereco text,
  bairro text,
  cidade text,
  referencia text,
  lat double precision,
  lng double precision,
  itens jsonb not null default '[]',      -- [{medidaId, acabId, quantidade}]
  bancos int not null default 1,           -- total de bancos (soma das quantidades)
  valor_total numeric(10,2) not null default 0,
  taxa_entrega numeric(10,2),
  forma_pagamento text,
  data_desejada date,
  data_agendada date,                      -- dia em que será produzido/entregue
  data_proposta date,                      -- data sugerida pelo marceneiro
  viagem int,                              -- nº da viagem de entrega no dia
  ordem_rota int,                          -- posição na sequência de entregas
  observacoes text,
  origem text,                             -- utm_source (facebook, instagram...)
  canal text not null default 'site',      -- site | manual
  vendedor_id uuid references public.perfis(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pedidos_status_idx on public.pedidos(status);
create index if not exists pedidos_agendada_idx on public.pedidos(data_agendada);

-- Trava de segurança
alter table public.perfis enable row level security;
alter table public.configuracoes enable row level security;
alter table public.dias_bloqueados enable row level security;
alter table public.bairros enable row level security;
alter table public.pedidos enable row level security;

-- Configuração inicial (o admin edita depois pelo painel)
insert into public.configuracoes (chave, valor) values ('geral', '{
  "medidas": [
    {"id":"100x135","medida":"100x135 cm","lugares":"1 pessoa de cada lado","preco":170},
    {"id":"120x135","medida":"120x135 cm","lugares":"2 pessoas de cada lado","preco":210},
    {"id":"160x135","medida":"160x135 cm","lugares":"3 pessoas de cada lado","preco":240},
    {"id":"180x135","medida":"180x135 cm","lugares":"4 pessoas de cada lado","preco":260},
    {"id":"200x135","medida":"200x135 cm","lugares":"4 a 5 pessoas de cada lado","preco":290}
  ],
  "adicionalVerniz": 100,
  "capacidadeDiaria": 4,
  "horasPorBanco": 1.5,
  "bancosPorViagem": 2,
  "diasSemProducao": [0],
  "antecedenciaMinimaDias": 3,
  "diasParaFrente": 30,
  "promo": {"ativa": true, "texto": "Oferta especial desta semana. Pagamento só após a entrega."},
  "metaPixelId": "",
  "mensagens": {
    "confirmado": "Olá, {nome}! Seu pedido nº {numero} está confirmado para {data}. Qualquer dúvida é só chamar. Ramos Madeiras",
    "pronto": "Olá, {nome}! Seu banco-mesa (pedido nº {numero}) está pronto! Vamos combinar a entrega.",
    "saiu_entrega": "Olá, {nome}! Estamos saindo para entregar o seu pedido nº {numero}. Em breve chegamos! Pagamento na entrega.",
    "proposta": "Olá, {nome}! Para o pedido nº {numero}, conseguimos entregar em {data}. Pode ser?"
  }
}') on conflict (chave) do nothing;

-- Bairros (coordenadas aproximadas — ajuste no painel se precisar)
insert into public.bairros (nome, cidade, lat, lng) values
 ('Centro','Curitiba',-25.4284,-49.2733),('Batel','Curitiba',-25.4425,-49.2833),
 ('Água Verde','Curitiba',-25.4540,-49.2790),('Portão','Curitiba',-25.4770,-49.2950),
 ('Santa Felicidade','Curitiba',-25.4010,-49.3270),('Boa Vista','Curitiba',-25.3810,-49.2570),
 ('Cajuru','Curitiba',-25.4540,-49.2200),('Hauer','Curitiba',-25.4750,-49.2450),
 ('Boqueirão','Curitiba',-25.5050,-49.2400),('Pinheirinho','Curitiba',-25.5150,-49.2950),
 ('Sítio Cercado','Curitiba',-25.5400,-49.2700),('CIC','Curitiba',-25.4900,-49.3400),
 ('Bacacheri','Curitiba',-25.4000,-49.2350),('Uberaba','Curitiba',-25.4700,-49.2150),
 ('Xaxim','Curitiba',-25.5100,-49.2600),('Tatuquara','Curitiba',-25.5700,-49.3000),
 ('Santa Cândida','Curitiba',-25.3700,-49.2200),('Cabral','Curitiba',-25.4100,-49.2600),
 ('Bigorrilho','Curitiba',-25.4350,-49.2900),('Mercês','Curitiba',-25.4200,-49.2900),
 ('Rebouças','Curitiba',-25.4400,-49.2600),('Capão Raso','Curitiba',-25.5000,-49.2850),
 ('Campo Comprido','Curitiba',-25.4450,-49.3350),('Fazendinha','Curitiba',-25.4800,-49.3200),
 ('Novo Mundo','Curitiba',-25.4900,-49.2700),('Alto da XV','Curitiba',-25.4300,-49.2500),
 ('São Braz','Curitiba',-25.4050,-49.3100),('Centro','Pinhais',-25.4440,-49.1920),
 ('Centro','São José dos Pinhais',-25.5300,-49.2060),('Centro','Colombo',-25.2920,-49.2240),
 ('Centro','Araucária',-25.5930,-49.4100)
on conflict do nothing;

-- Permissões: SÓ o servidor do site (service_role) acessa as tabelas.
-- (anon/authenticated continuam sem acesso — a chave pública não lê nada.)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
