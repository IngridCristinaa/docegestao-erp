import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingBag, DollarSign, AlertTriangle, PackageCheck, Award, Filter
} from 'lucide-react';
import { supabase, formatBRL, isSupabaseConfigured } from '../../lib/supabase';

const CORES_PALETA = ['#701D2B', '#C69A55', '#542C20', '#A99B91', '#8E2839'];

const PROJECAO_MENSAL_FALLBACK = [
  { mes: 'Mês 1', faturamento: 105000, despesas: 76500, lucro: 28500 },
  { mes: 'Mês 2', faturamento: 115000, despesas: 81200, lucro: 33800 },
  { mes: 'Mês 3', faturamento: 125000, despesas: 86400, lucro: 38600 },
  { mes: 'Mês 4', faturamento: 135000, despesas: 91800, lucro: 43200 },
  { mes: 'Mês 5', faturamento: 145000, despesas: 97100, lucro: 47900 },
  { mes: 'Mês 6', faturamento: 155000, despesas: 102500, lucro: 52500 },
];

const CANAIS_FALLBACK = [
  { canal: 'Salão & Balcão (50%)', receita: 67500, margem: 68.5 },
  { canal: 'Delivery (30%)', receita: 40500, margem: 61.2 },
  { canal: 'Encomendas & B2B (20%)', receita: 27000, margem: 71.8 },
];

const COMPOSICAO_DRE = [
  { nome: 'Lucro Líquido Est.', valor: 39200 },
  { nome: 'CMV (Insumos/Emb.)', valor: 39150 },
  { nome: 'Despesas Fixas/Folha', valor: 34800 },
  { nome: 'Impostos (Presumido)', valor: 15295 },
  { nome: 'Taxas Cartão/Apps', valor: 6555 },
];

