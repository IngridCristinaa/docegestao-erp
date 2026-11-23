import React, { useEffect, useMemo, useState } from 'react';
import {
  HeartHandshake,
  Crown,
  Gift,
  MessageSquareHeart,
  Megaphone,
  Search,
  UserPlus,
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Cake,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface ClienteRfm {
  cliente_id: string;
  codigo: string;
  nome: string;
  tipo_pessoa: string;
  segmento: 'vip' | 'recorrente' | 'ocasional' | 'b2b' | 'inativo';
  data_nascimento: string | null;
  frequencia_pedidos: number;
  valor_total_gasto: number;
  ticket_medio: number;
  ultima_compra: string | null;
}

interface ClienteDetalhe {
  id: string;
  codigo: string;
  nome: string;
  tipo_pessoa: string;
  documento_ficticio: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  segmento: 'vip' | 'recorrente' | 'ocasional' | 'b2b' | 'inativo';
  preferencias: string | null;
  ativo: boolean;
}

interface AtendimentoSac {
  id: string;
  unidade_id: string;
  protocolo: string;
  cliente_id: string | null;
  tipo: 'reclamacao' | 'elogio' | 'duvida' | 'solicitacao' | 'ocorrencia';
  descricao: string;
  resolucao: string | null;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'encerrado';
  created_at: string;
  clientes?: { codigo: string; nome: string } | any;
}

interface CampanhaCrm {
  id: string;
  codigo: string;
  nome: string;
  segmento_alvo: string;
  canal_disparo: string;
  beneficio_oferecido: string;
  data_inicio: string;
  data_fim: string;
  publico_estimado: number;
  taxa_conversao_simulada: number;
  status: 'planejada' | 'ativa' | 'concluida' | 'cancelada';
}

interface PesquisaSatisfacao {
  id: string;
  canal: string;
  nota_estrelas: number;
  comentario: string | null;
  created_at: string;
  clientes?: { nome: string } | any;
}

const extrairItem = <T,>(valor: T | T[] | null | undefined): T | undefined => {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
};

export const CrmAtendimentoPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<
    'clientes' | 'fidelidade' | 'sac_eventos' | 'campanhas' | 'nps'
  >('clientes');

  const [clientes, setClientes] = useState<ClienteDetalhe[]>([]);
  const [rfmLista, setRfmLista] = useState<ClienteRfm[]>([]);
  const [chamadosSac, setChamadosSac] = useState<AtendimentoSac[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaCrm[]>([]);
  const [pesquisas, setPesquisas] = useState<PesquisaSatisfacao[]>([]);
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('todos');

  // Modal Novo Cliente
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTipoPessoa, setFormTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [formDoc, setFormDoc] = useState('444.555.666-77');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('(62) 99911-2233');
  const [formSegmento, setFormSegmento] = useState<'vip' | 'recorrente' | 'ocasional' | 'b2b'>('recorrente');
  const [formPreferencias, setFormPreferencias] = useState('');

  // Modal Novo Protocolo SAC / Orçamento Evento
  const [modalNovoSac, setModalNovoSac] = useState(false);
  const [formSacClienteId, setFormSacClienteId] = useState('');
  const [formSacTipo, setFormSacTipo] = useState<AtendimentoSac['tipo']>('solicitacao');
  const [formSacDescricao, setFormSacDescricao] = useState('');

  const carregarTudo = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resCli, resRfm, resSac, resCamp, resPesq] = await Promise.all([
        supabase.from('clientes').select('*').eq('ativo', true).order('codigo', { ascending: true }),
        supabase.from('vw_crm_rfm_clientes').select('*'),
        supabase
          .from('atendimentos_sac')
          .select('*, clientes(codigo, nome)')
          .order('created_at', { ascending: false }),
        supabase.from('campanhas_crm').select('*').order('data_inicio', { ascending: false }),
        supabase
          .from('pesquisas_satisfacao')
          .select('*, clientes(nome)')
          .order('created_at', { ascending: false }),
      ]);

      if (resCli.error) throw resCli.error;

      const listaClientes = (resCli.data as ClienteDetalhe[]) || [];
      const listaSac = (resSac.data as unknown as AtendimentoSac[]) || [];

      setClientes(listaClientes);
      setRfmLista((resRfm.data as ClienteRfm[]) || []);
      setChamadosSac(listaSac);
      setCampanhas((resCamp.data as CampanhaCrm[]) || []);
      setPesquisas((resPesq.data as unknown as PesquisaSatisfacao[]) || []);

      if (listaSac[0]?.unidade_id) {
        setUnidadeId(listaSac[0].unidade_id);
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados do módulo de CRM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  // Cadastrar Novo Cliente
  const salvarNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    setSalvando(true);
    setErro(null);
    try {
      const proximoCodigo = `CLI-${String(clientes.length + 1).padStart(3, '0')}`;
      const { error: errIns } = await supabase.from('clientes').insert({
        codigo: proximoCodigo,
        nome: formNome.trim(),
        tipo_pessoa: formTipoPessoa,
        documento_ficticio: formDoc,
        email: formEmail || `${proximoCodigo.toLowerCase()}@docegestao.demo`,
        telefone: formTelefone,
        segmento: formSegmento,
        preferencias: formPreferencias || 'Consentimento LGPD ativo. Sem restrições registradas.',
        ativo: true,
      });

      if (errIns) throw errIns;

      setModalNovoCliente(false);
      setFormNome('');
      setFormPreferencias('');
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao cadastrar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  // Abrir Protocolo SAC / Orçamento Evento
  const salvarNovoProtocoloSac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSacDescricao.trim()) return;

    setSalvando(true);
    setErro(null);
    try {
      const protocolo = `SAC-2026-${String(Math.floor(100 + Math.random() * 899))}`;
      const { error: errSac } = await supabase.from('atendimentos_sac').insert({
        unidade_id: unidadeId || '11111111-1111-1111-1111-111111111101',
        protocolo,
        cliente_id: formSacClienteId || null,
        tipo: formSacTipo,
        descricao: formSacDescricao.trim(),
        status: 'aberto',
      });

      if (errSac) throw errSac;

      setModalNovoSac(false);
      setFormSacDescricao('');
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar protocolo SAC.');
    } finally {
      setSalvando(false);
    }
  };

  // Resolver Chamado SAC
  const resolverChamadoSac = async (chamado: AtendimentoSac) => {
    setSalvando(true);
    try {
      await supabase
        .from('atendimentos_sac')
        .update({
          status: 'resolvido',
          resolucao: 'Atendimento concluído e validado pela coordenação de relacionamento.',
        })
        .eq('id', chamado.id);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao resolver atendimento.');
    } finally {
      setSalvando(false);
    }
  };

  // Indicadores Dinâmicos
  const indicadores = useMemo(() => {
    const totalClientes = clientes.length;
    const vipsEb2b = clientes.filter((c) => ['vip', 'b2b'].includes(c.segmento)).length;
    const sacAbertos = chamadosSac.filter((s) =>
      ['aberto', 'em_andamento'].includes(s.status)
    ).length;

    const mediaEstrelas =
      pesquisas.length > 0
        ? pesquisas.reduce((acc, p) => acc + Number(p.nota_estrelas || 0), 0) / pesquisas.length
        : 5.0;

    return { totalClientes, vipsEb2b, sacAbertos, mediaEstrelas };
  }, [clientes, chamadosSac, pesquisas]);

  // Cruzamento Cliente + Métricas RFM + Pontos Fidelidade Calculados
  const clientesEnriquecidos = useMemo(() => {
    return clientes
      .map((c) => {
        const rfm = rfmLista.find((r) => r.cliente_id === c.id);
        const totalGasto = Number(rfm?.valor_total_gasto || 0);
        const pontosFidelidade = Math.floor(totalGasto * 2) + (c.segmento === 'vip' ? 350 : 80);
        const cashbackDisponivel = Number((pontosFidelidade * 0.05).toFixed(2));
        return {
          ...c,
          frequencia: Number(rfm?.frequencia_pedidos || 0),
          totalGasto,
          ticketMedio: Number(rfm?.ticket_medio || 0),
          pontosFidelidade,
          cashbackDisponivel,
        };
      })
      .filter((c) => {
        const termo = busca.toLowerCase();
        const bateBusca =
          !termo ||
          c.codigo.toLowerCase().includes(termo) ||
          c.nome.toLowerCase().includes(termo) ||
          (c.preferencias || '').toLowerCase().includes(termo);
        const bateSeg = filtroSegmento === 'todos' || c.segmento === filtroSegmento;
        return bateBusca && bateSeg;
      });
  }, [clientes, rfmLista, busca, filtroSegmento]);

  const dadosCsv = useMemo(
    () =>
      clientesEnriquecidos.map((c) => ({
        Codigo: c.codigo,
        Cliente: c.nome,
        Tipo: c.tipo_pessoa,
        Segmento_RFM: c.segmento.toUpperCase(),
        Pedidos: c.frequencia,
        LTV_Total_R$: c.totalGasto.toFixed(2),
        Pontos_Fidelidade: c.pontosFidelidade,
        Cashback_R$: c.cashbackDisponivel.toFixed(2),
      })),
    [clientesEnriquecidos]
  );

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.3 • CRM, Fidelidade & Experiência do Cliente"
        titulo="Relacionamento, RFM, Fidelidade & SAC"
        descricao="Base unificada PF/PJ (LGPD), inteligência RFM, programa de pontos e cashback, orçamentos de eventos e central SAC/NPS."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_crm_clientes.csv"
        textoBotaoNovo="Novo Cliente"
        onNovoRegistro={() => setModalNovoCliente(true)}
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
            <span>Carteira Ativa (LGPD)</span>
            <HeartHandshake className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">{indicadores.totalClientes}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Clientes PF e Corporativos B2B
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Clientes VIP & Contas B2B</span>
            <Crown className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">{indicadores.vipsEb2b}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Maior LTV e recorrência de eventos
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>SAC & Orçamentos em Aberto</span>
            <MessageSquareHeart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{indicadores.sacAbertos}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Protocolos aguardando tratativa
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Satisfação Média (NPS)</span>
            <Star className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {indicadores.mediaEstrelas.toFixed(1)} / 5.0
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Base: {pesquisas.length} avaliações pós-venda
          </p>
        </div>
      </div>

      {/* Abas Internas */}
      <div className="bg-white p-2 rounded-2xl border border-[#E8D4BC] flex flex-wrap gap-2">
        {[
          { id: 'clientes', label: 'Base de Clientes & RFM', icon: Crown },
          { id: 'fidelidade', label: 'Programa Fidelidade & Cashback', icon: Gift },
          { id: 'sac_eventos', label: 'SAC & Orçamentos de Eventos', icon: MessageSquareHeart },
          { id: 'campanhas', label: 'Campanhas Segmentadas', icon: Megaphone },
          { id: 'nps', label: 'Satisfação & Avaliações', icon: Star },
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

      {/* ABA 1: BASE DE CLIENTES & SEGMENTAÇÃO RFM */}
      {abaAtiva === 'clientes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC] flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, código ou alergia/preferência..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8D4BC]"
              />
            </div>

            <select
              value={filtroSegmento}
              onChange={(e) => setFiltroSegmento(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white"
            >
              <option value="todos">Todos os Segmentos RFM</option>
              <option value="vip">VIP</option>
              <option value="b2b">Corporativo B2B</option>
              <option value="recorrente">Recorrente</option>
              <option value="ocasional">Ocasional</option>
              <option value="inativo">Inativo (Reativação)</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-3">Segmento RFM</th>
                    <th className="py-3 px-3">Preferências / Alergênicos</th>
                    <th className="py-3 px-3">Pedidos</th>
                    <th className="py-3 px-3">LTV Acumulado</th>
                    <th className="py-3 px-4 text-right">Fidelidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7F7269]">
                        Carregando carteira de clientes...
                      </td>
                    </tr>
                  ) : (
                    clientesEnriquecidos.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#701D2B]">
                            {c.codigo} ({c.tipo_pessoa})
                          </span>
                          <div className="font-semibold text-[#542C20] flex items-center gap-1.5">
                            {c.nome}
                            {c.data_nascimento && (
                              <span
                                title="Aniversário cadastrado para campanha"
                                className="text-[#C69A55]"
                              >
                                <Cake className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              c.segmento === 'vip'
                                ? 'bg-[#701D2B] text-[#F5E8D8]'
                                : c.segmento === 'b2b'
                                ? 'bg-amber-100 text-amber-900'
                                : c.segmento === 'recorrente'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.segmento}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#542C20] max-w-xs">
                          {c.preferencias || 'Sem restrições informadas'}
                        </td>
                        <td className="py-3 px-3 font-semibold">{c.frequencia}</td>
                        <td className="py-3 px-3 font-bold text-[#542C20]">
                          R$ {c.totalGasto.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {c.pontosFidelidade} pts (R$ {c.cashbackDisponivel.toFixed(2)})
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

      {/* ABA 2: PROGRAMA DE FIDELIDADE & CASHBACK */}
      {abaAtiva === 'fidelidade' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clientesEnriquecidos.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#701D2B]">{c.codigo}</span>
                <span className="px-2 py-0.5 rounded bg-[#F5E8D8] text-[#542C20] font-bold uppercase">
                  Nível {c.segmento}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#542C20]">{c.nome}</h3>
              <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC] flex justify-between items-center">
                <div>
                  <span className="text-[#7F7269]">Saldo de Pontos</span>
                  <p className="text-lg font-bold text-[#701D2B]">{c.pontosFidelidade} pts</p>
                </div>
                <div className="text-right">
                  <span className="text-[#7F7269]">Cashback Disponível</span>
                  <p className="text-lg font-bold text-emerald-700">
                    R$ {c.cashbackDisponivel.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#7F7269]">
                Regra: R$ 1,00 consumido = 2 pontos • Resgate direto no PDV ou Loja Digital.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ABA 3: SAC & ORÇAMENTOS DE EVENTOS */}
      {abaAtiva === 'sac_eventos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {podeEditar() && (
              <button
                onClick={() => {
                  setFormSacClienteId(clientes[0]?.id || '');
                  setModalNovoSac(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#701D2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C69A55]" />
                Novo Protocolo SAC / Orçamento Evento
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                    <th className="py-3 px-4">Protocolo</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descrição / Escopo</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8] text-xs">
                  {chamadosSac.map((s) => {
                    const cli = extrairItem(s.clientes);
                    return (
                      <tr key={s.id} className="hover:bg-[#FBF5EE]">
                        <td className="py-3 px-4 font-bold text-[#701D2B]">{s.protocolo}</td>
                        <td className="py-3 px-3 font-semibold text-[#542C20]">
                          {cli?.nome || 'Cliente Avulso'}
                        </td>
                        <td className="py-3 px-3 uppercase font-semibold text-[#C69A55]">
                          {s.tipo}
                        </td>
                        <td className="py-3 px-3 text-[#542C20] max-w-md">{s.descricao}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              s.status === 'resolvido' || s.status === 'encerrado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status === 'resolvido'
                              ? 'Resolvido'
                              : s.status === 'em_andamento'
                              ? 'Em Tratativa'
                              : 'Aberto'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {podeEditar() &&
                            ['aberto', 'em_andamento'].includes(s.status) && (
                              <button
                                onClick={() => resolverChamadoSac(s)}
                                className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold"
                              >
                                Concluir Atendimento
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
        </div>
      )}

      {/* ABA 4: CAMPANHAS SEGMENTADAS */}
      {abaAtiva === 'campanhas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campanhas.map((cmp) => (
            <div
              key={cmp.id}
              className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2 text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#701D2B]">{cmp.codigo}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    cmp.status === 'ativa'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {cmp.status}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#542C20]">{cmp.nome}</h3>
              <p className="text-[#7F7269]">
                Segmento-alvo: <strong className="uppercase">{cmp.segmento_alvo}</strong> • Canal:{' '}
                <strong>{cmp.canal_disparo}</strong>
              </p>
              <p className="p-2.5 rounded-lg bg-[#FBF5EE] border border-[#E8D4BC] text-[#542C20]">
                {cmp.beneficio_oferecido}
              </p>
              <div className="flex justify-between pt-1 text-[#542C20]">
                <span>Público: {cmp.publico_estimado} clientes</span>
                <strong className="text-emerald-700">
                  Conversão: {cmp.taxa_conversao_simulada}%
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA 5: NPS & SATISFAÇÃO */}
      {abaAtiva === 'nps' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pesquisas.map((p) => {
            const cli = extrairItem(p.clientes);
            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#542C20]">{cli?.nome || 'Cliente'}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                    ★ {p.nota_estrelas} / 5
                  </span>
                </div>
                <p className="text-[11px] uppercase text-[#C69A55] font-semibold">
                  Canal: {p.canal}
                </p>
                <p className="text-[#542C20] italic">"{p.comentario}"</p>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVO CLIENTE */}
      {modalNovoCliente && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C69A55]" />
                Cadastrar Novo Cliente (LGPD)
              </h3>
              <button onClick={() => setModalNovoCliente(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoCliente} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Beatriz Alencar (Demo)"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Tipo Pessoa</label>
                  <select
                    value={formTipoPessoa}
                    onChange={(e) => setFormTipoPessoa(e.target.value as 'PF' | 'PJ')}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica / Evento (PJ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#542C20]">Segmento Inicial</label>
                  <select
                    value={formSegmento}
                    onChange={(e) => setFormSegmento(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="recorrente">Recorrente</option>
                    <option value="vip">VIP</option>
                    <option value="b2b">Corporativo B2B</option>
                    <option value="ocasional">Ocasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#542C20]">
                  Preferências Gastronômicas & Alergênicos
                </label>
                <textarea
                  rows={2}
                  value={formPreferencias}
                  onChange={(e) => setFormPreferencias(e.target.value)}
                  placeholder="Ex: Alergia a nozes; preferência por ganache 70% cacau..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoCliente(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PROTOCOLO SAC / ORÇAMENTO EVENTO */}
      {modalNovoSac && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#542C20] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                Abrir Atendimento SAC / Orçamento Evento
              </h3>
              <button onClick={() => setModalNovoSac(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoProtocoloSac} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Cliente</label>
                <select
                  value={formSacClienteId}
                  onChange={(e) => setFormSacClienteId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Tipo de Registro</label>
                <select
                  value={formSacTipo}
                  onChange={(e) => setFormSacTipo(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  <option value="solicitacao">Orçamento de Evento / Encomenda Especial</option>
                  <option value="elogio">Elogio</option>
                  <option value="duvida">Dúvida / Alergênicos</option>
                  <option value="reclamacao">Reclamação</option>
                  <option value="ocorrencia">Ocorrência de Entrega</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#542C20]">Descrição Detalhada *</label>
                <textarea
                  required
                  rows={3}
                  value={formSacDescricao}
                  onChange={(e) => setFormSacDescricao(e.target.value)}
                  placeholder="Descreva quantidades, data do evento ou detalhes do atendimento..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoSac(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  Registrar Protocolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmAtendimentoPage;