import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package,
  Truck,
  Wallet,
  Receipt,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

export const ModuloCorporativoUnificadoPage: React.FC = () => {
  const { modulo = 'suprimentos' } = useParams<{ modulo: string }>();
  const { podeEditar } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Estados de dados reais
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  const [pedidosVenda, setPedidosVenda] = useState<any[]>([]);
  const [ordensManutencao, setOrdensManutencao] = useState<any[]>([]);
  const [inventarioLgpd, setInventarioLgpd] = useState<any[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<any[]>([]);

  // Modal Nova OS de Manutenção
  const [modalNovaOs, setModalNovaOs] = useState(false);
  const [formTipoOs, setFormTipoOs] = useState<'preventiva' | 'corretiva'>('preventiva');
  const [formDescOs, setFormDescOs] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [
        resForn,
        resPc,
        resLotes,
        resMov,
        resBancos,
        resPed,
        resOs,
        resLgpd,
        resAudit,
      ] = await Promise.all([
        supabase.from('fornecedores').select('*').order('codigo', { ascending: true }),
        supabase
          .from('pedidos_compra')
          .select('*, fornecedores(nome_fantasia)')
          .order('data_emissao', { ascending: false }),
        supabase
          .from('estoque_lotes')
          .select('*, ingredientes(codigo, nome), produtos(codigo_sku, nome)')
          .order('data_validade', { ascending: true }),
        supabase
          .from('estoque_movimentacoes')
          .select('*, estoque_lotes(codigo_lote)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('contas_bancarias').select('*').eq('ativo', true),
        supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('ordens_servico_manutencao')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('lgpd_inventario_dados').select('*').order('codigo', { ascending: true }),
        supabase
          .from('auditoria_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setFornecedores(resForn.data || []);
      setPedidosCompra(resPc.data || []);
      setLotes(resLotes.data || []);
      setMovimentacoes(resMov.data || []);
      setContasBancarias(resBancos.data || []);
      setPedidosVenda(resPed.data || []);
      setOrdensManutencao(resOs.data || []);
      setInventarioLgpd(resLgpd.data || []);
      setAuditoriaLogs(resAudit.data || []);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados do módulo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [modulo]);

  const aprovarPedidoCompra = async (pcId: string) => {
    setSalvando(true);
    try {
      await supabase
        .from('pedidos_compra')
        .update({ status: 'aprovado', data_aprovacao: new Date().toISOString() })
        .eq('id', pcId);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const criarOsManutencao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescOs.trim()) return;
    setSalvando(true);
    try {
      const { data: equipSample } = await supabase
        .from('equipamentos')
        .select('id, unidade_id')
        .limit(1)
        .maybeSingle();

      if (!equipSample) {
        throw new Error('Cadastre um equipamento ativo antes de abrir uma OS.');
      }

      await supabase.from('ordens_servico_manutencao').insert({
        unidade_id: equipSample.unidade_id,
        equipamento_id: equipSample.id,
        codigo: `OS-2026-${String(Math.floor(100 + Math.random() * 899))}`,
        tipo: formTipoOs,
        descricao_problema: formDescOs.trim(),
        status: 'aberta',
      });

      setModalNovaOs(false);
      setFormDescOs('');
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao abrir Ordem de Serviço.');
    } finally {
      setSalvando(false);
    }
  };

  // Indicadores consolidados
  const metricas = useMemo(() => {
    const saldoBancario = contasBancarias.reduce(
      (acc, c) => acc + Number(c.saldo_atual || 0),
      0
    );
    const receitaPedidos = pedidosVenda
      .filter((p) => p.status !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.valor_total || 0), 0);
    const comprasTotais = pedidosCompra.reduce(
      (acc, p) => acc + Number(p.valor_total || 0),
      0
    );
    const valorEstoque = lotes.reduce(
      (acc, l) => acc + Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0),
      0
    );

    return { saldoBancario, receitaPedidos, comprasTotais, valorEstoque };
  }, [contasBancarias, pedidosVenda, pedidosCompra, lotes]);

  const configModulo = useMemo(() => {
    if (modulo.includes('supriment') || modulo.includes('compra') || modulo.includes('estoque')) {
      return {
        categoria: 'Módulo 5.5 & 5.6 • Suprimentos, Compras & Estoque FEFO',
        titulo: 'Fornecedores Homologados, Pedidos de Compra & Lotes FEFO',
        descricao:
          'Gestão de cadeia de suprimentos, aprovação de pedidos de compra e rastreamento de lotes por data de validade (FEFO).',
      };
    }
    if (modulo.includes('financ') || modulo.includes('dre')) {
      return {
        categoria: 'Módulo 5.10 • Financeiro, Tesouraria & DRE Gerencial',
        titulo: 'Disponibilidades Bancárias, Fluxo de Caixa & Resultado',
        descricao:
          'Consolidação de saldos em conta corrente/cofre, receitas operacionais e compromissos de fornecedores.',
      };
    }
    if (modulo.includes('fiscal')) {
      return {
        categoria: 'Módulo 5.11 • Fiscal & Tributário Simulado',
        titulo: 'Simulador Tributário (Simples Nacional / Lucro Presumido) & Documentos',
        descricao:
          'Apuração gerencial de carga tributária estimada sobre faturamento de pâtisserie e cafeteria (ambiente demonstrativo).',
      };
    }
    if (modulo.includes('manutenc')) {
      return {
        categoria: 'Módulo 5.13 • Manutenção & Gestão de Ativos',
        titulo: 'Manutenção Preventiva & Corretiva de Fornos e Câmaras Frias',
        descricao:
          'Controle de ordens de serviço técnicas para preservação da cadeia fria e continuidade da produção.',
      };
    }
    return {
      categoria: 'Módulo 5.14 & 5.15 • Governança, Auditoria & Conformidade LGPD',
      titulo: 'Registro de Operações de Tratamento (ROPA) & Trilha de Auditoria',
      descricao:
        'Transparência de bases legais LGPD, retenção de dados e trilha imutável de auditoria das operações do ERP.',
    };
  }, [modulo]);

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria={configModulo.categoria}
        titulo={configModulo.titulo}
        descricao={configModulo.descricao}
        dadosExportacao={
          modulo.includes('supriment') || modulo.includes('estoque')
            ? lotes
            : modulo.includes('financ') || modulo.includes('fiscal')
            ? contasBancarias
            : inventarioLgpd
        }
        nomeArquivoCsv={`docegestao_${modulo}.csv`}
        textoBotaoNovo={modulo.includes('manutenc') ? 'Nova OS Manutenção' : undefined}
        onNovoRegistro={modulo.includes('manutenc') ? () => setModalNovaOs(true) : undefined}
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* CARDS EXECUTIVOS TRANSVERSAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Saldo Caixa & Bancos</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            R$ {metricas.saldoBancario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Valor Imobilizado em Lotes</span>
            <Package className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">
            R$ {metricas.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Pedidos de Compra</span>
            <Truck className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">
            R$ {metricas.comprasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Processos ROPA / LGPD</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">{inventarioLgpd.length}</p>
        </div>
      </div>

      {/* VISÃO 1: SUPRIMENTOS & ESTOQUE FEFO */}
      {(modulo.includes('supriment') ||
        modulo.includes('compra') ||
        modulo.includes('estoque')) && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Pedidos de Compra & Fornecedores Homologados
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                    <th className="py-3 px-4">Pedido</th>
                    <th className="py-3 px-3">Fornecedor</th>
                    <th className="py-3 px-3">Previsão Entrega</th>
                    <th className="py-3 px-3">Valor Total</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Aprovação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8]">
                  {pedidosCompra.map((pc) => (
                    <tr key={pc.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{pc.codigo}</td>
                      <td className="py-3 px-3 font-semibold text-[#542C20]">
                        {pc.fornecedores?.nome_fantasia || 'Fornecedor Homologado'}
                      </td>
                      <td className="py-3 px-3">
                        {pc.data_previsao_entrega?.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        R$ {Number(pc.valor_total).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 uppercase font-semibold">{pc.status}</td>
                      <td className="py-3 px-4 text-right">
                        {podeEditar() && pc.status === 'aguardando_aprovacao' && (
                          <button
                            onClick={() => aprovarPedidoCompra(pc.id)}
                            disabled={salvando}
                            className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold"
                          >
                            Aprovar Compra
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Posição de Lotes em Estoque (Ordenado por Validade FEFO)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                    <th className="py-3 px-4">Lote</th>
                    <th className="py-3 px-3">Item (Insumo / Produto)</th>
                    <th className="py-3 px-3">Validade FEFO</th>
                    <th className="py-3 px-3">Saldo Atual</th>
                    <th className="py-3 px-3">Situação Sanitária</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8]">
                  {lotes.map((l) => (
                    <tr key={l.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{l.codigo_lote}</td>
                      <td className="py-3 px-3 font-medium text-[#542C20]">
                        {l.ingredientes?.nome || l.produtos?.nome || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {l.data_validade?.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3">
                        {l.quantidade_atual} / {l.quantidade_inicial}
                      </td>
                      <td className="py-3 px-3 uppercase font-bold">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISÃO 2: FINANCEIRO, DRE & FISCAL SIMULADO */}
      {(modulo.includes('financ') || modulo.includes('dre') || modulo.includes('fiscal')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
            <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#701D2B]" />
              DRE Gerencial & Simulação Tributária (Competência Atual)
            </h3>
            <div className="divide-y divide-[#F5E8D8]">
              <div className="py-2.5 flex justify-between">
                <span>(+) Receita Bruta de Vendas (Salão, Delivery & Eventos)</span>
                <strong className="text-emerald-700 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> R${' '}
                  {metricas.receitaPedidos.toFixed(2)}
                </strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>(-) Deduções & Simples Nacional Simulado (6,0%)</span>
                <strong className="text-red-700 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> R${' '}
                  {(metricas.receitaPedidos * 0.06).toFixed(2)}
                </strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>(-) Custo de Mercadoria Vendida (CMV Estimado 28%)</span>
                <strong className="text-red-700">
                  R$ {(metricas.receitaPedidos * 0.28).toFixed(2)}
                </strong>
              </div>
              <div className="py-3 flex justify-between text-sm font-bold text-[#701D2B] bg-[#FBF5EE] px-3 rounded-lg mt-2">
                <span>(=) Margem de Contribuição Operacional</span>
                <span>R$ {(metricas.receitaPedidos * 0.66).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
            <h3 className="font-serif text-lg font-bold text-[#542C20]">
              Contas Bancárias & Tesouraria
            </h3>
            {contasBancarias.map((cb) => (
              <div
                key={cb.id}
                className="p-3.5 rounded-xl border border-[#E8D4BC] bg-[#FBF5EE] flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-[#542C20]">{cb.banco_nome}</p>
                  <p className="text-[#7F7269]">
                    Ag: {cb.agencia} • Conta: {cb.conta_numero} ({cb.tipo})
                  </p>
                </div>
                <span className="text-base font-bold text-emerald-700">
                  R$ {Number(cb.saldo_atual).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISÃO 3: MANUTENÇÃO & ATIVOS */}
      {modulo.includes('manutenc') && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
            <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#701D2B]" />
              Ordens de Serviço — Equipamentos Críticos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                  <th className="py-3 px-4">Código OS</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Descrição Técnica</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8]">
                {ordensManutencao.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#7F7269]">
                      Nenhuma OS aberta no momento. Clique em "Nova OS Manutenção" para registrar.
                    </td>
                  </tr>
                ) : (
                  ordensManutencao.map((os) => (
                    <tr key={os.id}>
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{os.codigo}</td>
                      <td className="py-3 px-3 uppercase font-semibold">{os.tipo}</td>
                      <td className="py-3 px-3">{os.descricao_problema}</td>
                      <td className="py-3 px-3 uppercase font-bold">{os.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISÃO 4: GOVERNANÇA, AUDITORIA & LGPD */}
      {!modulo.includes('supriment') &&
        !modulo.includes('compra') &&
        !modulo.includes('estoque') &&
        !modulo.includes('financ') &&
        !modulo.includes('dre') &&
        !modulo.includes('fiscal') &&
        !modulo.includes('manutenc') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Inventário de Dados Pessoais (ROPA — Art. 37 LGPD)
              </h3>
              {inventarioLgpd.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#E8D4BC] bg-[#FBF5EE] space-y-1"
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-[#701D2B]">{item.codigo}</span>
                    <span className="uppercase font-semibold text-[#C69A55]">
                      Titular: {item.categoria_titular}
                    </span>
                  </div>
                  <p className="font-bold text-[#542C20]">{item.processo_negocio}</p>
                  <p className="text-[#7F7269]">Base Legal: {item.base_legal}</p>
                  <p className="text-[#542C20]">Retenção: {item.prazo_retencao}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Trilha de Auditoria Imutável (Logs Recentes)
              </h3>
              <div className="divide-y divide-[#F5E8D8]">
                {auditoriaLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#701D2B]">{log.tabela_nome}</span>
                      <p className="text-[#7F7269]">{log.operacao}</p>
                    </div>
                    <span className="text-[11px] text-[#7F7269]">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* MODAL NOVA OS MANUTENÇÃO */}
      {modalNovaOs && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Abrir Ordem de Serviço</h3>
              <button onClick={() => setModalNovaOs(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={criarOsManutencao} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Tipo de Manutenção</label>
                <select
                  value={formTipoOs}
                  onChange={(e) => setFormTipoOs(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  <option value="preventiva">Preventiva (Calibração / Vedação)</option>
                  <option value="corretiva">Corretiva</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#542C20]">Descrição Técnica *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescOs}
                  onChange={(e) => setFormDescOs(e.target.value)}
                  placeholder="Ex: Aferição preventiva do termostato da câmara fria principal..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaOs(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  Abrir OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuloCorporativoUnificadoPage;