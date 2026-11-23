import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Factory,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  X,
  Play,
  Check,
  Calendar,
  PackageCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface ProdutoResumo {
  id: string;
  codigo_sku: string;
  nome: string;
}

interface FichaAprovada {
  id: string;
  produto_id: string;
  versao_atual: number;
  rendimento_qtd: number;
  tempo_preparo_min: number;
  custo_total_receita: number;
  produtos?: ProdutoResumo | ProdutoResumo[] | null;
}

interface OrdemProducao {
  id: string;
  unidade_id: string;
  codigo: string;
  produto_id: string;
  ficha_tecnica_id: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  data_programada: string;
  hora_inicio_prevista: string;
  hora_fim_prevista: string;
  status:
    | 'planejada'
    | 'liberada'
    | 'em_producao'
    | 'controle_qualidade'
    | 'concluida'
    | 'cancelada';
  observacoes: string | null;
  produtos?: ProdutoResumo | ProdutoResumo[] | null;
  fichas_tecnicas?:
    | { versao_atual: number; custo_total_receita: number; rendimento_qtd: number }
    | { versao_atual: number; custo_total_receita: number; rendimento_qtd: number }[]
    | null;
}

interface ItemInsumoPrevisto {
  ingrediente_id: string;
  quantidade_bruta: number;
  ingredientes?: { codigo: string; nome: string } | { codigo: string; nome: string }[] | null;
}

const extrairItem = <T,>(valor: T | T[] | null | undefined): T | undefined => {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
};

