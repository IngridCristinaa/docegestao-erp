import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package,
  Truck,
  Wallet,
  Receipt,
  Wrench,
  ShieldAlert,
  QrCode,
  FolderKanban,
  FileCheck2,
  LockKeyhole,
  Scale,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
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

  // Suprimentos & Estoque
  const [pedidosCompra, setPedidosCompra] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);

  // Financeiro & Fiscal
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  const [pedidosVenda, setPedidosVenda] = useState<any[]>([]);

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

  // Classificação exata do módulo pela rota
  const tipoModulo = useMemo(() => {
    const slug = modulo.toLowerCase();
    if (slug.includes('patrimon')) return 'patrimonio';
    if (slug.includes('projet')) return 'projetos';
    if (slug.includes('document') || slug.includes('ged')) return 'documentos';
    if (slug.includes('seguranc') || slug.includes('audit')) return 'seguranca';
    if (slug.includes('lgpd') || slug.includes('privacid')) return 'lgpd';
    if (slug.includes('manutenc')) return 'manutencao';
    if (slug.includes('financ') || slug.includes('dre') || slug.includes('fiscal'))
      return 'financeiro';
    return 'suprimentos';
  }, [modulo]);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      if (tipoModulo === 'suprimentos') {
        const [resPc, resLotes] = await Promise.all([
          supabase
            .from('pedidos_compra')
            .select('*, fornecedores(nome_fantasia)')
            .order('data_emissao', { ascending: false }),
          supabase
            .from('estoque_lotes')
            .select('*, ingredientes(codigo, nome), produtos(codigo_sku, nome)')
            .order('data_validade', { ascending: true }),
        ]);
        setPedidosCompra(resPc.data || []);
        setLotes(resLotes.data || []);
      } else if (tipoModulo === 'financeiro') {
        const [resBancos, resPed] = await Promise.all([
          supabase.from('contas_bancarias').select('*').eq('ativo', true),
          supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(50),
        ]);
        setContasBancarias(resBancos.data || []);
        setPedidosVenda(resPed.data || []);
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
          supabase.from('tarefas').select('*, projetos(codigo, nome)').order('prazo', { ascending: true }),
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
          supabase.from('lgpd_avisos_privacidade').select('*').order('publicado_em', { ascending: false }),
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
      case 'patrimonio':
        return {
          categoria: 'Módulo 5.7 • Patrimônio & Ativos Imobilizados (QR Code)',
          titulo: 'Tombamento, Etiquetas QR & Depreciação Contábil',
          descricao:
            'Controle individual de fornos, batedeiras, câmaras frias e mobiliário com cálculo de depreciação linear e aprovação de movimentações.',
          csv: ativosPatrimonio,
        };
      case 'projetos':
        return {
          categoria: 'Módulo 5.13 • Projetos & Iniciativas Estratégicas',
          titulo: 'Portfólio de Projetos, Cronogramas & Entregáveis',
          descricao:
            'Acompanhamento de expansão de unidades, lançamentos sazonais de confeitaria e implantação de melhorias contínuas.',
          csv: projetos,
        };
      case 'documentos':
        return {
          categoria: 'Módulo 5.14 • Gestão Eletrônica de Documentos (GED)',
          titulo: 'Repositório Institucional, Alvarás Sanitários & Contratos',
          descricao:
            'Controle de versionamento, vigência documental, níveis de sigilo e assinatura eletrônica de alvarás ANVISA/Vigilância e contratos.',
          csv: documentosGed,
        };
      case 'seguranca':
        return {
          categoria: 'Módulo 5.15 • Segurança da Informação & Auditoria',
          titulo: 'Monitoramento de Acessos, Alertas & Trilha de Auditoria',
          descricao:
            'Rastreabilidade imutável de alterações em tabelas críticas, logs de autenticação RBAC e investigação de anomalias.',
          csv: auditoriaLogs,
        };
      case 'lgpd':
        return {
          categoria: 'Módulo 5.16 • Governança & Privacidade de Dados (LGPD)',
          titulo: 'Inventário ROPA (Art. 37), Avisos de Privacidade & Incidentes',
          descricao:
            'Conformidade com a Lei nº 13.709/2018: mapeamento de bases legais, prazos de retenção e gestão de incidentes.',
          csv: inventarioLgpd,
        };
      case 'manutencao':
        return {
          categoria: 'Módulo 5.8 • Manutenção & SLA Operacional',
          titulo: 'Manutenção Preventiva & Corretiva de Equipamentos Críticos',
          descricao:
            'Ordens de serviço técnicas para preservação da cadeia fria, calibração de termostatos e continuidade da produção.',
          csv: ordensManutencao,
        };
      case 'financeiro':
        return {
          categoria: 'Módulo 5.10 & 5.11 • Financeiro, DRE & Fiscal Simulado',
          titulo: 'Disponibilidades Bancárias, DRE Gerencial & Carga Tributária',
          descricao:
            'Consolidação de saldos em conta corrente/cofre, margem operacional e simulação tributária.',
          csv: contasBancarias,
        };
      default:
        return {
          categoria: 'Módulo 5.5 & 5.6 • Suprimentos, Compras & Estoque FEFO',
          titulo: 'Fornecedores Homologados, Pedidos de Compra & Lotes FEFO',
          descricao:
            'Gestão de compras, aprovação de pedidos e rastreamento de lotes por validade (FEFO).',
          csv: lotes,
        };
    }
  }, [
    tipoModulo,
    ativosPatrimonio,
    projetos,
    documentosGed,
    auditoriaLogs,
    inventarioLgpd,
    ordensManutencao,
    contasBancarias,
    lotes,
  ]);

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria={cabecalho.categoria}
        titulo={cabecalho.titulo}
        descricao={cabecalho.descricao}
        dadosExportacao={cabecalho.csv}
        nomeArquivoCsv={`docegestao_${tipoModulo}.csv`}
        textoBotaoNovo={tipoModulo === 'manutencao' ? 'Nova OS Manutenção' : undefined}
        onNovoRegistro={tipoModulo === 'manutencao' ? () => setModalNovaOs(true) : undefined}
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* ==================== 1. PATRIMÔNIO (QR CODE) ==================== */}
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

      {/* ==================== 2. PROJETOS & TAREFAS ==================== */}
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

      {/* ==================== 3. DOCUMENTOS / GED ==================== */}
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

      {/* ==================== 4. SEGURANÇA & AUDITORIA ==================== */}
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

      {/* ==================== 5. LGPD & PRIVACIDADE ==================== */}
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

      {/* ==================== 6. SUPRIMENTOS & ESTOQUE FEFO ==================== */}
      {tipoModulo === 'suprimentos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 border-b border-[#E8D4BC] bg-[#F5E8D8]/40">
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#701D2B]" />
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
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#701D2B]" />
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

      {/* ==================== 7. FINANCEIRO, DRE & FISCAL ==================== */}
      {tipoModulo === 'financeiro' && (() => {
        const receitaTotal = pedidosVenda
          .filter((p) => p.status !== 'cancelado')
          .reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#701D2B]" />
                DRE Gerencial & Simulação Tributária
              </h3>
              <div className="divide-y divide-[#F5E8D8]">
                <div className="py-2.5 flex justify-between">
                  <span>(+) Receita Bruta de Vendas (Salão, Delivery & Eventos)</span>
                  <strong className="text-emerald-700 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> R$ {receitaTotal.toFixed(2)}
                  </strong>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>(-) Deduções & Simples Nacional Simulado (6,0%)</span>
                  <strong className="text-red-700 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> R$ {(receitaTotal * 0.06).toFixed(2)}
                  </strong>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>(-) Custo de Mercadoria Vendida (CMV Estimado 28%)</span>
                  <strong className="text-red-700">R$ {(receitaTotal * 0.28).toFixed(2)}</strong>
                </div>
                <div className="py-3 flex justify-between text-sm font-bold text-[#701D2B] bg-[#FBF5EE] px-3 rounded-lg mt-2">
                  <span>(=) Margem de Contribuição Operacional</span>
                  <span>R$ {(receitaTotal * 0.66).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3 text-xs">
              <h3 className="font-serif text-lg font-bold text-[#542C20] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-700" />
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
        );
      })()}

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