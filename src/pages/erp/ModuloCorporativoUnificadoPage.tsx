import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package,
  Truck,
  QrCode,
  FolderKanban,
  FileCheck2,
  LockKeyhole,
  Scale,
  Wrench,
  X,
  CheckCircle2,
  AlertTriangle,
  Star,
  Clock,
  SlidersHorizontal,
  ArrowDownCircle,
  PlusCircle,
  Search,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

export const ModuloCorporativoUnificadoPage: React.FC = () => {
  const { modulo = 'estoque' } = useParams<{ modulo: string }>();
  const { podeEditar } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Estoque & FEFO
  const [lotes, setLotes] = useState<any[]>([]);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useState<any[]>([]);
  const [buscaEstoque, setBuscaEstoque] = useState('');
  const [filtroStatusEstoque, setFiltroStatusEstoque] = useState<'todos' | 'liberado' | 'bloqueado'>('todos');

  // Modal Nova Entrada de Lote (Inserir Item)
  const [modalNovoLote, setModalNovoLote] = useState(false);
  const [formIngredienteId, setFormIngredienteId] = useState('');
  const [formCodigoLote, setFormCodigoLote] = useState('');
  const [formValidadeLote, setFormValidadeLote] = useState('');
  const [formQtdEntrada, setFormQtdEntrada] = useState<number>(5000);
  const [formCustoUnitLote, setFormCustoUnitLote] = useState<number>(0.08);
  const [formObsEntrada, setFormObsEntrada] = useState('');

  // Modal Dar Baixa no Lote
  const [modalBaixaLote, setModalBaixaLote] = useState<any | null>(null);
  const [formTipoBaixa, setFormTipoBaixa] = useState<'saida_producao' | 'saida_venda' | 'perda'>(
    'saida_producao'
  );
  const [formQtdBaixa, setFormQtdBaixa] = useState<number>(500);
  const [formObsBaixa, setFormObsBaixa] = useState('');

  // Modal Ajuste de Inventário
  const [modalAjusteLote, setModalAjusteLote] = useState<any | null>(null);
  const [formQtdAjuste, setFormQtdAjuste] = useState<number>(0);
  const [formMotivoAjuste, setFormMotivoAjuste] = useState('');

  // Compras & Fornecedores
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<any[]>([]);
  const [modalNovoPc, setModalNovoPc] = useState(false);
  const [formFornId, setFormFornId] = useState('');
  const [formValorPc, setFormValorPc] = useState<number>(1500);
  const [formObsPc, setFormObsPc] = useState('');

  // Patrimônio (QR)
  const [ativosPatrimonio, setAtivosPatrimonio] = useState<any[]>([]);
  const [movPatrimonio, setMovPatrimonio] = useState<any[]>([]);
  const [qrSelecionado, setQrSelecionado] = useState<any | null>(null);

  // Manutenção & SLA
  const [ordensManutencao, setOrdensManutencao] = useState<any[]>([]);
  const [modalNovaOs, setModalNovaOs] = useState(false);
  const [formTipoOs, setFormTipoOs] = useState<'preventiva' | 'corretiva'>('preventiva');
  const [formDescOs, setFormDescOs] = useState('');

  // Projetos & Tarefas
  const [projetos, setProjetos] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);

  // Documentos GED
  const [documentosGed, setDocumentosGed] = useState<any[]>([]);

  // Segurança & Auditoria
  const [alertasSeguranca, setAlertasSeguranca] = useState<any[]>([]);
  const [acessosLogs, setAcessosLogs] = useState<any[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<any[]>([]);

  // LGPD & Privacidade
  const [inventarioLgpd, setInventarioLgpd] = useState<any[]>([]);
  const [avisosLgpd, setAvisosLgpd] = useState<any[]>([]);
  const [incidentesLgpd, setIncidentesLgpd] = useState<any[]>([]);

  const tipoModulo = useMemo(() => {
    const slug = modulo.toLowerCase();
    if (slug.includes('compra') || slug.includes('fornec') || slug.includes('supriment'))
      return 'compras';
    if (slug.includes('estoque') || slug.includes('fefo')) return 'estoque';
    if (slug.includes('patrimon')) return 'patrimonio';
    if (slug.includes('projet')) return 'projetos';
    if (slug.includes('document') || slug.includes('ged')) return 'documentos';
    if (slug.includes('seguranc') || slug.includes('audit')) return 'seguranca';
    if (slug.includes('lgpd') || slug.includes('privacid')) return 'lgpd';
    if (slug.includes('manutenc')) return 'manutencao';
    return 'estoque';
  }, [modulo]);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      if (tipoModulo === 'estoque') {
        const [resLotes, resIng, resMov] = await Promise.all([
          supabase
            .from('estoque_lotes')
            .select('*, ingredientes(codigo, nome), produtos(codigo_sku, nome)')
            .order('data_validade', { ascending: true }),
          supabase
            .from('ingredientes')
            .select('id, codigo, nome, custo_medio')
            .eq('ativo', true)
            .order('nome', { ascending: true }),
          supabase
            .from('estoque_movimentacoes')
            .select('*, estoque_lotes(codigo_lote)')
            .order('created_at', { ascending: false })
            .limit(25),
        ]);

        if (resLotes.error) throw resLotes.error;

        setLotes(resLotes.data || []);
        const listaIng = resIng.data || [];
        setIngredientes(listaIng);
        if (listaIng.length > 0 && !formIngredienteId) {
          setFormIngredienteId(listaIng[0].id);
          setFormCustoUnitLote(Number(listaIng[0].custo_medio || 0.08));
        }
        setMovimentacoesEstoque(resMov.data || []);
      } else if (tipoModulo === 'compras') {
        const [resForn, resPc] = await Promise.all([
          supabase.from('fornecedores').select('*').order('codigo', { ascending: true }),
          supabase
            .from('pedidos_compra')
            .select('*, fornecedores(nome_fantasia, categoria_fornecimento)')
            .order('data_emissao', { ascending: false }),
        ]);
        const listaForn = resForn.data || [];
        setFornecedores(listaForn);
        if (listaForn.length > 0 && !formFornId) {
          setFormFornId(listaForn[0].id);
        }
        setPedidosCompra(resPc.data || []);
      } else if (tipoModulo === 'patrimonio') {
        const [resAtivos, resMov] = await Promise.all([
          supabase
            .from('vw_patrimonio_depreciacao')
            .select('*')
            .order('codigo_patrimonio', { ascending: true }),
          supabase
            .from('movimentacoes_patrimoniais')
            .select('*, ativos_patrimoniais(codigo_patrimonio, nome)')
            .order('created_at', { ascending: false }),
        ]);
        setAtivosPatrimonio(resAtivos.data || []);
        setMovPatrimonio(resMov.data || []);
      } else if (tipoModulo === 'manutencao') {
        const resOs = await supabase
          .from('ordens_servico_manutencao')
          .select('*')
          .order('created_at', { ascending: false });
        setOrdensManutencao(resOs.data || []);
      } else if (tipoModulo === 'projetos') {
        const [resProj, resTar] = await Promise.all([
          supabase.from('projetos').select('*').order('codigo', { ascending: true }),
          supabase
            .from('tarefas')
            .select('*, projetos(codigo, nome)')
            .order('prazo', { ascending: true }),
        ]);
        setProjetos(resProj.data || []);
        setTarefas(resTar.data || []);
      } else if (tipoModulo === 'documentos') {
        const resDoc = await supabase
          .from('documentos_ged')
          .select('*')
          .order('codigo', { ascending: true });
        setDocumentosGed(resDoc.data || []);
      } else if (tipoModulo === 'seguranca') {
        const [resAlertas, resAcessos, resAudit] = await Promise.all([
          supabase.from('alertas_seguranca').select('*').order('created_at', { ascending: false }),
          supabase
            .from('seguranca_acessos_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('auditoria_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
        ]);
        setAlertasSeguranca(resAlertas.data || []);
        setAcessosLogs(resAcessos.data || []);
        setAuditoriaLogs(resAudit.data || []);
      } else if (tipoModulo === 'lgpd') {
        const [resInv, resAvisos, resInc] = await Promise.all([
          supabase.from('lgpd_inventario_dados').select('*').order('codigo', { ascending: true }),
          supabase
            .from('lgpd_avisos_privacidade')
            .select('*')
            .order('publicado_em', { ascending: false }),
          supabase.from('lgpd_incidentes').select('*').order('data_ocorrencia', { ascending: false }),
        ]);
        setInventarioLgpd(resInv.data || []);
        setAvisosLgpd(resAvisos.data || []);
        setIncidentesLgpd(resInc.data || []);
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados do módulo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [tipoModulo]);

  // 1. INSERIR NOVO LOTE / ENTRADA DE ESTOQUE
  const abrirModalNovoLote = () => {
    const valPadrao = new Date();
    valPadrao.setDate(valPadrao.getDate() + 45);
    setFormCodigoLote(`LOT-2026-${String(Math.floor(100 + Math.random() * 899))}`);
    setFormValidadeLote(valPadrao.toISOString().split('T')[0]);
    setFormQtdEntrada(5000);
    setFormObsEntrada('');
    setModalNovoLote(true);
  };

  const salvarNovoLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIngredienteId || !formCodigoLote.trim() || formQtdEntrada <= 0) return;

    setSalvando(true);
    setErro(null);
    try {
      const { data: unSample } = await supabase.from('unidades').select('id').limit(1).maybeSingle();
      const unidadeId =
        lotes[0]?.unidade_id || unSample?.id || '11111111-1111-1111-1111-111111111101';

      const { data: loteCriado, error: errLote } = await supabase
        .from('estoque_lotes')
        .insert({
          unidade_id: unidadeId,
          ingrediente_id: formIngredienteId,
          codigo_lote: formCodigoLote.trim().toUpperCase(),
          data_fabricacao: new Date().toISOString().split('T')[0],
          data_validade: formValidadeLote,
          quantidade_inicial: Number(formQtdEntrada),
          quantidade_atual: Number(formQtdEntrada),
          custo_unitario: Number(formCustoUnitLote),
          status: 'liberado',
        })
        .select('id')
        .single();

      if (errLote) throw errLote;

      if (loteCriado?.id) {
        await supabase.from('estoque_movimentacoes').insert({
          unidade_id: unidadeId,
          lote_id: loteCriado.id,
          tipo_movimentacao: 'entrada_compra',
          quantidade: Number(formQtdEntrada),
          custo_unitario: Number(formCustoUnitLote),
          observacao:
            formObsEntrada.trim() ||
            `Entrada manual de lote ${formCodigoLote.trim().toUpperCase()} no almoxarifado.`,
        });
      }

      setModalNovoLote(false);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao inserir novo lote no estoque.');
    } finally {
      setSalvando(false);
    }
  };

  // 2. DAR BAIXA EM LOTE (PRODUÇÃO, VENDA OU PERDA)
  const abrirModalBaixa = (lote: any) => {
    setModalBaixaLote(lote);
    setFormTipoBaixa('saida_producao');
    setFormQtdBaixa(Math.min(500, Number(lote.quantidade_atual || 0)));
    setFormObsBaixa('');
  };

  const confirmarBaixaLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBaixaLote || formQtdBaixa <= 0) return;

    const saldoAtual = Number(modalBaixaLote.quantidade_atual || 0);
    if (formQtdBaixa > saldoAtual) {
      setErro(`Quantidade de baixa (${formQtdBaixa}) maior que o saldo do lote (${saldoAtual}).`);
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const novoSaldo = saldoAtual - Number(formQtdBaixa);

      const { error: errUpd } = await supabase
        .from('estoque_lotes')
        .update({ quantidade_atual: novoSaldo })
        .eq('id', modalBaixaLote.id);

      if (errUpd) throw errUpd;

      await supabase.from('estoque_movimentacoes').insert({
        unidade_id: modalBaixaLote.unidade_id,
        lote_id: modalBaixaLote.id,
        tipo_movimentacao: formTipoBaixa,
        quantidade: Number(formQtdBaixa),
        custo_unitario: Number(modalBaixaLote.custo_unitario || 0),
        observacao:
          formObsBaixa.trim() ||
          `Baixa FEFO (${formTipoBaixa.replace('_', ' ')}) registrada no almoxarifado.`,
      });

      setModalBaixaLote(null);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar baixa do lote.');
    } finally {
      setSalvando(false);
    }
  };

  // 3. AJUSTE DE INVENTÁRIO
  const abrirAjusteLote = (lote: any) => {
    setModalAjusteLote(lote);
    setFormQtdAjuste(Number(lote.quantidade_atual || 0));
    setFormMotivoAjuste('');
  };

  const salvarAjusteInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAjusteLote) return;
    setSalvando(true);
    try {
      const novaQtd = Math.max(0, Number(formQtdAjuste));
      const diferenca = novaQtd - Number(modalAjusteLote.quantidade_atual || 0);

      await supabase
        .from('estoque_lotes')
        .update({ quantidade_atual: novaQtd })
        .eq('id', modalAjusteLote.id);

      await supabase.from('estoque_movimentacoes').insert({
        unidade_id: modalAjusteLote.unidade_id,
        lote_id: modalAjusteLote.id,
        tipo_movimentacao: 'ajuste_inventario',
        quantidade: Math.abs(diferenca),
        custo_unitario: Number(modalAjusteLote.custo_unitario || 0),
        observacao:
          formMotivoAjuste.trim() ||
          `Ajuste físico de inventário (${diferenca >= 0 ? '+' : ''}${diferenca}).`,
      });

      setModalAjusteLote(null);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar ajuste de estoque.');
    } finally {
      setSalvando(false);
    }
  };

  // Ações de Compras & Fornecedores
  const avancarStatusPedidoCompra = async (pcId: string, novoStatus: string) => {
    setSalvando(true);
    try {
      await supabase
        .from('pedidos_compra')
        .update({
          status: novoStatus,
          ...(novoStatus === 'aprovado' ? { data_aprovacao: new Date().toISOString() } : {}),
        })
        .eq('id', pcId);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const criarPedidoCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFornId || formValorPc <= 0) return;
    setSalvando(true);
    try {
      const fornecedorEscolhido = fornecedores.find((f) => f.id === formFornId);
      const previsao = new Date();
      previsao.setDate(previsao.getDate() + Number(fornecedorEscolhido?.prazo_entrega_dias || 3));

      const { data: unSample } = await supabase.from('unidades').select('id').limit(1).maybeSingle();

      await supabase.from('pedidos_compra').insert({
        codigo: `PC-2026-${String(Math.floor(100 + Math.random() * 899))}`,
        unidade_id: unSample?.id || '11111111-1111-1111-1111-111111111101',
        fornecedor_id: formFornId,
        data_emissao: new Date().toISOString().split('T')[0],
        data_previsao_entrega: previsao.toISOString().split('T')[0],
        valor_total: Number(formValorPc),
        condicao_pagamento: fornecedorEscolhido?.condicao_pagamento || '28 dias',
        observacoes: formObsPc.trim() || 'Solicitação de reposição emitida via ERP.',
        status: 'aguardando_aprovacao',
      });

      setModalNovoPc(false);
      setFormObsPc('');
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao emitir pedido de compra.');
    } finally {
      setSalvando(false);
    }
  };

  const aprovarMovimentacaoPatrimonial = async (movId: string) => {
    setSalvando(true);
    try {
      await supabase
        .from('movimentacoes_patrimoniais')
        .update({ status_aprovacao: 'aprovado', data_aprovacao: new Date().toISOString() })
        .eq('id', movId);
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

  const cabecalho = useMemo(() => {
    switch (tipoModulo) {
      case 'estoque':
        return {
          categoria: 'Módulo 5.6 • Almoxarifado, Lotes & Valoração FEFO',
          titulo: 'Controle de Estoque FEFO, Valoração & Rastreabilidade',
          descricao:
            'Valoração financeira do estoque em tempo real, entrada de novos lotes, baixas por produção/venda/perda e Kardex.',
          csv: lotes.map((l) => ({
            Lote: l.codigo_lote,
            Item: l.ingredientes?.nome || l.produtos?.nome || '-',
            Validade: l.data_validade,
            Saldo_Atual: l.quantidade_atual,
            Custo_Unitario_R$: Number(l.custo_unitario || 0).toFixed(4),
            Valor_Total_R$: (
              Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0)
            ).toFixed(2),
            Status: l.status,
          })),
          botaoNovo: 'Inserir Novo Lote',
          acaoNovo: abrirModalNovoLote,
        };
      case 'compras':
        return {
          categoria: 'Módulo 5.5 • Suprimentos, Compras & Homologação',
          titulo: 'Pedidos de Compra & Fornecedores Homologados',
          descricao:
            'Emissão e aprovação de ordens de compra, controle de lead time de entrega e avaliação de SLA de fornecedores.',
          csv: pedidosCompra,
          botaoNovo: 'Novo Pedido de Compra',
          acaoNovo: () => setModalNovoPc(true),
        };
      case 'patrimonio':
        return {
          categoria: 'Módulo 5.7 • Patrimônio & Ativos Imobilizados (QR Code)',
          titulo: 'Tombamento, Etiquetas QR & Depreciação Contábil',
          descricao:
            'Controle individual de fornos, batedeiras, câmaras frias e mobiliário com cálculo de depreciação linear.',
          csv: ativosPatrimonio,
          botaoNovo: undefined,
          acaoNovo: undefined,
        };
      case 'projetos':
        return {
          categoria: 'Módulo 5.13 • Projetos & Iniciativas Estratégicas',
          titulo: 'Portfólio de Projetos, Cronogramas & Entregáveis',
          descricao:
            'Acompanhamento de expansão de unidades, lançamentos sazonais e implantação de melhorias contínuas.',
          csv: projetos,
          botaoNovo: undefined,
          acaoNovo: undefined,
        };
      case 'documentos':
        return {
          categoria: 'Módulo 5.14 • Gestão Eletrônica de Documentos (GED)',
          titulo: 'Repositório Institucional, Alvarás Sanitários & Contratos',
          descricao:
            'Controle de versionamento, vigência documental, níveis de sigilo e assinatura eletrônica.',
          csv: documentosGed,
          botaoNovo: undefined,
          acaoNovo: undefined,
        };
      case 'seguranca':
        return {
          categoria: 'Módulo 5.15 • Segurança da Informação & Auditoria',
          titulo: 'Monitoramento de Acessos, Alertas & Trilha de Auditoria',
          descricao:
            'Rastreabilidade imutável de alterações em tabelas críticas, logs RBAC e investigação de anomalias.',
          csv: auditoriaLogs,
          botaoNovo: undefined,
          acaoNovo: undefined,
        };
      case 'lgpd':
        return {
          categoria: 'Módulo 5.16 • Governança & Privacidade de Dados (LGPD)',
          titulo: 'Inventário ROPA (Art. 37), Avisos de Privacidade & Incidentes',
          descricao:
            'Conformidade com a Lei nº 13.709/2018: mapeamento de bases legais, prazos de retenção e incidentes.',
          csv: inventarioLgpd,
          botaoNovo: undefined,
          acaoNovo: undefined,
        };
      default:
        return {
          categoria: 'Módulo 5.8 • Manutenção & SLA Operacional',
          titulo: 'Manutenção Preventiva & Corretiva de Equipamentos Críticos',
          descricao:
            'Ordens de serviço técnicas para preservação da cadeia fria e continuidade da produção.',
          csv: ordensManutencao,
          botaoNovo: 'Nova OS Manutenção',
          acaoNovo: () => setModalNovaOs(true),
        };
    }
  }, [
    tipoModulo,
    lotes,
    pedidosCompra,
    ativosPatrimonio,
    projetos,
    documentosGed,
    auditoriaLogs,
    inventarioLgpd,
    ordensManutencao,
    ingredientes,
  ]);

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria={cabecalho.categoria}
        titulo={cabecalho.titulo}
        descricao={cabecalho.descricao}
        dadosExportacao={cabecalho.csv}
        nomeArquivoCsv={`docegestao_${tipoModulo}.csv`}
        textoBotaoNovo={cabecalho.botaoNovo}
        onNovoRegistro={cabecalho.acaoNovo}
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* ==================== 1. ESTOQUE & FEFO (COMPLETO E VALORADO) ==================== */}
      {tipoModulo === 'estoque' && (() => {
        const valorTotalEstoque = lotes.reduce(
          (acc, l) => acc + Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0),
          0
        );
        const valorLiberado = lotes
          .filter((l) => l.status === 'liberado')
          .reduce(
            (acc, l) => acc + Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0),
            0
          );
        const valorBloqueado = lotes
          .filter((l) => l.status !== 'liberado')
          .reduce(
            (acc, l) => acc + Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0),
            0
          );

        const lotesLiberadosCount = lotes.filter((l) => l.status === 'liberado').length;
        const lotesBloqueadosCount = lotes.filter((l) => l.status !== 'liberado').length;

        const lotesFiltrados = lotes.filter((l) => {
          const nomeItem = (l.ingredientes?.nome || l.produtos?.nome || '').toLowerCase();
          const codLote = (l.codigo_lote || '').toLowerCase();
          const bateTexto =
            !buscaEstoque.trim() ||
            nomeItem.includes(buscaEstoque.toLowerCase()) ||
            codLote.includes(buscaEstoque.toLowerCase());
          const bateStatus =
            filtroStatusEstoque === 'todos' ||
            (filtroStatusEstoque === 'liberado' && l.status === 'liberado') ||
            (filtroStatusEstoque === 'bloqueado' && l.status !== 'liberado');
          return bateTexto && bateStatus;
        });

        // Dados para gráfico de valoração por lote
        const dadosGraficoEstoque = lotes
          .map((l) => ({
            nome: l.ingredientes?.nome || l.produtos?.nome || l.codigo_lote,
            lote: l.codigo_lote,
            valor: Number(
              (Number(l.quantidade_atual || 0) * Number(l.custo_unitario || 0)).toFixed(2)
            ),
            liberado: l.status === 'liberado',
          }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 8);

        return (
          <div className="space-y-6">
            {/* 4 KPIs Detalhados de Valoração & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <div className="flex items-center justify-between text-xs text-[#7F7269]">
                  <span>Valor Total do Estoque</span>
                  <DollarSign className="w-4 h-4 text-[#701D2B]" />
                </div>
                <p className="text-2xl font-bold text-[#701D2B] mt-1">
                  R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-[#7F7269] mt-1">
                  {lotes.length} lote(s) ativo(s) no almoxarifado
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Capital Liberado para Produção</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  R$ {valorLiberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {lotesLiberadosCount} lote(s) aprovado(s) pela Qualidade
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Retido / Quarentena BPF</span>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  R$ {valorBloqueado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  {lotesBloqueadosCount} lote(s) aguardando liberação
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Movimentações Kardex</span>
                <p className="text-2xl font-bold text-[#542C20] mt-1">
                  {movimentacoesEstoque.length}
                </p>
                <p className="text-[11px] text-[#7F7269] mt-1">
                  Entradas, baixas FEFO e inventários
                </p>
              </div>
            </div>

            {/* Gráfico de Composição Financeira do Estoque */}
            {dadosGraficoEstoque.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC]">
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Distribuição Financeira por Lote / Insumo (R$)
                </h3>
                <p className="text-xs text-[#7F7269] mb-4">
                  Verde: capital liberado para uso • Âmbar: capital bloqueado em quarentena sanitária.
                </p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGraficoEstoque}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D8" />
                      <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#542C20' }} />
                      <YAxis
                        tickFormatter={(v) => `R$ ${v}`}
                        tick={{ fontSize: 10, fill: '#7F7269' }}
                      />
                      <Tooltip
                        formatter={(val: any) =>
                          `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                      />
                      <Bar dataKey="valor" name="Valor em Estoque" radius={[6, 6, 0, 0]}>
                        {dadosGraficoEstoque.map((item, idx) => (
                          <Cell key={idx} fill={item.liberado ? '#15803d' : '#d97706'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Barra de Pesquisa, Filtros e Tabela Detalhada FEFO */}
            <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
              <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40 flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#701D2B]" />
                  Posição Analítica de Lotes FEFO (Validade, Custos & Baixas)
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#7F7269] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={buscaEstoque}
                      onChange={(e) => setBuscaEstoque(e.target.value)}
                      placeholder="Buscar insumo ou lote..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E8D4BC] bg-white"
                    />
                  </div>

                  <select
                    value={filtroStatusEstoque}
                    onChange={(e) => setFiltroStatusEstoque(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="liberado">Somente Liberados</option>
                    <option value="bloqueado">Somente Bloqueados</option>
                  </select>

                  {podeEditar() && (
                    <button
                      onClick={abrirModalNovoLote}
                      className="px-3.5 py-1.5 rounded-lg bg-[#701D2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#C69A55]" />
                      Inserir Novo Lote
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                      <th className="py-3 px-4">Lote</th>
                      <th className="py-3 px-3">Insumo / Produto</th>
                      <th className="py-3 px-3">Validade & Prazo FEFO</th>
                      <th className="py-3 px-3">Saldo Físico</th>
                      <th className="py-3 px-3">Custo Unit.</th>
                      <th className="py-3 px-3">Valor Total Lote</th>
                      <th className="py-3 px-3">Situação</th>
                      <th className="py-3 px-4 text-right">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5E8D8]">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#7F7269]">
                          Carregando posição de lotes FEFO...
                        </td>
                      </tr>
                    ) : lotesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#7F7269]">
                          Nenhum lote encontrado para o filtro aplicado.
                        </td>
                      </tr>
                    ) : (
                      lotesFiltrados.map((l) => {
                        const pct =
                          Number(l.quantidade_inicial) > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (Number(l.quantidade_atual) / Number(l.quantidade_inicial)) * 100
                                )
                              )
                            : 0;
                        const custoUnit = Number(l.custo_unitario || 0);
                        const valorLote = Number(l.quantidade_atual || 0) * custoUnit;

                        // Cálculo de dias para vencimento
                        const diasVencimento = l.data_validade
                          ? Math.ceil(
                              (new Date(l.data_validade + 'T12:00:00').getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : 999;

                        return (
                          <tr key={l.id} className="hover:bg-[#FBF5EE]">
                            <td className="py-3 px-4 font-bold text-[#701D2B]">{l.codigo_lote}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[#542C20]">
                                {l.ingredientes?.nome || l.produtos?.nome || 'Insumo Cadastrado'}
                              </div>
                              <div className="text-[11px] text-[#7F7269]">
                                Cód: {l.ingredientes?.codigo || l.produtos?.codigo_sku || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold">
                                {l.data_validade?.split('-').reverse().join('/')}
                              </div>
                              <span
                                className={`text-[10px] font-bold ${
                                  diasVencimento <= 15
                                    ? 'text-red-700'
                                    : diasVencimento <= 30
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {diasVencimento < 0
                                  ? `Vencido há ${Math.abs(diasVencimento)}d`
                                  : `Vence em ${diasVencimento} dia(s)`}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold">
                                {Number(l.quantidade_atual).toLocaleString('pt-BR')} /{' '}
                                {Number(l.quantidade_inicial).toLocaleString('pt-BR')} g/un
                              </div>
                              <div className="w-24 h-1.5 bg-[#F5E8D8] rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-[#701D2B]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#7F7269]">R$ {custoUnit.toFixed(4)}</td>
                            <td className="py-3 px-3 font-bold text-[#542C20]">
                              R$ {valorLote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  l.status === 'liberado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5">
                              {podeEditar() &&
                                l.status === 'liberado' &&
                                Number(l.quantidade_atual) > 0 && (
                                  <button
                                    onClick={() => abrirModalBaixa(l)}
                                    className="px-2.5 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                  >
                                    <ArrowDownCircle className="w-3 h-3 text-[#C69A55]" /> Dar Baixa
                                  </button>
                                )}
                              {podeEditar() && (
                                <button
                                  onClick={() => abrirAjusteLote(l)}
                                  className="px-2.5 py-1 rounded-lg border border-[#E8D4BC] bg-white hover:bg-[#F5E8D8] text-[#542C20] text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <SlidersHorizontal className="w-3 h-3" /> Ajustar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kardex de Movimentações */}
            <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
              <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Kardex — Histórico de Entradas, Baixas FEFO & Inventários
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-3">Lote</th>
                      <th className="py-3 px-3">Tipo Movimentação</th>
                      <th className="py-3 px-3">Quantidade</th>
                      <th className="py-3 px-3">Valor Movimentado</th>
                      <th className="py-3 px-3">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5E8D8]">
                    {movimentacoesEstoque.map((m) => {
                      const valMov = Number(m.quantidade || 0) * Number(m.custo_unitario || 0);
                      return (
                        <tr key={m.id}>
                          <td className="py-2.5 px-4 text-[#7F7269]">
                            {new Date(m.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#701D2B]">
                            {m.estoque_lotes?.codigo_lote || '-'}
                          </td>
                          <td className="py-2.5 px-3 uppercase font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                m.tipo_movimentacao.startsWith('entrada')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.tipo_movimentacao.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {Number(m.quantidade).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#542C20]">
                            R$ {valMov.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-[#7F7269]">{m.observacao || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 2. COMPRAS & FORNECEDORES ==================== */}
      {tipoModulo === 'compras' && (() => {
        const valorComprasTotal = pedidosCompra.reduce(
          (acc, p) => acc + Number(p.valor_total || 0),
          0
        );
        const pendentesAprovacao = pedidosCompra.filter(
          (p) => p.status === 'aguardando_aprovacao'
        ).length;
        const notaMediaForn =
          fornecedores.length > 0
            ? fornecedores.reduce((acc, f) => acc + Number(f.nota_avaliacao || 0), 0) /
              fornecedores.length
            : 4.8;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Fornecedores Homologados</span>
                <p className="text-2xl font-bold text-[#542C20] mt-1">{fornecedores.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Volume em Pedidos de Compra</span>
                <p className="text-2xl font-bold text-[#701D2B] mt-1">
                  R$ {valorComprasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Aguardando Aprovação</span>
                <p className="text-2xl font-bold text-amber-700 mt-1">{pendentesAprovacao}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
                <span className="text-xs text-[#7F7269]">Score Médio SLA Fornecedores</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {notaMediaForn.toFixed(1)} / 5,0
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
              <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
                <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#701D2B]" />
                  Ordens de Compra & Fluxo de Recebimento
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                      <th className="py-3 px-4">Pedido</th>
                      <th className="py-3 px-3">Fornecedor</th>
                      <th className="py-3 px-3">Emissão</th>
                      <th className="py-3 px-3">Previsão Entrega</th>
                      <th className="py-3 px-3">Condição</th>
                      <th className="py-3 px-3">Valor Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5E8D8]">
                    {pedidosCompra.map((pc) => (
                      <tr key={pc.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4 font-bold text-[#701D2B]">{pc.codigo}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#542C20]">
                            {pc.fornecedores?.nome_fantasia || 'Fornecedor Homologado'}
                          </div>
                          <div className="text-[11px] text-[#7F7269]">{pc.observacoes}</div>
                        </td>
                        <td className="py-3 px-3">
                          {pc.data_emissao?.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-3">
                          {pc.data_previsao_entrega?.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-3">{pc.condicao_pagamento || '-'}</td>
                        <td className="py-3 px-3 font-bold">
                          R$ {Number(pc.valor_total).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              pc.status === 'recebido_total'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pc.status === 'aprovado'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pc.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {podeEditar() && pc.status === 'aguardando_aprovacao' && (
                            <button
                              onClick={() => avancarStatusPedidoCompra(pc.id, 'aprovado')}
                              disabled={salvando}
                              className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold"
                            >
                              Aprovar
                            </button>
                          )}
                          {podeEditar() && pc.status === 'aprovado' && (
                            <button
                              onClick={() => avancarStatusPedidoCompra(pc.id, 'recebido_total')}
                              disabled={salvando}
                              className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold"
                            >
                              Confirmar Recebimento
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
                  Cadastro & Qualificação de Fornecedores Homologados
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-3">Fornecedor / CNPJ (Demo)</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3">Lead Time</th>
                      <th className="py-3 px-3">Pagamento</th>
                      <th className="py-3 px-3">Avaliação SLA</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5E8D8]">
                    {fornecedores.map((f) => (
                      <tr key={f.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4 font-bold text-[#701D2B]">{f.codigo}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#542C20]">{f.nome_fantasia}</div>
                          <div className="text-[11px] text-[#7F7269]">
                            {f.cnpj_ficticio} • {f.cidade}/{f.uf}
                          </div>
                        </td>
                        <td className="py-3 px-3">{f.categoria_fornecimento}</td>
                        <td className="py-3 px-3 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C69A55]" /> {f.prazo_entrega_dias}{' '}
                          dia(s)
                        </td>
                        <td className="py-3 px-3">{f.condicao_pagamento}</td>
                        <td className="py-3 px-3 font-bold text-amber-700">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {Number(f.nota_avaliacao).toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase font-bold text-emerald-700">
                          {f.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 3. PATRIMÔNIO (QR CODE) ==================== */}
      {tipoModulo === 'patrimonio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Ativos Tombados (QR)</span>
              <p className="text-2xl font-bold text-[#701D2B] mt-1">{ativosPatrimonio.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Valor Original de Aquisição</span>
              <p className="text-2xl font-bold text-[#542C20] mt-1">
                R${' '}
                {ativosPatrimonio
                  .reduce((acc, a) => acc + Number(a.valor_aquisicao || 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Valor Contábil Líquido Atual</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                R${' '}
                {ativosPatrimonio
                  .reduce((acc, a) => acc + Number(a.valor_contabil_liquido || 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Inventário de Bens Imobilizados & Depreciação Linear
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                    <th className="py-3 px-4">Patrimônio</th>
                    <th className="py-3 px-3">Bem / Setor</th>
                    <th className="py-3 px-3">Aquisição</th>
                    <th className="py-3 px-3">Deprec. Acumulada</th>
                    <th className="py-3 px-3">Valor Contábil</th>
                    <th className="py-3 px-4 text-right">Etiqueta QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8]">
                  {ativosPatrimonio.map((at) => (
                    <tr key={at.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">
                        {at.codigo_patrimonio}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#542C20]">{at.nome}</div>
                        <div className="text-[11px] text-[#7F7269]">{at.localizacao_setor}</div>
                      </td>
                      <td className="py-3 px-3">
                        R$ {Number(at.valor_aquisicao || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-amber-700">
                        -R$ {Number(at.depreciacao_acumulada || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        R$ {Number(at.valor_contabil_liquido || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setQrSelecionado(at)}
                          className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#C69A55]" /> Ver QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {movPatrimonio.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
              <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Movimentações Patrimoniais (Alçada Diretoria)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                      <th className="py-3 px-4">Ativo</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Origem → Destino</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Aprovação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5E8D8]">
                    {movPatrimonio.map((mv) => (
                      <tr key={mv.id}>
                        <td className="py-3 px-4 font-bold text-[#701D2B]">
                          {mv.ativos_patrimoniais?.codigo_patrimonio} —{' '}
                          {mv.ativos_patrimoniais?.nome}
                        </td>
                        <td className="py-3 px-3 uppercase">{mv.tipo}</td>
                        <td className="py-3 px-3">
                          {mv.origem} → <strong>{mv.destino}</strong>
                        </td>
                        <td className="py-3 px-3 uppercase font-semibold">
                          {mv.status_aprovacao}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {podeEditar() && mv.status_aprovacao === 'pendente_diretoria' && (
                            <button
                              onClick={() => aprovarMovimentacaoPatrimonial(mv.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold"
                            >
                              Aprovar Diretoria
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 4. PROJETOS & TAREFAS ==================== */}
      {tipoModulo === 'projetos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projetos.map((proj) => (
              <div
                key={proj.id}
                className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#701D2B] flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-[#C69A55]" /> {proj.codigo}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase text-[10px]">
                    {proj.status}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#542C20]">{proj.nome}</h3>
                <p className="text-[#7F7269]">{proj.descricao}</p>
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-[#542C20]">
                    <span>Progresso Físico</span>
                    <span>{proj.progresso_percentual}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5E8D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#701D2B]"
                      style={{ width: `${proj.progresso_percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Cronograma de Tarefas & Marcos (Kanban)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                    <th className="py-3 px-4">Projeto</th>
                    <th className="py-3 px-3">Tarefa</th>
                    <th className="py-3 px-3">Etapa Kanban</th>
                    <th className="py-3 px-3">Prioridade</th>
                    <th className="py-3 px-3">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8]">
                  {tarefas.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 px-4 font-bold text-[#701D2B]">
                        {t.projetos?.codigo || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#542C20]">{t.titulo}</td>
                      <td className="py-3 px-3 uppercase">{t.coluna_kanban}</td>
                      <td className="py-3 px-3 uppercase font-bold text-amber-700">
                        {t.prioridade}
                      </td>
                      <td className="py-3 px-3">
                        {t.prazo?.split('-').reverse().join('/')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. DOCUMENTOS / GED ==================== */}
      {tipoModulo === 'documentos' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
            <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#701D2B]" />
              Documentos Controlados, Alvarás Sanitários & Contratos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase text-[#542C20]">
                  <th className="py-3 px-4">Código GED</th>
                  <th className="py-3 px-3">Título do Documento</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3">Sigilo</th>
                  <th className="py-3 px-3">Validade</th>
                  <th className="py-3 px-3">Assinatura Digital</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8]">
                {documentosGed.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#FBF5EE]">
                    <td className="py-3 px-4 font-bold text-[#701D2B]">{doc.codigo}</td>
                    <td className="py-3 px-3 font-semibold text-[#542C20]">{doc.titulo}</td>
                    <td className="py-3 px-3 uppercase">{doc.categoria}</td>
                    <td className="py-3 px-3 uppercase font-semibold text-[#C69A55]">
                      {doc.nivel_sigilo}
                    </td>
                    <td className="py-3 px-3">
                      {doc.data_validade
                        ? doc.data_validade.split('-').reverse().join('/')
                        : 'Indeterminada'}
                    </td>
                    <td className="py-3 px-3">
                      {doc.assinado_eletronicamente ? (
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
                        </span>
                      ) : (
                        'Pendente'
                      )}
                    </td>
                    <td className="py-3 px-3 uppercase font-bold">{doc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 6. SEGURANÇA & AUDITORIA ==================== */}
      {tipoModulo === 'seguranca' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Alertas de Segurança</span>
              <p className="text-2xl font-bold text-[#701D2B] mt-1">{alertasSeguranca.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Eventos de Autenticação RBAC</span>
              <p className="text-2xl font-bold text-[#542C20] mt-1">{acessosLogs.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
              <span className="text-xs text-[#7F7269]">Registros na Trilha de Auditoria</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{auditoriaLogs.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-[#701D2B]" />
                Logs de Acesso & Sessões (RBAC)
              </h3>
              <div className="divide-y divide-[#F5E8D8]">
                {acessosLogs.map((ac) => (
                  <div key={ac.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#542C20]">{ac.evento}</span>
                      <p className="text-[#7F7269]">
                        {ac.email_tentativa || 'Sessão autenticada'} • IP: {ac.ip_simulado}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#7F7269]">
                      {new Date(ac.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20]">
                Trilha de Auditoria de Dados (Triggers PostgreSQL)
              </h3>
              <div className="divide-y divide-[#F5E8D8]">
                {auditoriaLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#701D2B]">{log.tabela_nome}</span>
                      <p className="text-[#7F7269]">Operação: {log.operacao}</p>
                    </div>
                    <span className="text-[11px] text-[#7F7269]">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 7. LGPD & PRIVACIDADE ==================== */}
      {tipoModulo === 'lgpd' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#701D2B]" />
                Inventário de Operações de Tratamento (ROPA — Art. 37)
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

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Avisos de Privacidade Vigentes
                </h3>
                {avisosLgpd.map((av) => (
                  <div
                    key={av.id}
                    className="p-3.5 rounded-xl border border-[#E8D4BC] bg-white space-y-1"
                  >
                    <div className="flex justify-between">
                      <strong className="text-[#542C20]">{av.titulo}</strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {av.versao} • Vigente
                      </span>
                    </div>
                    <p className="text-[#7F7269]">{av.conteudo}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2 text-xs">
                <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Registro de Incidentes de Privacidade ({incidentesLgpd.length})
                </h3>
                {incidentesLgpd.length === 0 ? (
                  <p className="text-emerald-700 font-semibold">
                    Zero incidentes de vazamento de dados registrados.
                  </p>
                ) : (
                  incidentesLgpd.map((inc) => (
                    <div key={inc.id} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <strong>{inc.codigo}:</strong> {inc.descricao} ({inc.status})
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 8. MANUTENÇÃO & SLA ==================== */}
      {tipoModulo === 'manutencao' && (
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
                      Nenhuma OS aberta no momento. Clique em &ldquo;Nova OS Manutenção&rdquo; para
                      registrar.
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

      {/* MODAL 1: INSERIR NOVO LOTE NO ESTOQUE */}
      {modalNovoLote && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Inserir Novo Lote no Estoque</h3>
              <button onClick={() => setModalNovoLote(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoLote} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Insumo / Matéria-Prima *</label>
                <select
                  value={formIngredienteId}
                  onChange={(e) => {
                    setFormIngredienteId(e.target.value);
                    const ing = ingredientes.find((i) => i.id === e.target.value);
                    if (ing) setFormCustoUnitLote(Number(ing.custo_medio || 0.08));
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {ingredientes.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.codigo} — {ing.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#542C20]">Código do Lote *</label>
                  <input
                    type="text"
                    required
                    value={formCodigoLote}
                    onChange={(e) => setFormCodigoLote(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#542C20]">Data de Validade (FEFO) *</label>
                  <input
                    type="date"
                    required
                    value={formValidadeLote}
                    onChange={(e) => setFormValidadeLote(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#542C20]">Quantidade de Entrada (g/un) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formQtdEntrada}
                    onChange={(e) => setFormQtdEntrada(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#542C20]">Custo Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formCustoUnitLote}
                    onChange={(e) => setFormCustoUnitLote(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC] flex justify-between font-bold text-[#542C20]">
                <span>Valor Total desta Entrada:</span>
                <span className="text-[#701D2B]">
                  R${' '}
                  {(Number(formQtdEntrada || 0) * Number(formCustoUnitLote || 0)).toLocaleString(
                    'pt-BR',
                    { minimumFractionDigits: 2 }
                  )}
                </span>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Nota Fiscal / Observação</label>
                <input
                  type="text"
                  value={formObsEntrada}
                  onChange={(e) => setFormObsEntrada(e.target.value)}
                  placeholder="Ex: Recebimento NF 4581 — Lote inspecionado"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoLote(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Registrar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DAR BAIXA NO LOTE */}
      {modalBaixaLote && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                Dar Baixa FEFO • {modalBaixaLote.codigo_lote}
              </h3>
              <button onClick={() => setModalBaixaLote(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={confirmarBaixaLote} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                <p className="font-bold text-[#542C20]">
                  {modalBaixaLote.ingredientes?.nome || modalBaixaLote.produtos?.nome}
                </p>
                <p className="text-[#7F7269] mt-0.5">
                  Saldo disponível neste lote:{' '}
                  <strong>
                    {Number(modalBaixaLote.quantidade_atual).toLocaleString('pt-BR')} g/un
                  </strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Motivo da Baixa *</label>
                <select
                  value={formTipoBaixa}
                  onChange={(e) => setFormTipoBaixa(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  <option value="saida_producao">Saída para Produção (Confeitaria / PCP)</option>
                  <option value="saida_venda">Saída por Venda Direta / Balcão</option>
                  <option value="perda">Perda / Descarte Sanitário</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Quantidade a Baixar *</label>
                <input
                  type="number"
                  step="0.01"
                  max={Number(modalBaixaLote.quantidade_atual)}
                  required
                  value={formQtdBaixa}
                  onChange={(e) => setFormQtdBaixa(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Observação / Ordem de Produção</label>
                <input
                  type="text"
                  value={formObsBaixa}
                  onChange={(e) => setFormObsBaixa(e.target.value)}
                  placeholder="Ex: Requisição para OP-2026-004 (Ganache)"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBaixaLote(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Processando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AJUSTE DE INVENTÁRIO */}
      {modalAjusteLote && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                Ajuste de Inventário • {modalAjusteLote.codigo_lote}
              </h3>
              <button onClick={() => setModalAjusteLote(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarAjusteInventario} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Nova Quantidade Contada *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formQtdAjuste}
                  onChange={(e) => setFormQtdAjuste(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div>
                <label className="font-bold text-[#542C20]">Justificativa / Motivo *</label>
                <input
                  type="text"
                  required
                  value={formMotivoAjuste}
                  onChange={(e) => setFormMotivoAjuste(e.target.value)}
                  placeholder="Ex: Conferência física mensal de almoxarifado"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAjusteLote(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PEDIDO DE COMPRA */}
      {modalNovoPc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Emitir Pedido de Compra</h3>
              <button onClick={() => setModalNovoPc(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={criarPedidoCompra} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Fornecedor Homologado *</label>
                <select
                  value={formFornId}
                  onChange={(e) => setFormFornId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.codigo} — {f.nome_fantasia} ({f.categoria_fornecimento})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#542C20]">Valor Total do Pedido (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formValorPc}
                  onChange={(e) => setFormValorPc(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div>
                <label className="font-bold text-[#542C20]">Descrição dos Insumos *</label>
                <textarea
                  required
                  rows={3}
                  value={formObsPc}
                  onChange={(e) => setFormObsPc(e.target.value)}
                  placeholder="Ex: Reposição de Manteiga Extra sem sal e Creme de Leite Fresco 35%..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPc(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  Emitir Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ETIQUETA QR CODE DO PATRIMÔNIO */}
      {qrSelecionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden text-center">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Etiqueta Patrimonial QR</h3>
              <button onClick={() => setQrSelecionado(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-[#701D2B] bg-[#FBF5EE] flex flex-col items-center justify-center">
                <QrCode className="w-16 h-16 text-[#701D2B]" />
                <span className="text-[10px] font-mono font-bold text-[#542C20] mt-1">
                  {qrSelecionado.codigo_patrimonio}
                </span>
              </div>
              <p className="font-bold text-sm text-[#542C20]">{qrSelecionado.nome}</p>
              <p className="text-[#7F7269]">Setor: {qrSelecionado.localizacao_setor}</p>
              <p className="font-mono text-[10px] bg-[#F5E8D8] p-2 rounded text-[#542C20] break-all">
                Hash: {qrSelecionado.qr_code_hash}
              </p>
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