export const ProducaoPcpPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [fichasAprovadas, setFichasAprovadas] = useState<FichaAprovada[]>([]);
  const [unidadePadraoId, setUnidadePadraoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modal Nova Ordem de Produção
  const [modalNovaOp, setModalNovaOp] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formFichaId, setFormFichaId] = useState('');
  const [formQtdPlanejada, setFormQtdPlanejada] = useState<number>(30);
  const [formDataProgramada, setFormDataProgramada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formHoraInicio, setFormHoraInicio] = useState('06:00');
  const [formHoraFim, setFormHoraFim] = useState('10:00');
  const [formStatusOp, setFormStatusOp] = useState<'planejada' | 'liberada' | 'em_producao'>(
    'liberada'
  );
  const [formObservacoes, setFormObservacoes] = useState(
    'Programação turno manhã (06h) — consumo FEFO obrigatório.'
  );
  const [insumosFichaSelecionada, setInsumosFichaSelecionada] = useState<ItemInsumoPrevisto[]>(
    []
  );

  // Modal Apontamento Rápido de Produção
  const [opApontamento, setOpApontamento] = useState<OrdemProducao | null>(null);
  const [qtdApontada, setQtdApontada] = useState<number>(0);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resOrdens, resFichas] = await Promise.all([
        supabase
          .from('ordens_producao')
          .select(
            '*, produtos(id, codigo_sku, nome), fichas_tecnicas(versao_atual, custo_total_receita, rendimento_qtd)'
          )
          .order('data_programada', { ascending: false })
          .order('codigo', { ascending: false }),
        supabase
          .from('fichas_tecnicas')
          .select(
            'id, produto_id, versao_atual, rendimento_qtd, tempo_preparo_min, custo_total_receita, produtos(id, codigo_sku, nome)'
          )
          .eq('status', 'aprovada'),
      ]);

      if (resOrdens.error) throw resOrdens.error;
      if (resFichas.error) throw resFichas.error;

      const listaOrdens = (resOrdens.data as unknown as OrdemProducao[]) || [];
      const listaFichas = (resFichas.data as unknown as FichaAprovada[]) || [];

      setOrdens(listaOrdens);
      setFichasAprovadas(listaFichas);

      if (listaOrdens.length > 0 && listaOrdens[0].unidade_id) {
        setUnidadePadraoId(listaOrdens[0].unidade_id);
      } else {
        const { data: mesaSample } = await supabase
          .from('mesas')
          .select('unidade_id')
          .limit(1)
          .maybeSingle();
        if (mesaSample?.unidade_id) {
          setUnidadePadraoId(mesaSample.unidade_id);
        }
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar ordens de produção.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Carrega previsão MRP de insumos quando escolhe uma ficha técnica no modal
  useEffect(() => {
    const carregarInsumosDaFicha = async () => {
      if (!formFichaId) {
        setInsumosFichaSelecionada([]);
        return;
      }
      const { data } = await supabase
        .from('ficha_tecnica_itens')
        .select('ingrediente_id, quantidade_bruta, ingredientes(codigo, nome)')
        .eq('ficha_tecnica_id', formFichaId);

      setInsumosFichaSelecionada((data as unknown as ItemInsumoPrevisto[]) || []);
    };
    carregarInsumosDaFicha();
  }, [formFichaId]);

  const abrirModalNovaOp = () => {
    const primeiraFicha = fichasAprovadas[0];
    setFormFichaId(primeiraFicha?.id || '');
    setFormQtdPlanejada(30);
    setFormDataProgramada(new Date().toISOString().split('T')[0]);
    setFormHoraInicio('06:00');
    setFormHoraFim('10:00');
    setFormStatusOp('liberada');
    setFormObservacoes('Programação turno manhã (06h) — consumo FEFO obrigatório.');
    setModalNovaOp(true);
  };

  const fichaEscolhidaObj = useMemo(
    () => fichasAprovadas.find((f) => f.id === formFichaId),
    [fichasAprovadas, formFichaId]
  );

  const criarNovaOrdemProducao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaEscolhidaObj) return;

    setSalvando(true);
    setErro(null);
    try {
      const hoje = formDataProgramada.replace(/-/g, '').slice(4, 8);
      const sufixo = String(Math.floor(10 + Math.random() * 89));
      const codigoOp = `OP-${hoje}-${sufixo}`;

      const { error: errInsert } = await supabase.from('ordens_producao').insert({
        unidade_id: unidadePadraoId || '11111111-1111-1111-1111-111111111101',
        codigo: codigoOp,
        produto_id: fichaEscolhidaObj.produto_id,
        ficha_tecnica_id: fichaEscolhidaObj.id,
        quantidade_planejada: Number(formQtdPlanejada),
        quantidade_produzida: 0,
        data_programada: formDataProgramada,
        hora_inicio_prevista: `${formHoraInicio}:00`,
        hora_fim_prevista: `${formHoraFim}:00`,
        status: formStatusOp,
        observacoes: formObservacoes,
      });

      if (errInsert) throw errInsert;

      setModalNovaOp(false);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar ordem de produção.');
    } finally {
      setSalvando(false);
    }
  };

  const registrarApontamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opApontamento) return;

    setSalvando(true);
    setErro(null);
    try {
      const novoStatus =
        Number(qtdApontada) >= Number(opApontamento.quantidade_planejada)
          ? 'concluida'
          : Number(qtdApontada) > 0
          ? 'em_producao'
          : opApontamento.status;

      const { error: errUpd } = await supabase
        .from('ordens_producao')
        .update({
          quantidade_produzida: Number(qtdApontada),
          status: novoStatus,
        })
        .eq('id', opApontamento.id);

      if (errUpd) throw errUpd;

      setOpApontamento(null);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar apontamento de produção.');
    } finally {
      setSalvando(false);
    }
  };

  // Dados agregados por dia para o Gráfico Recharts
  const dadosGraficoDiario = useMemo(() => {
    const mapa = new Map<
      string,
      { dataIso: string; dia: string; planejado: number; produzido: number; ordens: number }
    >();

    ordens.forEach((op) => {
      if (op.status === 'cancelada') return;
      const iso = op.data_programada;
      const partes = iso.split('-');
      const labelDia = partes.length === 3 ? `${partes[2]}/${partes[1]}` : iso;

      const atual = mapa.get(iso) || {
        dataIso: iso,
        dia: labelDia,
        planejado: 0,
        produzido: 0,
        ordens: 0,
      };
      atual.planejado += Number(op.quantidade_planejada || 0);
      atual.produzido += Number(op.quantidade_produzida || 0);
      atual.ordens += 1;
      mapa.set(iso, atual);
    });

    return Array.from(mapa.values()).sort((a, b) => a.dataIso.localeCompare(b.dataIso));
  }, [ordens]);

  // Indicadores Dinâmicos
  const indicadores = useMemo(() => {
    const ativas = ordens.filter((o) =>
      ['planejada', 'liberada', 'em_producao', 'controle_qualidade'].includes(o.status)
    ).length;
    const concluidas = ordens.filter((o) => o.status === 'concluida').length;

    const totalPlanejado = ordens
      .filter((o) => o.status !== 'cancelada')
      .reduce((acc, o) => acc + Number(o.quantidade_planejada || 0), 0);
    const totalProduzido = ordens
      .filter((o) => o.status !== 'cancelada')
      .reduce((acc, o) => acc + Number(o.quantidade_produzida || 0), 0);

    const aderencia = totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 : 0;

    return { ativas, concluidas, totalProduzido, aderencia };
  }, [ordens]);

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((op) => {
      const prod = extrairItem(op.produtos);
      const termo = busca.toLowerCase();
      const bateBusca =
        !termo ||
        op.codigo.toLowerCase().includes(termo) ||
        (prod?.nome || '').toLowerCase().includes(termo) ||
        (prod?.codigo_sku || '').toLowerCase().includes(termo);
      const bateStatus = filtroStatus === 'todos' || op.status === filtroStatus;
      return bateBusca && bateStatus;
    });
  }, [ordens, busca, filtroStatus]);

  const dadosCsv = useMemo(
    () =>
      ordensFiltradas.map((op) => {
        const prod = extrairItem(op.produtos);
        return {
          Codigo_OP: op.codigo,
          Data: op.data_programada,
          SKU: prod?.codigo_sku || '-',
          Produto: prod?.nome || '-',
          Qtd_Planejada: op.quantidade_planejada,
          Qtd_Produzida: op.quantidade_produzida,
          Horario: `${op.hora_inicio_prevista} - ${op.hora_fim_prevista}`,
          Status: op.status,
        };
      }),
    [ordensFiltradas]
  );

  const traduzirStatus = (status: OrdemProducao['status']) => {
    const mapa: Record<OrdemProducao['status'], { texto: string; classe: string }> = {
      planejada: { texto: 'Planejada', classe: 'bg-slate-100 text-slate-800' },
      liberada: { texto: 'Liberada (Chef)', classe: 'bg-blue-100 text-blue-800' },
      em_producao: { texto: 'Em Produção', classe: 'bg-amber-100 text-amber-800' },
      controle_qualidade: {
        texto: 'Inspeção Qualidade',
        classe: 'bg-purple-100 text-purple-800',
      },
      concluida: { texto: 'Concluída', classe: 'bg-emerald-100 text-emerald-800' },
      cancelada: { texto: 'Cancelada', classe: 'bg-red-100 text-red-800' },
    };
    return mapa[status] || { texto: status, classe: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.7 • Planejamento e Controle da Produção (PCP)"
        titulo="Produção & Programação Diária"
        descricao="Programação diária a partir das 06h, cálculo MRP por ficha técnica aprovada, consumo FEFO e acompanhamento diário de rendimento."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_ordens_producao.csv"
        textoBotaoNovo="Nova Ordem de Produção"
        onNovoRegistro={abrirModalNovaOp}
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
            <span>Ordens Ativas / Programadas</span>
            <Factory className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">{indicadores.ativas}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Turno operacional a partir das 06:00
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Ordens Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{indicadores.concluidas}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Lotes liberados para vitrine/estoque
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Total Unidades Produzidas</span>
            <PackageCheck className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">
            {indicadores.totalProduzido} un
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Soma acumulada no período registrado
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Aderência ao Plano</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">
            {indicadores.aderencia.toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Fórmula: (Produzido / Planejado) × 100
          </p>
        </div>
      </div>

      {/* GRÁFICO DE PRODUÇÃO DIÁRIA (UNIDADES PLANEJADAS VS PRODUZIDAS POR DIA) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#542C20] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#701D2B]" />
              Produção Diária — Unidades Planejadas vs. Produzidas
            </h2>
            <p className="text-xs text-[#7F7269]">
              Consolidado diário em tempo real das ordens de produção registradas no banco.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#F5E8D8] text-[#542C20]">
            {dadosGraficoDiario.length} dias com movimentação
          </span>
        </div>

        <div className="h-72 w-full">
          {dadosGraficoDiario.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#7F7269]">
              Nenhuma produção diária registrada ainda. Clique em "Nova Ordem de Produção".
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoDiario}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D8" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#542C20' }} />
                <YAxis tick={{ fontSize: 12, fill: '#542C20' }} unit=" un" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8D4BC',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="planejado"
                  name="Unidades Planejadas"
                  fill="#C69A55"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="produzido"
                  name="Unidades Produzidas"
                  fill="#701D2B"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filtros da Tabela de Ordens */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por OP, SKU ou produto..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8D4BC]"
          />
        </div>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white text-[#542C20] w-full md:w-auto"
        >
          <option value="todos">Todos os Status</option>
          <option value="planejada">Planejada</option>
          <option value="liberada">Liberada</option>
          <option value="em_producao">Em Produção</option>
          <option value="controle_qualidade">Controle de Qualidade</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Tabela de Ordens de Produção */}
      <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                <th className="py-3 px-4">Ordem (OP)</th>
                <th className="py-3 px-3">Data / Janela</th>
                <th className="py-3 px-3">Produto / Ficha</th>
                <th className="py-3 px-3">Planejado</th>
                <th className="py-3 px-3">Produzido</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Apontamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5E8D8] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7F7269]">
                    Carregando ordens de produção...
                  </td>
                </tr>
              ) : ordensFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7F7269]">
                    Nenhuma ordem de produção encontrada.
                  </td>
                </tr>
              ) : (
                ordensFiltradas.map((op) => {
                  const st = traduzirStatus(op.status);
                  const prod = extrairItem(op.produtos);
                  const ft = extrairItem(op.fichas_tecnicas);
                  return (
                    <tr key={op.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{op.codigo}</td>
                      <td className="py-3 px-3 text-[#542C20]">
                        <div className="font-medium">
                          {op.data_programada.split('-').reverse().join('/')}
                        </div>
                        <div className="text-[11px] text-[#7F7269] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {op.hora_inicio_prevista?.slice(0, 5)} às{' '}
                          {op.hora_fim_prevista?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#542C20]">
                          {prod?.codigo_sku} — {prod?.nome}
                        </div>
                        <div className="text-[11px] text-[#7F7269]">
                          Ficha v{ft?.versao_atual || 1}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#542C20]">
                        {op.quantidade_planejada} un
                      </td>
                      <td className="py-3 px-3 font-bold text-[#701D2B]">
                        {op.quantidade_produzida} un
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.classe}`}
                        >
                          {st.texto}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {podeEditar() && op.status !== 'cancelada' && (
                          <button
                            onClick={() => {
                              setOpApontamento(op);
                              setQtdApontada(
                                Number(op.quantidade_produzida) > 0
                                  ? Number(op.quantidade_produzida)
                                  : Number(op.quantidade_planejada)
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#E8D4BC] hover:bg-[#701D2B] hover:text-white text-[#542C20] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Apontar
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

      {/* MODAL ADICIONAR NOVA ORDEM DE PRODUÇÃO */}
      {modalNovaOp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-[#E8D4BC]">
            <div className="p-5 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between sticky top-0">
              <h2 className="font-serif text-xl font-bold">
                Programar Nova Ordem de Produção (OP)
              </h2>
              <button
                onClick={() => setModalNovaOp(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={criarNovaOrdemProducao} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">
                  Produto com Ficha Técnica Aprovada *
                </label>
                <select
                  required
                  value={formFichaId}
                  onChange={(e) => setFormFichaId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                >
                  {fichasAprovadas.map((f) => {
                    const prod = extrairItem(f.produtos);
                    return (
                      <option key={f.id} value={f.id}>
                        {prod?.codigo_sku} — {prod?.nome} (Ficha v{f.versao_atual} • Rende{' '}
                        {f.rendimento_qtd} un)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">
                    Quantidade Planejada (un) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formQtdPlanejada}
                    onChange={(e) => setFormQtdPlanejada(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Data Programada *</label>
                  <input
                    type="date"
                    required
                    value={formDataProgramada}
                    onChange={(e) => setFormDataProgramada(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Status Inicial *</label>
                  <select
                    value={formStatusOp}
                    onChange={(e) =>
                      setFormStatusOp(
                        e.target.value as 'planejada' | 'liberada' | 'em_producao'
                      )
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="liberada">Liberada (Aprovada pelo Chef)</option>
                    <option value="em_producao">Em Produção Imediata</option>
                    <option value="planejada">Planejada (Aguardando Aprovação)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Início Previsto</label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Término Previsto</label>
                  <input
                    type="time"
                    value={formHoraFim}
                    onChange={(e) => setFormHoraFim(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              {/* Prévia MRP de Insumos Calculados pela Ficha Técnica */}
              {fichaEscolhidaObj && insumosFichaSelecionada.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                  <p className="font-bold text-[#701D2B] mb-2">
                    Requisição MRP Calculada (Fator:{' '}
                    {(
                      formQtdPlanejada / Math.max(1, Number(fichaEscolhidaObj.rendimento_qtd))
                    ).toFixed(2)}
                    x a receita base)
                  </p>
                  <div className="space-y-1 text-[11px] text-[#542C20]">
                    {insumosFichaSelecionada.map((ins, i) => {
                      const ing = extrairItem(ins.ingredientes);
                      const fator =
                        formQtdPlanejada / Math.max(1, Number(fichaEscolhidaObj.rendimento_qtd));
                      const qtdNecessaria = (Number(ins.quantidade_bruta) * fator).toFixed(1);
                      return (
                        <div key={i} className="flex justify-between">
                          <span>
                            {ing?.codigo} — {ing?.nome}
                          </span>
                          <strong>{qtdNecessaria} g/ml (Reserva FEFO)</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-[#542C20]">
                  Observações Operacionais / Turno
                </label>
                <textarea
                  rows={2}
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8D4BC]">
                <button
                  type="button"
                  onClick={() => setModalNovaOp(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-lg bg-[#701D2B] hover:bg-[#53131E] text-white font-semibold"
                >
                  {salvando ? 'Programando...' : 'Confirmar Ordem de Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APONTAMENTO DE PRODUÇÃO REALIZADA */}
      {opApontamento && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#542C20] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                Apontamento • {opApontamento.codigo}
              </h3>
              <button onClick={() => setOpApontamento(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={registrarApontamento} className="p-5 space-y-4 text-xs">
              <p className="text-[#542C20]">
                Produto: <strong>{extrairItem(opApontamento.produtos)?.nome}</strong>
                <br />
                Quantidade Planejada: <strong>{opApontamento.quantidade_planejada} un</strong>
              </p>
              <div>
                <label className="font-bold text-[#542C20]">
                  Quantidade Efetivamente Produzida (un) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={qtdApontada}
                  onChange={(e) => setQtdApontada(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] text-base font-bold text-[#701D2B]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpApontamento(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Apontamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProducaoPcpPage;