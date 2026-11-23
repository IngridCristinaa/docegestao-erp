import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CheckCircle2,
  Plus,
  X,
  Building2,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface LancamentoFinanceiro {
  id: string;
  unidade_id: string;
  conta_bancaria_id: string | null;
  plano_contas_id: string;
  centro_custo_id: string | null;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor_bruto: number;
  valor_taxas: number;
  valor_liquido: number;
  data_competencia: string;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  status: 'previsto' | 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  conciliado: boolean;
  plano_contas?: { codigo: string; nome: string } | any;
  centros_custo?: { codigo: string; nome: string } | any;
}

interface ContaBancaria {
  id: string;
  unidade_id: string;
  banco_nome: string;
  agencia: string;
  conta_numero: string;
  tipo: string;
  saldo_atual: number;
}

const extrairItem = <T,>(valor: T | T[] | null | undefined): T | undefined => {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
};

export const FinanceiroDrePage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<'dre' | 'titulos' | 'tesouraria' | 'fiscal'>('dre');

  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [folhaTotal, setFolhaTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Filtros de Títulos
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Simulador Tributário Interativo
  const [regimeTributario, setRegimeTributario] = useState<'simples' | 'presumido' | 'reforma'>(
    'simples'
  );

  // Modal Novo Lançamento
  const [modalNovo, setModalNovo] = useState(false);
  const [formTipo, setFormTipo] = useState<'receita' | 'despesa'>('despesa');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState<number>(850);
  const [formTaxas, setFormTaxas] = useState<number>(0);
  const [formVencimento, setFormVencimento] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formForma, setFormForma] = useState('pix');
  const [formStatus, setFormStatus] = useState<'pendente' | 'pago'>('pendente');

  const carregarTudo = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resLanc, resBancos, resFolha] = await Promise.all([
        supabase
          .from('lancamentos_financeiros')
          .select('*, plano_contas(codigo, nome), centros_custo(codigo, nome)')
          .order('data_vencimento', { ascending: false }),
        supabase.from('contas_bancarias').select('*').eq('ativo', true),
        supabase.from('folha_gerencial').select('liquido_estimado'),
      ]);

      if (resLanc.error) throw resLanc.error;

      setLancamentos((resLanc.data as unknown as LancamentoFinanceiro[]) || []);
      setContasBancarias((resBancos.data as ContaBancaria[]) || []);

      const somaFolha = (resFolha.data || []).reduce(
        (acc: number, f: any) => acc + Number(f.liquido_estimado || 0),
        0
      );
      setFolhaTotal(somaFolha);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  // Baixar / Liquidar Título Financeiro
  const liquidarTitulo = async (lanc: LancamentoFinanceiro) => {
    setSalvando(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { error: errUpd } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status: 'pago',
          data_pagamento: hoje,
          conciliado: true,
        })
        .eq('id', lanc.id);

      if (errUpd) throw errUpd;

      // Atualiza saldo da conta bancária principal
      if (contasBancarias[0]) {
        const delta =
          lanc.tipo === 'receita' ? Number(lanc.valor_liquido) : -Number(lanc.valor_liquido);
        await supabase
          .from('contas_bancarias')
          .update({ saldo_atual: Number(contasBancarias[0].saldo_atual) + delta })
          .eq('id', contasBancarias[0].id);
      }

      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao liquidar lançamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Salvar Novo Lançamento
  const salvarNovoLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescricao.trim() || formValor <= 0) return;

    setSalvando(true);
    setErro(null);
    try {
      const ref = lancamentos[0];
      const { data: planoSample } = await supabase.from('plano_contas').select('id').limit(1).single();

      const { error: errIns } = await supabase.from('lancamentos_financeiros').insert({
        unidade_id:
          ref?.unidade_id ||
          contasBancarias[0]?.unidade_id ||
          '11111111-1111-1111-1111-111111111101',
        conta_bancaria_id: contasBancarias[0]?.id || null,
        plano_contas_id: ref?.plano_contas_id || planoSample?.id,
        centro_custo_id: ref?.centro_custo_id || null,
        tipo: formTipo,
        descricao: formDescricao.trim(),
        valor_bruto: Number(formValor),
        valor_taxas: Number(formTaxas),
        data_competencia: formVencimento,
        data_vencimento: formVencimento,
        data_pagamento: formStatus === 'pago' ? formVencimento : null,
        forma_pagamento: formForma,
        status: formStatus,
        conciliado: formStatus === 'pago',
      });

      if (errIns) throw errIns;

      setModalNovo(false);
      setFormDescricao('');
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar lançamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Indicadores Financeiros & DRE Dinâmicos
  const dre = useMemo(() => {
    const validos = lancamentos.filter((l) => l.status !== 'cancelado');

    const receitaBruta = validos
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc + Number(l.valor_bruto || 0), 0);

    const taxasFinanceiras = validos
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc + Number(l.valor_taxas || 0), 0);

    const aliquotaImposto =
      regimeTributario === 'simples' ? 0.06 : regimeTributario === 'presumido' ? 0.1133 : 0.088;
    const impostosSobreVenda = receitaBruta * aliquotaImposto;

    const receitaLiquida = receitaBruta - taxasFinanceiras - impostosSobreVenda;

    const despesasOperacionais = validos
      .filter((l) => l.tipo === 'despesa')
      .reduce((acc, l) => acc + Number(l.valor_bruto || 0), 0);

    const custoPessoal = folhaTotal;
    const ebitda = receitaLiquida - despesasOperacionais - custoPessoal;
    const margemLiquidaPct = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0;

    const saldoBancarioTotal = contasBancarias.reduce(
      (acc, c) => acc + Number(c.saldo_atual || 0),
      0
    );

    const aReceberAberto = validos
      .filter((l) => l.tipo === 'receita' && ['pendente', 'previsto', 'atrasado'].includes(l.status))
      .reduce((acc, l) => acc + Number(l.valor_liquido || 0), 0);

    const aPagarAberto = validos
      .filter((l) => l.tipo === 'despesa' && ['pendente', 'previsto', 'atrasado'].includes(l.status))
      .reduce((acc, l) => acc + Number(l.valor_liquido || 0), 0);

    return {
      receitaBruta,
      taxasFinanceiras,
      impostosSobreVenda,
      aliquotaImposto,
      receitaLiquida,
      despesasOperacionais,
      custoPessoal,
      ebitda,
      margemLiquidaPct,
      saldoBancarioTotal,
      aReceberAberto,
      aPagarAberto,
    };
  }, [lancamentos, contasBancarias, folhaTotal, regimeTributario]);

  // Dados para Gráfico Recharts
  const dadosGrafico = useMemo(() => {
    return [
      {
        categoria: 'Receita Bruta',
        Receitas: Number(dre.receitaBruta.toFixed(2)),
        Saidas: 0,
      },
      {
        categoria: 'Impostos & Taxas',
        Receitas: 0,
        Saidas: Number((dre.impostosSobreVenda + dre.taxasFinanceiras).toFixed(2)),
      },
      {
        categoria: 'Insumos & Fixos',
        Receitas: 0,
        Saidas: Number(dre.despesasOperacionais.toFixed(2)),
      },
      {
        categoria: 'Folha Pessoal',
        Receitas: 0,
        Saidas: Number(dre.custoPessoal.toFixed(2)),
      },
      {
        categoria: 'Resultado (EBITDA)',
        Receitas: dre.ebitda >= 0 ? Number(dre.ebitda.toFixed(2)) : 0,
        Saidas: dre.ebitda < 0 ? Math.abs(Number(dre.ebitda.toFixed(2))) : 0,
      },
    ];
  }, [dre]);

  const titulosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      const bateTipo = filtroTipo === 'todos' || l.tipo === filtroTipo;
      const bateStatus = filtroStatus === 'todos' || l.status === filtroStatus;
      return bateTipo && bateStatus;
    });
  }, [lancamentos, filtroTipo, filtroStatus]);

  const dadosCsv = useMemo(
    () =>
      titulosFiltrados.map((l) => ({
        Tipo: l.tipo.toUpperCase(),
        Descricao: l.descricao,
        Competencia: l.data_competencia,
        Vencimento: l.data_vencimento,
        Valor_Bruto_R$: Number(l.valor_bruto).toFixed(2),
        Taxas_R$: Number(l.valor_taxas).toFixed(2),
        Valor_Liquido_R$: Number(l.valor_liquido).toFixed(2),
        Status: l.status.toUpperCase(),
      })),
    [titulosFiltrados]
  );

  const av = (valor: number) =>
    dre.receitaBruta > 0 ? `${((valor / dre.receitaBruta) * 100).toFixed(1)}%` : '0,0%';

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.10 & 5.11 • Controladoria, Financeiro, DRE & Fiscal"
        titulo="Controladoria Financeira, DRE Gerencial & Tesouraria"
        descricao="Demonstração de Resultado do Exercício (DRE) integrada com vendas, folha e compras, gestão de títulos a pagar/receber e simulador tributário."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_financeiro_dre.csv"
        textoBotaoNovo="Novo Lançamento"
        onNovoRegistro={() => setModalNovo(true)}
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* 4 KPIS EXECUTIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Disponibilidade Caixa & Bancos</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            R$ {dre.saldoBancarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            A Receber em aberto: R$ {dre.aReceberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Receita Bruta Competência</span>
            <TrendingUp className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">
            R$ {dre.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Salão, Loja Digital & Eventos B2B
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Despesas + Folha Pessoal</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            R${' '}
            {(dre.despesasOperacionais + dre.custoPessoal).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            A Pagar em aberto: R$ {dre.aPagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Resultado Líquido (EBITDA)</span>
            <DollarSign className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p
            className={`text-2xl font-bold mt-1 ${
              dre.ebitda >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            R$ {dre.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Margem Operacional: <strong>{dre.margemLiquidaPct.toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="bg-white p-2 rounded-2xl border border-[#E8D4BC] flex flex-wrap gap-2">
        {[
          { id: 'dre', label: 'DRE Gerencial & Composição', icon: Receipt },
          { id: 'titulos', label: 'Contas a Pagar & Receber', icon: DollarSign },
          { id: 'tesouraria', label: 'Tesouraria & Contas Bancárias', icon: Building2 },
          { id: 'fiscal', label: 'Simulador Tributário & Fiscal', icon: Calculator },
        ].map((tab) => {
          const Icone = tab.icon;
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                ativa
                  ? 'bg-[#701D2B] text-white'
                  : 'text-[#542C20] hover:bg-[#F5E8D8]'
              }`}
            >
              <Icone className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== ABA 1: DRE GERENCIAL & GRÁFICO ==================== */}
      {abaAtiva === 'dre' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tabela DRE Estruturada */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40 flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Demonstração do Resultado (DRE Gerencial)
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-white border border-[#E8D4BC] text-[#701D2B]">
                Competência 2026-11
              </span>
            </div>
            <div className="p-4 text-xs divide-y divide-[#F5E8D8]">
              <div className="py-2.5 flex justify-between font-bold text-[#542C20]">
                <span>1. (+) RECEITA OPERACIONAL BRUTA</span>
                <div className="flex gap-6">
                  <span className="text-emerald-700">
                    R$ {dre.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right text-[#7F7269]">100,0%</span>
                </div>
              </div>

              <div className="py-2.5 flex justify-between text-[#7F7269] pl-3">
                <span>(-) Impostos sobre Faturamento ({(dre.aliquotaImposto * 100).toFixed(2)}%)</span>
                <div className="flex gap-6">
                  <span className="text-red-700">
                    -R$ {dre.impostosSobreVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right">{av(dre.impostosSobreVenda)}</span>
                </div>
              </div>

              <div className="py-2.5 flex justify-between text-[#7F7269] pl-3">
                <span>(-) Taxas de Adquirência & Meios de Pagamento</span>
                <div className="flex gap-6">
                  <span className="text-red-700">
                    -R$ {dre.taxasFinanceiras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right">{av(dre.taxasFinanceiras)}</span>
                </div>
              </div>

              <div className="py-2.5 flex justify-between font-bold text-[#542C20] bg-[#FBF5EE] px-2 rounded">
                <span>2. (=) RECEITA OPERACIONAL LÍQUIDA</span>
                <div className="flex gap-6">
                  <span>
                    R$ {dre.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right text-[#7F7269]">{av(dre.receitaLiquida)}</span>
                </div>
              </div>

              <div className="py-2.5 flex justify-between text-[#7F7269] pl-3">
                <span>(-) Insumos, Embalagens & Despesas Fixas Operacionais</span>
                <div className="flex gap-6">
                  <span className="text-red-700">
                    -R$ {dre.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right">{av(dre.despesasOperacionais)}</span>
                </div>
              </div>

              <div className="py-2.5 flex justify-between text-[#7F7269] pl-3">
                <span>(-) Folha Gerencial & Encargos (Integração RH)</span>
                <div className="flex gap-6">
                  <span className="text-red-700">
                    -R$ {dre.custoPessoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right">{av(dre.custoPessoal)}</span>
                </div>
              </div>

              <div className="py-3.5 flex justify-between text-sm font-bold text-[#F5E8D8] bg-[#701D2B] px-3 rounded-xl mt-2">
                <span>3. (=) RESULTADO OPERACIONAL LÍQUIDO (EBITDA)</span>
                <div className="flex gap-6">
                  <span>
                    R$ {dre.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-12 text-right text-[#C69A55]">{av(dre.ebitda)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras DRE */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#E8D4BC] flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Composição do Resultado Gerencial
              </h3>
              <p className="text-xs text-[#7F7269] mb-4">
                Comparativo visual entre geração de receita, custos e margem líquida.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D8" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: '#542C20' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#7F7269' }} />
                  <Tooltip
                    formatter={(val: any) =>
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Receitas" fill="#15803d" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Saidas" fill="#701D2B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: CONTAS A PAGAR & RECEBER ==================== */}
      {abaAtiva === 'titulos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#542C20]">
              <Filter className="w-4 h-4 text-[#701D2B]" /> Filtrar Lançamentos:
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E8D4BC] bg-white"
              >
                <option value="todos">Receitas e Despesas</option>
                <option value="receita">Somente Receitas (A Receber)</option>
                <option value="despesa">Somente Despesas (A Pagar)</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E8D4BC] bg-white"
              >
                <option value="todos">Todas as Situações</option>
                <option value="pago">Liquidado / Pago</option>
                <option value="pendente">Pendente</option>
                <option value="previsto">Previsto</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                    <th className="py-3 px-4">Natureza</th>
                    <th className="py-3 px-3">Descrição do Título</th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Forma</th>
                    <th className="py-3 px-3">Valor Líquido</th>
                    <th className="py-3 px-3">Situação</th>
                    <th className="py-3 px-4 text-right">Baixa / Conciliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7F7269]">
                        Carregando lançamentos financeiros...
                      </td>
                    </tr>
                  ) : (
                    titulosFiltrados.map((l) => (
                      <tr key={l.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4">
                          {l.tipo === 'receita' ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> RECEITA
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold inline-flex items-center gap-1">
                              <ArrowDownRight className="w-3.5 h-3.5" /> DESPESA
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#542C20]">{l.descricao}</td>
                        <td className="py-3 px-3">
                          {l.data_vencimento?.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-3 uppercase text-[#7F7269]">
                          {l.forma_pagamento || '-'}
                        </td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            l.tipo === 'receita' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          R$ {Number(l.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              l.status === 'pago'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'atrasado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status === 'pago' ? 'Liquidado' : l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {podeEditar() &&
                          ['pendente', 'previsto', 'atrasado'].includes(l.status) ? (
                            <button
                              onClick={() => liquidarTitulo(l)}
                              disabled={salvando}
                              className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold"
                            >
                              Baixar Título
                            </button>
                          ) : (
                            <span className="text-emerald-700 text-[11px] font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Conciliado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 3: TESOURARIA & BANCOS ==================== */}
      {abaAtiva === 'tesouraria' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contasBancarias.map((cb) => (
            <div
              key={cb.id}
              className="bg-white p-6 rounded-2xl border border-[#E8D4BC] flex justify-between items-center"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#C69A55]">
                  {cb.tipo.replace('_', ' ')}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#542C20]">{cb.banco_nome}</h3>
                <p className="text-xs text-[#7F7269]">
                  Agência: <strong>{cb.agencia}</strong> • Conta: <strong>{cb.conta_numero}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#7F7269]">Saldo Disponível</span>
                <p className="text-2xl font-bold text-emerald-700">
                  R$ {Number(cb.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== ABA 4: SIMULADOR TRIBUTÁRIO & FISCAL ==================== */}
      {abaAtiva === 'fiscal' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8D4BC] space-y-5 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8D4BC] pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#542C20]">
                Planejamento Tributário Comparativo (Sobre Receita Bruta Atual)
              </h3>
              <p className="text-[#7F7269]">
                Simule o impacto tributário na DRE escolhendo o regime fiscal da operação.
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'simples', label: 'Simples Nacional (6,0%)' },
                { id: 'presumido', label: 'Lucro Presumido (11,33%)' },
                { id: 'reforma', label: 'IBS / CBS Transição (8,8%)' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setRegimeTributario(reg.id as any)}
                  className={`px-3 py-2 rounded-xl font-semibold border ${
                    regimeTributario === reg.id
                      ? 'bg-[#701D2B] text-white border-[#701D2B]'
                      : 'bg-[#FBF5EE] text-[#542C20] border-[#E8D4BC]'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <span className="text-[#7F7269]">Base de Cálculo (Receita Bruta)</span>
              <p className="text-xl font-bold text-[#542C20] mt-1">
                R$ {dre.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <span className="text-[#7F7269]">Tributo Mensal Estimado</span>
              <p className="text-xl font-bold text-red-700 mt-1">
                R$ {dre.impostosSobreVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <span className="text-[#7F7269]">EBITDA Resultante no Regime</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                R$ {dre.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO FINANCEIRO */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C69A55]" />
                Novo Lançamento Financeiro
              </h3>
              <button onClick={() => setModalNovo(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoLancamento} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#542C20]">Natureza *</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="despesa">Despesa (Conta a Pagar)</option>
                    <option value="receita">Receita (Conta a Receber)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#542C20]">Status Inicial *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago / Liquidado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Descrição *</label>
                <input
                  type="text"
                  required
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Compra de Favas de Baunilha Madagascar"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Valor Bruto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Taxas (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTaxas}
                    onChange={(e) => setFormTaxas(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formVencimento}
                    onChange={(e) => setFormVencimento(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceiroDrePage;