import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  ShieldCheck,
  AlertTriangle,
  ThermometerSnowflake,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  GitBranch,
  Plus,
  X,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface PopQualidade {
  id: string;
  codigo: string;
  titulo: string;
  area: string;
  versao: string;
  conteudo_resumo: string;
  vigente: boolean;
}

interface ChecklistModelo {
  id: string;
  codigo: string;
  nome: string;
  etapa_processo: string;
  itens_verificacao_json: { item: string }[];
}

interface EstoqueLote {
  id: string;
  unidade_id: string;
  codigo_lote: string;
  data_fabricacao: string;
  data_validade: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  status: 'liberado' | 'quarentena' | 'bloqueado' | 'vencido' | 'esgotado';
  ingredientes?: { codigo: string; nome: string } | { codigo: string; nome: string }[] | null;
  produtos?: { codigo_sku: string; nome: string } | { codigo_sku: string; nome: string }[] | null;
}

interface InspecaoQualidade {
  id: string;
  codigo: string;
  checklist_id: string;
  lote_id: string | null;
  ordem_producao_id: string | null;
  data_inspecao: string;
  resultado: 'aprovado' | 'aprovado_ressalva' | 'reprovado';
  observacoes: string | null;
  liberado_por: string | null;
  data_liberacao: string | null;
  checklists_modelos?: { codigo: string; nome: string; etapa_processo: string } | any;
  estoque_lotes?: { codigo_lote: string; status: string } | any;
}

interface NaoConformidade {
  id: string;
  codigo: string;
  lote_id: string | null;
  gravidade: 'menor' | 'maior' | 'critica';
  descricao: string;
  lote_bloqueado: boolean;
  status: 'aberta' | 'em_tratativa' | 'encerrada';
  created_at: string;
  estoque_lotes?: { codigo_lote: string; status: string } | any;
}

interface RegistroTemperatura {
  id: string;
  temperatura_aferida_c: number;
  dentro_faixa: boolean;
  data_hora: string;
  observacao: string | null;
}

const extrairItem = <T,>(valor: T | T[] | null | undefined): T | undefined => {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
};