export const DashboardExecutivoPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<'mes_atual' | 'semestre_projetado'>('semestre_projetado');
  const [canalFiltro, setCanalFiltro] = useState<string>('todos');
  const [kpisReais, setKpisReais] = useState<any>(null);
  const [dadosCanais, setDadosCanais] = useState<any[]>(CANAIS_FALLBACK);
  const [dadosProjecao, setDadosProjecao] = useState<any[]>(PROJECAO_MENSAL_FALLBACK);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function carregarDashboard() {
      const [{ data: kpiData }, { data: paramData }] = await Promise.all([
        supabase.from('vw_dashboard_executivo_kpis').select('*').limit(1).single(),
        supabase.from('parametros_simulacao').select('*').eq('ativo', true).limit(1).single(),
      ]);

      if (kpiData) setKpisReais(kpiData);

      if (paramData?.projecao_mensal_json) {
        const p = paramData.projecao_mensal_json;
        const serie = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((chave, idx) => {
          const fat = Number(p[chave] || 0);
          const desp = Math.round(fat * 0.68);
          return {
            mes: `Mês ${idx + 1}`,
            faturamento: fat,
            despesas: desp,
            lucro: fat - desp,
          };
        });
        setDadosProjecao(serie);
      }
    }

    carregarDashboard();
  }, []);

  const canaisFiltrados =
    canalFiltro === 'todos'
      ? dadosCanais
      : dadosCanais.filter((c) => c.canal.toLowerCase().includes(canalFiltro));

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros Dinâmicos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8D4BC]">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#701D2B]">
            Painel Exclusivo da Diretoria
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#542C20]">
            Dashboard Executivo & Indicadores
          </h1>
          <p className="text-xs text-[#7F7269] mt-0.5">
            Unidade Matriz Setor Sul (Goiânia/GO) • Premissas demonstrativas e dados consolidados do Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#7F7269] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#701D2B]" />
            Filtros:
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="text-xs bg-[#FBF5EE] border border-[#E8D4BC] rounded-lg px-3 py-2 font-medium text-[#542C20]"
          >
            <option value="semestre_projetado">Projeção Semestral (M1–M6)</option>
            <option value="mes_atual">Competência Atual (Nov/2026)</option>
          </select>
          <select
            value={canalFiltro}
            onChange={(e) => setCanalFiltro(e.target.value)}
            className="text-xs bg-[#FBF5EE] border border-[#E8D4BC] rounded-lg px-3 py-2 font-medium text-[#542C20]"
          >
            <option value="todos">Todos os Canais</option>
            <option value="salão">Salão & Balcão</option>
            <option value="delivery">Delivery</option>
            <option value="encomendas">Encomendas & B2B</option>
          </select>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-[#701D2B]">
            <span className="text-xs font-semibold">Faturamento Mês Ref.</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#542C20]">
            {formatBRL(periodo === 'semestre_projetado' ? 135000 : 135375.8)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">+8,0% vs mês anterior</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-[#C69A55]">
            <span className="text-xs font-semibold text-[#542C20]">Resultado Líquido</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#542C20]">
            {formatBRL(39200)}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">Margem líquida: 29,0%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-[#701D2B]">
            <span className="text-xs font-semibold">Saldo Caixa & Bancos</span>
            <LandmarkIcon />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#542C20]">
            {formatBRL(kpisReais?.saldo_caixa_bancos ?? 347100)}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">Capital inicial: R$ 1,27M</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-[#701D2B]">
            <span className="text-xs font-semibold">Ticket Médio Ref.</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#542C20]">
            {formatBRL(25.0)}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">28 SKUs ativos no mix</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-[#C69A55]">
            <span className="text-xs font-semibold text-[#542C20]">Índice Qualidade BPF</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#542C20]">98,4%</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">100% lotes rastreados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8D4BC] shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold text-[#542C20]">Alertas Operacionais</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="font-serif text-2xl font-bold mt-2 text-[#701D2B]">2 Ativos</p>
          <p className="text-[11px] text-[#7F7269] mt-1">1 Reposição • 1 OS Forno</p>
        </div>
      </div>

      {/* Linha 1 de Gráficos Interativos */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Gráfico de Área: Evolução Faturamento x Despesas x Lucro */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E8D4BC]">
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold text-[#542C20]">
              Evolução Projetada de Faturamento e Resultado (M1 a M6)
            </h2>
            <p className="text-xs text-[#7F7269]">
              Passe o cursor sobre os meses para inspecionar faturamento bruto, despesas e lucro estimado.
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosProjecao} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBordo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#701D2B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#701D2B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradChampagne" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C69A55" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#C69A55" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D4BC" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#542C20' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7F7269' }}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatBRL(value)}
                  contentStyle={{
                    backgroundColor: '#FBF5EE',
                    borderColor: '#C69A55',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento Bruto"
                  stroke="#701D2B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradBordo)"
                />
                <Area
                  type="monotone"
                  dataKey="lucro"
                  name="Resultado Operacional"
                  stroke="#C69A55"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradChampagne)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras: Receita e Margem por Canal */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E8D4BC]">
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold text-[#542C20]">
              Receita por Canal de Venda
            </h2>
            <p className="text-xs text-[#7F7269]">
              Distribuição comercial conforme premissa (50% Salão/Balcão, 30% Delivery, 20% Encomendas).
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={canaisFiltrados} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D4BC" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#7F7269' }}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="canal"
                  type="category"
                  width={125}
                  tick={{ fontSize: 11, fill: '#542C20' }}
                />
                <Tooltip
                  formatter={(value: number) => formatBRL(value)}
                  contentStyle={{
                    backgroundColor: '#FBF5EE',
                    borderColor: '#C69A55',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="receita" name="Receita Mensal" radius={[0, 8, 8, 0]}>
                  {canaisFiltrados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Linha 2: Composição do Resultado (Donut) + Indicadores de Patrimônio & Operação */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E8D4BC]">
          <h2 className="font-serif text-xl font-bold text-[#542C20]">
            Composição do Faturamento (DRE Gerencial)
          </h2>
          <p className="text-xs text-[#7F7269] mb-2">
            Regime simulado: Lucro Presumido (11,33% tributos sobre receita).
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COMPOSICAO_DRE}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {COMPOSICAO_DRE.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBRL(value)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E8D4BC] flex flex-col justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#542C20]">
              Resumo Executivo por Área Operacional
            </h2>
            <p className="text-xs text-[#7F7269] mb-4">
              Consolidação rápida de Produção, Estoque, RH, Patrimônio e Fornecedores.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                <p className="font-bold text-[#701D2B]">Produção & PCP (Início 06h)</p>
                <p className="mt-1 text-[#542C20]">OP-2026-089 (Éclair Francês) concluída com 98,3% de rendimento. Perda registrada: R$ 10,20.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                <p className="font-bold text-[#701D2B]">Estoque & FEFO</p>
                <p className="mt-1 text-[#542C20]">6 lotes ativos em câmaras monitoradas (REF-CAM-02-03 a 2,8°C). 1 item em ponto de reposição.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                <p className="font-bold text-[#701D2B]">Fornecedores & Compras</p>
                <p className="mt-1 text-[#542C20]">Nota média dos 4 fornecedores homologados: 4,80 / 5,00. Pedido PC-2026-014 aprovado.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                <p className="font-bold text-[#701D2B]">RH & Patrimônio</p>
                <p className="mt-1 text-[#542C20]">100% da equipe treinada em LGPD. R$ 156.300,00 em equipamentos com QR Code e depreciação linear.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8D4BC] flex items-center justify-between text-xs text-[#7F7269]">
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-[#701D2B]" />
              Conectado em tempo real às views do Supabase PostgreSQL
            </span>
            <span className="font-semibold text-[#701D2B]">Versão 1.0 • Portfólio</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandmarkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
  </svg>
);