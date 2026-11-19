# DoceGestão ERP — Pâtisserie Contemporânea & Cafeteria Especializada

> **Tecnologia e sabor para uma gestão ainda mais doce.**

Projeto demonstrativo de **ERP Integrado & Business Intelligence** desenvolvido para portfólio profissional, simulando a operação ponta a ponta de uma confeitaria francesa contemporânea com cafeteria especializada localizada no Setor Sul, Goiânia – GO.

> **Aviso de Portfólio:** Este sistema possui finalidade exclusivamente demonstrativa. Todos os dados, clientes, transações, documentos, regimes tributários e integrações são fictícios e simulados.

---

## 1. Visão Geral & Contexto de Negócio
- **Empresa Fictícia:** DoceGestão Confeitaria & Café (Unidade Matriz — 250 m², 36 lugares).
- **Operação:** Produção iniciada às 06h; atendimento diário das 08h às 20h (Salão, Balcão, Delivery até 10 km, Encomendas e B2B).
- **Premissas Financeiras:** Ticket médio de referência de **R$ 25,00**, projeção semestral de faturamento de **R$ 105 mil a R$ 155 mil/mês**, estrutura de capital inicial de **R$ 1.270.000,00** (40% sócios, 35% financiamento, 25% investidores) e apuração simulada no **Lucro Presumido**.

## 2. Arquitetura Tecnológica
- **Frontend:** React 18 + TypeScript + Vite
- **Estilização & Identidade Visual:** Tailwind CSS (Paleta Bordô `#701D2B`, Chocolate `#542C20`, Creme `#F5E8D8`, Dourado Champagne `#C69A55`, Cinza Taupe `#A99B91`; Tipografia *Cormorant Garamond* e *Inter*)
- **Gráficos & BI:** Recharts (gráficos interativos + simulador dinâmico de cenários)
- **Banco de Dados & Backend:** PostgreSQL no **Supabase** (82+ tabelas normalizadas, 8 views analíticas, triggers de auditoria imutável e bloqueio de lote, RLS por perfil e Supabase Storage)
- **Publicação:** GitHub + Vercel

## 3. Módulos Implementados
1. **Dashboard Executivo & BI Simulador:** KPIs consolidados, gráficos interativos e simulação em tempo real de premissas.
2. **Comercial, PDV & Loja Digital:** Terminais `CX001`–`CX003`, mapa de 10 mesas (36 lugares), comandas e vitrine online conectada aos **28 SKUs**.
3. **Fichas Técnicas & Engenharia de Cardápio:** 20 SKUs de confeitaria + 8 bebidas com custos, alergênicos e precificação por canal.
4. **Estoque & Almoxarifado:** Controle de lotes, endereçamento físico (`REF-CAM-02-03`), validades e expedição **FEFO**.
5. **Produção & PCP:** Planejamento MRP/CRP, ordens de produção, consumo por lote e apontamento de perdas.
6. **Compras & Fornecedores:** Cotações, aprovação humana obrigatória e ranking multicritério.
7. **Financeiro & Controladoria:** Fluxo de caixa, DRE Gerencial, conciliação simulada e estrutura de capital.
8. **Qualidade & Segurança dos Alimentos (BPF):** POPs, checklists 100% lotes e bloqueio automático via trigger.
9. **Patrimônio & Manutenção:** Ativos com QR Code, depreciação linear, SLA, MTBF e MTTR.
10. **RH, CRM & SAC:** Colaboradores, ponto híbrido, folha prévia, segmentação e pesquisa 1–5 estrelas.
11. **Governança, Segurança & LGPD:** Matriz de permissões para 10 perfis demonstrativos, auditoria imutável, ROPA, cookies granulares e painel DR/Backup.

## 4. Como Publicar na Vercel (Sem Terminal Local)
1. Suba esta pasta para um repositório no **GitHub**.
2. Importe o repositório na **Vercel** (Framework Preset: `Vite`).
3. Adicione as variáveis de ambiente públicas do seu projeto Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em **Deploy**.