export const QualidadeBpfPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<
    'inspecoes' | 'temperatura' | 'nao_conformidades' | 'pops' | 'rastreabilidade'
  >('inspecoes');

  const [pops, setPops] = useState<PopQualidade[]>([]);
  const [checklists, setChecklists] = useState<ChecklistModelo[]>([]);
  const [lotes, setLotes] = useState<EstoqueLote[]>([]);
  const [inspecoes, setInspecoes] = useState<InspecaoQualidade[]>([]);
  const [naoConformidades, setNaoConformidades] = useState<NaoConformidade[]>([]);
  const [temperaturas, setTemperaturas] = useState<RegistroTemperatura[]>([]);
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Modais
  const [modalNovaInspecao, setModalNovaInspecao] = useState(false);
  const [modalNovaTemp, setModalNovaTemp] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form Nova Inspeção
  const [formChecklistId, setFormChecklistId] = useState('');
  const [formLoteId, setFormLoteId] = useState('');
  const [formResultado, setFormResultado] = useState<
    'aprovado' | 'aprovado_ressalva' | 'reprovado'
  >('aprovado');
  const [formObsInspecao, setFormObsInspecao] = useState('');

  // Form Nova Temperatura
  const [formTempValor, setFormTempValor] = useState<number>(3.2);
  const [formTempObs, setFormTempObs] = useState(
    'Aferição de rotina câmara fria principal (faixa 0°C a 5°C).'
  );

  // Rastreabilidade Reversa
  const [buscaLoteRastreio, setBuscaLoteRastreio] = useState('');

  const carregarTudo = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resPops, resChk, resLotes, resInsp, resNc, resTemp, resFunc] = await Promise.all([
        supabase.from('pops_qualidade').select('*').order('codigo', { ascending: true }),
        supabase.from('checklists_modelos').select('*').eq('ativo', true),
        supabase
          .from('estoque_lotes')
          .select('*, ingredientes(codigo, nome), produtos(codigo_sku, nome)')
          .order('created_at', { ascending: false }),
        supabase
          .from('inspecoes_qualidade')
          .select(
            '*, checklists_modelos(codigo, nome, etapa_processo), estoque_lotes(codigo_lote, status)'
          )
          .order('data_inspecao', { ascending: false }),
        supabase
          .from('nao_conformidades')
          .select('*, estoque_lotes(codigo_lote, status)')
          .order('created_at', { ascending: false }),
        supabase
          .from('registros_temperatura')
          .select('*')
          .order('data_hora', { ascending: true })
          .limit(20),
        supabase.from('funcionarios').select('id').limit(1).maybeSingle(),
      ]);

      if (resPops.error) throw resPops.error;
      if (resLotes.error) throw resLotes.error;
      if (resInsp.error) throw resInsp.error;

      const listaLotes = (resLotes.data as unknown as EstoqueLote[]) || [];
      setPops((resPops.data as PopQualidade[]) || []);
      setChecklists((resChk.data as ChecklistModelo[]) || []);
      setLotes(listaLotes);
      setInspecoes((resInsp.data as unknown as InspecaoQualidade[]) || []);
      setNaoConformidades((resNc.data as unknown as NaoConformidade[]) || []);
      setTemperaturas((resTemp.data as RegistroTemperatura[]) || []);

      if (listaLotes[0]?.unidade_id) setUnidadeId(listaLotes[0].unidade_id);
      if (resFunc.data?.id) setResponsavelId(resFunc.data.id);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados do módulo de Qualidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  // Registrar Nova Inspeção (com bloqueio automático se reprovado)
  const salvarNovaInspecao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChecklistId) return;

    setSalvando(true);
    setErro(null);
    try {
      const codigoInsp = `INSP-2026-${String(Math.floor(100 + Math.random() * 899))}`;
      const unId = unidadeId || '11111111-1111-1111-1111-111111111101';
      const respId = responsavelId || '11111111-1111-1111-1111-111111111102';

      const { data: novaInsp, error: errInsp } = await supabase
        .from('inspecoes_qualidade')
        .insert({
          unidade_id: unId,
          codigo: codigoInsp,
          checklist_id: formChecklistId,
          lote_id: formLoteId || null,
          inspetor_id: respId,
          data_inspecao: new Date().toISOString(),
          respostas_json: { avaliacao_geral: formResultado, observacao: formObsInspecao },
          resultado: formResultado,
          observacoes: formObsInspecao || 'Inspeção registrada conforme protocolo BPF.',
        })
        .select()
        .single();

      if (errInsp) throw errInsp;

      // Regra de negócio 6.7: Desvio / reprovação gera bloqueio automático do lote e abre NC
      if (formResultado === 'reprovado' && formLoteId) {
        await Promise.all([
          supabase
            .from('estoque_lotes')
            .update({ status: 'bloqueado' })
            .eq('id', formLoteId),
          supabase.from('nao_conformidades').insert({
            unidade_id: unId,
            codigo: `NC-2026-${String(Math.floor(100 + Math.random() * 899))}`,
            inspecao_id: novaInsp.id,
            lote_id: formLoteId,
            gravidade: 'critica',
            descricao:
              formObsInspecao ||
              'Lote reprovado durante inspeção de qualidade. Bloqueado automaticamente.',
            lote_bloqueado: true,
            status: 'aberta',
          }),
        ]);
      } else if (formResultado === 'aprovado_ressalva' && formLoteId) {
        await supabase
          .from('estoque_lotes')
          .update({ status: 'quarentena' })
          .eq('id', formLoteId);
      }

      setModalNovaInspecao(false);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar inspeção de qualidade.');
    } finally {
      setSalvando(false);
    }
  };

  // Regra 6.7: Aprovação Humana para Liberação Final de Lote
  const aprovarLiberacaoHumanaLote = async (inspecao: InspecaoQualidade) => {
    if (!inspecao.lote_id) return;
    setSalvando(true);
    try {
      const { data: usuarioSample } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1)
        .maybeSingle();

      await Promise.all([
        supabase
          .from('inspecoes_qualidade')
          .update({
            liberado_por: usuarioSample?.id || null,
            data_liberacao: new Date().toISOString(),
          })
          .eq('id', inspecao.id),
        supabase
          .from('estoque_lotes')
          .update({ status: 'liberado' })
          .eq('id', inspecao.lote_id),
      ]);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao liberar lote.');
    } finally {
      setSalvando(false);
    }
  };

  // Registrar Medição de Temperatura Simulada
  const salvarTemperatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const dentroFaixa = formTempValor >= 0 && formTempValor <= 5;
      const { data: localSample } = await supabase
        .from('locais_armazenamento')
        .select('id')
        .limit(1)
        .maybeSingle();

      const { error: errTemp } = await supabase.from('registros_temperatura').insert({
        unidade_id: unidadeId || '11111111-1111-1111-1111-111111111101',
        local_id: localSample?.id || '11111111-1111-1111-1111-111111111103',
        temperatura_aferida_c: Number(formTempValor),
        dentro_faixa: dentroFaixa,
        responsavel_id: responsavelId || '11111111-1111-1111-1111-111111111102',
        data_hora: new Date().toISOString(),
        observacao: dentroFaixa
          ? formTempObs
          : `ALERTA DE DESVIO (${formTempValor}°C fora da faixa 0°C–5°C): ${formTempObs}`,
      });

      if (errTemp) throw errTemp;

      setModalNovaTemp(false);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar temperatura.');
    } finally {
      setSalvando(false);
    }
  };

  // Encerrar Não Conformidade
  const encerrarNaoConformidade = async (nc: NaoConformidade) => {
    setSalvando(true);
    try {
      await supabase
        .from('nao_conformidades')
        .update({ status: 'encerrada' })
        .eq('id', nc.id);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao encerrar não conformidade.');
    } finally {
      setSalvando(false);
    }
  };

  // Indicadores Dinâmicos
  const indicadores = useMemo(() => {
    const totalLotes = lotes.length;
    const lotesBloqueadosOuQuarentena = lotes.filter((l) =>
      ['bloqueado', 'quarentena', 'vencido'].includes(l.status)
    ).length;
    const ncsAbertas = naoConformidades.filter((n) => n.status !== 'encerrada').length;
    const desviosTemp = temperaturas.filter((t) => !t.dentro_faixa).length;
    const aprovadas = inspecoes.filter((i) => i.resultado === 'aprovado').length;
    const taxaAprovacao =
      inspecoes.length > 0 ? (aprovadas / inspecoes.length) * 100 : 100;

    return {
      totalLotes,
      lotesBloqueadosOuQuarentena,
      ncsAbertas,
      desviosTemp,
      taxaAprovacao,
    };
  }, [lotes, naoConformidades, temperaturas, inspecoes]);

  // Dados Gráfico de Temperatura
  const dadosGraficoTemp = useMemo(
    () =>
      temperaturas.map((t) => {
        const dt = new Date(t.data_hora);
        return {
          horario: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          temperatura: Number(t.temperatura_aferida_c),
          status: t.dentro_faixa ? 'Conforme' : 'Desvio',
        };
      }),
    [temperaturas]
  );

  // Filtro de Rastreabilidade
  const lotesRastreio = useMemo(() => {
    const termo = buscaLoteRastreio.toLowerCase();
    return lotes.filter((l) => {
      const ing = extrairItem(l.ingredientes);
      const prod = extrairItem(l.produtos);
      return (
        !termo ||
        l.codigo_lote.toLowerCase().includes(termo) ||
        (ing?.nome || '').toLowerCase().includes(termo) ||
        (prod?.nome || '').toLowerCase().includes(termo)
      );
    });
  }, [lotes, buscaLoteRastreio]);

  const dadosCsv = useMemo(
    () =>
      inspecoes.map((i) => ({
        Codigo: i.codigo,
        Lote: extrairItem(i.estoque_lotes)?.codigo_lote || '-',
        Etapa: extrairItem(i.checklists_modelos)?.etapa_processo || '-',
        Resultado: i.resultado,
        Liberado: i.data_liberacao ? 'Sim' : 'Pendente Aprovação Humana',
        Data: new Date(i.data_inspecao).toLocaleString('pt-BR'),
      })),
    [inspecoes]
  );

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.9 • Qualidade & Segurança dos Alimentos (BPF)"
        titulo="Controle Sanitário, Cadeia Fria & Rastreabilidade"
        descricao="Inspeção de 100% dos lotes, POPs vigentes, bloqueio automático em desvios críticos, aprovação humana para liberação e rastreabilidade ponta a ponta."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_qualidade_bpf.csv"
        textoBotaoNovo="Nova Inspeção de Lote"
        onNovoRegistro={() => {
          setFormChecklistId(checklists[0]?.id || '');
          setFormLoteId(lotes[0]?.id || '');
          setFormResultado('aprovado');
          setFormObsInspecao('');
          setModalNovaInspecao(true);
        }}
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* KPIs Dinâmicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Taxa de Aprovação (100% Lotes)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {indicadores.taxaAprovacao.toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Base: {inspecoes.length} inspeções auditadas
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Lotes Bloqueados / Quarentena</span>
            <Lock className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">
            {indicadores.lotesBloqueadosOuQuarentena}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Impedidos de consumo ou venda no PDV
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Não Conformidades Abertas</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {indicadores.ncsAbertas}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Com plano de ação corretiva (CAPA)
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Desvios Cadeia Fria (0°C–5°C)</span>
            <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">
            {indicadores.desviosTemp}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Em {temperaturas.length} aferições simuladas
          </p>
        </div>
      </div>

      {/* Navegação por Abas Internas do Módulo */}
      <div className="bg-white p-2 rounded-2xl border border-[#E8D4BC] flex flex-wrap gap-2">
        {[
          { id: 'inspecoes', label: 'Inspeções & Liberação Humana', icon: ShieldCheck },
          { id: 'temperatura', label: 'Temperatura & Cadeia Fria', icon: ThermometerSnowflake },
          { id: 'nao_conformidades', label: 'Não Conformidades & Bloqueios', icon: AlertTriangle },
          { id: 'pops', label: 'POPs & BPF Vigentes', icon: FileText },
          { id: 'rastreabilidade', label: 'Rastreabilidade Ponta a Ponta', icon: GitBranch },
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

      {/* ABA 1: INSPEÇÕES & LIBERAÇÃO HUMANA */}
      {abaAtiva === 'inspecoes' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-3">Lote / Etapa</th>
                  <th className="py-3 px-3">Resultado Técnico</th>
                  <th className="py-3 px-3">Status do Lote</th>
                  <th className="py-3 px-3">Observações</th>
                  <th className="py-3 px-4 text-right">Liberação Final (Humana)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7F7269]">
                      Carregando inspeções...
                    </td>
                  </tr>
                ) : (
                  inspecoes.map((insp) => {
                    const lote = extrairItem(insp.estoque_lotes);
                    const chk = extrairItem(insp.checklists_modelos);
                    const aguardandoLiberacao =
                      insp.resultado === 'aprovado' && !insp.data_liberacao;

                    return (
                      <tr key={insp.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4 font-bold text-[#701D2B]">{insp.codigo}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#542C20]">
                            {lote?.codigo_lote || 'Lote avulso'}
                          </div>
                          <div className="text-[11px] text-[#7F7269] uppercase">
                            Etapa: {chk?.etapa_processo || 'geral'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              insp.resultado === 'aprovado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : insp.resultado === 'aprovado_ressalva'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {insp.resultado === 'aprovado'
                              ? 'Aprovado'
                              : insp.resultado === 'aprovado_ressalva'
                              ? 'Aprovado c/ Ressalva'
                              : 'Reprovado'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              lote?.status === 'liberado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : lote?.status === 'bloqueado'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {lote?.status || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#542C20] max-w-xs truncate">
                          {insp.observacoes}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {insp.data_liberacao ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Liberado ({new Date(insp.data_liberacao).toLocaleDateString('pt-BR')})
                            </span>
                          ) : aguardandoLiberacao && podeEditar() ? (
                            <button
                              onClick={() => aprovarLiberacaoHumanaLote(insp)}
                              disabled={salvando}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Aprovar Liberação
                            </button>
                          ) : (
                            <span className="text-red-700 font-semibold inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Bloqueado
                            </span>
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
      )}

      {/* ABA 2: TEMPERATURA & CADEIA FRIA */}
      {abaAtiva === 'temperatura' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#542C20]">
                  Curva Térmica Simulada — Câmara Fria & Vitrines (POP-002)
                </h2>
                <p className="text-xs text-[#7F7269]">
                  Limite técnico configurável: 0,0°C a 5,0°C. Medições simuladas para demonstração.
                </p>
              </div>
              {podeEditar() && (
                <button
                  onClick={() => setModalNovaTemp(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#701D2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Aferição Simulada
                </button>
              )}
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGraficoTemp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D8" />
                  <XAxis dataKey="horario" tick={{ fontSize: 11, fill: '#542C20' }} />
                  <YAxis domain={[0, 10]} unit="°C" tick={{ fontSize: 11, fill: '#542C20' }} />
                  <Tooltip />
                  <ReferenceLine
                    y={5}
                    stroke="#DC2626"
                    strokeDasharray="4 4"
                    label={{ value: 'Limite Máx (5°C)', fill: '#DC2626', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperatura"
                    name="Temperatura Aferida (°C)"
                    stroke="#701D2B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#C69A55' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: NÃO CONFORMIDADES & BLOQUEIOS */}
      {abaAtiva === 'nao_conformidades' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                  <th className="py-3 px-4">Código NC</th>
                  <th className="py-3 px-3">Gravidade</th>
                  <th className="py-3 px-3">Lote Segregado</th>
                  <th className="py-3 px-3">Descrição do Desvio</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8] text-xs">
                {naoConformidades.map((nc) => {
                  const lote = extrairItem(nc.estoque_lotes);
                  return (
                    <tr key={nc.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{nc.codigo}</td>
                      <td className="py-3 px-3 uppercase font-bold text-red-700">
                        {nc.gravidade}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#542C20]">
                        {lote?.codigo_lote || '-'}{' '}
                        {nc.lote_bloqueado && (
                          <span className="ml-1 px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px]">
                            BLOQUEADO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#542C20] max-w-md">{nc.descricao}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            nc.status === 'encerrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {nc.status === 'encerrada'
                            ? 'Encerrada'
                            : nc.status === 'em_tratativa'
                            ? 'Em Tratativa CAPA'
                            : 'Aberta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {podeEditar() && nc.status !== 'encerrada' && (
                          <button
                            onClick={() => encerrarNaoConformidade(nc)}
                            className="px-3 py-1.5 rounded-lg border border-[#E8D4BC] hover:bg-emerald-700 hover:text-white text-[11px] font-semibold"
                          >
                            Verificar Eficácia & Encerrar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: POPS & BPF VIGENTES */}
      {abaAtiva === 'pops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pops.map((pop) => (
            <div
              key={pop.id}
              className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-[#701D2B] text-white text-xs font-bold">
                  {pop.codigo} • {pop.versao}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Vigente
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#542C20]">{pop.titulo}</h3>
              <p className="text-[11px] font-semibold text-[#C69A55] uppercase">
                Área: {pop.area}
              </p>
              <p className="text-xs text-[#542C20]/90 leading-relaxed">
                {pop.conteudo_resumo}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ABA 5: RASTREABILIDADE PONTA A PONTA */}
      {abaAtiva === 'rastreabilidade' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#542C20]">
                Consulta Reversa de Lotes (Matéria-Prima ↔ OP ↔ Produto Acabado)
              </h2>
              <p className="text-xs text-[#7F7269]">
                Pesquise qualquer código de lote para verificar validade, saldo e bloqueios.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaLoteRastreio}
                onChange={(e) => setBuscaLoteRastreio(e.target.value)}
                placeholder="Buscar lote ou item..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8D4BC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lotesRastreio.map((l) => {
              const ing = extrairItem(l.ingredientes);
              const prod = extrairItem(l.produtos);
              return (
                <div
                  key={l.id}
                  className="p-4 rounded-xl border border-[#E8D4BC] bg-[#FBF5EE] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#701D2B]">{l.codigo_lote}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        l.status === 'liberado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'bloqueado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="font-semibold text-[#542C20]">
                    {ing
                      ? `Insumo: ${ing.codigo} — ${ing.nome}`
                      : `Produto Acabado: ${prod?.codigo_sku} — ${prod?.nome}`}
                  </p>
                  <p className="text-[#7F7269]">
                    Fabricação: {l.data_fabricacao.split('-').reverse().join('/')} • Validade:{' '}
                    <strong>{l.data_validade.split('-').reverse().join('/')}</strong>
                  </p>
                  <p className="text-[#542C20]">
                    Saldo Atual: <strong>{l.quantidade_atual}</strong> / {l.quantidade_inicial}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL NOVA INSPEÇÃO DE QUALIDADE */}
      {modalNovaInspecao && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Registrar Inspeção de Lote</h3>
              <button onClick={() => setModalNovaInspecao(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovaInspecao} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Checklist / Etapa BPF *</label>
                <select
                  required
                  value={formChecklistId}
                  onChange={(e) => setFormChecklistId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {checklists.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome} ({c.etapa_processo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Lote Inspecionado *</label>
                <select
                  required
                  value={formLoteId}
                  onChange={(e) => setFormLoteId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.codigo_lote} (Status atual: {l.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Resultado da Inspeção *</label>
                <select
                  value={formResultado}
                  onChange={(e) =>
                    setFormResultado(
                      e.target.value as 'aprovado' | 'aprovado_ressalva' | 'reprovado'
                    )
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  <option value="aprovado">
                    Aprovado (Aguardará liberação humana final)
                  </option>
                  <option value="aprovado_ressalva">
                    Aprovado com Ressalva (Mover para Quarentena)
                  </option>
                  <option value="reprovado">
                    Reprovado (Acionar Bloqueio Automático + Abrir NC)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#542C20]">Parecer Técnico / Evidência</label>
                <textarea
                  rows={3}
                  value={formObsInspecao}
                  onChange={(e) => setFormObsInspecao(e.target.value)}
                  placeholder="Descreva temperatura aferida, integridade sensorial ou motivo do desvio..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaInspecao(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Gravando...' : 'Confirmar Inspeção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA AFERIÇÃO DE TEMPERATURA */}
      {modalNovaTemp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#542C20] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                Aferição Simulada — Cadeia Fria
              </h3>
              <button onClick={() => setModalNovaTemp(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarTemperatura} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">
                  Temperatura Aferida (°C) — Faixa: 0,0°C a 5,0°C *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formTempValor}
                  onChange={(e) => setFormTempValor(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] text-base font-bold text-[#701D2B]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#542C20]">Observação</label>
                <textarea
                  rows={2}
                  value={formTempObs}
                  onChange={(e) => setFormTempObs(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaTemp(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  Salvar Medição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualidadeBpfPage;