# 🥩 MH Digital — Canal de Pedidos B2B & Painel Comercial (MVP)

Plataforma de abastecimento comercial B2B desenvolvida para distribuidoras de carnes e alimentos, conectando o catálogo digital para açougues, mercados e revendedores a um painel operacional com geração de Ordem de Pedido (`OP`) e visão financeira integrada.

* **Demo Online (Cliente):** https://mh-digital.paulosup-dez.workers.dev/cliente/
* **Demo Online (Gestor):** https://mh-digital.paulosup-dez.workers.dev/gestor/

---

## 🎯 Problema Operacional Resolvido

Distribuidoras atacadistas do setor frigorífico e alimentício costumam operar com tabelas de negociação dinâmicas, pedidos descentralizados via WhatsApp e falta de padronização na geração de ordens para a expedição. Isso gera erros na separação de cortes, perda de histórico financeiro e gargalos entre o comercial e a logística.

Este MVP estrutura o fluxo de ponta a ponta: o comprador monta a solicitação por corte e SKU no catálogo B2B, enquanto a equipe comercial valida o pedido, gera a **Ordem de Pedido (`OP`)** para impressão e acompanha o status operacional e financeiro em tempo real.

---

## 🔄 Fluxo Funcional de Ponta a Ponta

### 1. Experiência do Cliente (`/cliente/`)
* **Catálogo Segmentado por Linha:** Navegação rápida por categorias operacionais (*Grill, Dianteiro, Traseiro e Congelados*) e busca por corte, linha ou SKU.
* **Negociação & Consulta Comercial:** Vitrine estruturada para abastecimento comercial sem exposição de tabela aberta, direcionando os itens para consulta e fechamento estruturado.
* **Pedido Estruturado & Acompanhamento:** Áreas dedicadas (`Meu pedido` e `Meus pedidos`) para montagem de lotes e acompanhamento do pedido.

### 2. Painel Comercial & Operação (`/gestor/` e `/admin`)
* **Esteira Operacional de Pedidos:** Acompanhamento das etapas do fluxo: `Aguardando aceite` → `Pedido aceito` → `Em separação` → `Saiu para entrega` → `Concluído`.
* **Geração & Impressão de Ordem de Pedido (`OP`):** Após o aceite do pedido, o sistema exibe o código identificador da ordem (ex.: `OP-20260523-01027`) e disponibiliza ação de **Imprimir ordem** diretamente no card para a expedição.
* **Visão Financeira da Operação:** Painel consolidado com indicadores de **Valor Confirmado**, **Recebido**, **A Receber** e **Pedidos Sem Valor Definido**, detalhando forma de pagamento (*Pix, Boleto, Prazo, A definir*) e situação (*Pago, Parcial, A receber, A definir*).
* **Gestão de Catálogo:** Controle de produtos publicados por linha de corte com exibição condicionada à disponibilidade de ativos visuais.

---

## 🛠️ Arquitetura & Stack Tecnológica

* **Frontend:** React 19, TypeScript, Vite e CSS3 com estrutura PWA.
* **Persistência:** Gerenciamento de estado local para carrinho, pedidos e dados demonstrativos da operação.
* **Infraestrutura & Deploy:** Versionamento no GitHub com build automatizado e publicação via **Cloudflare Workers / Pages** (`wrangler.jsonc`).

---

## 📁 Estrutura do Repositório

```text
├── public/           # Ativos estáticos, ícones e configuração PWA
├── src/              # Componentes da vitrine B2B, painel do gestor e regras de pedidos
├── index.html        # Entrypoint da aplicação
├── package.json      # Dependências e scripts (npm run dev / build)
├── tsconfig.json     # Configuração TypeScript
├── vite.config.ts    # Configuração de build e otimização
└── wrangler.jsonc    # Configuração de deploy na Cloudflare
