import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  ShieldCheck,
  Search,
  UserPlus,
  X,
  CheckCircle2,
  Calendar,
  Award,
  Network,
  UserCheck,
  Eye,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface Cargo {
  id: string;
  codigo: string;
  nome: string;
  departamento: string;
  salario_base: number;
  descricao_competencias: string | null;
}

interface Funcionario {
  id: string;
  unidade_id: string;
  cargo_id: string;
  matricula: string;
  nome_completo: string;
  cpf_ficticio: string;
  email_corporativo: string | null;
  telefone: string | null;
  data_admissao: string;
  tipo_contrato: 'clt' | 'estagio' | 'temporario' | 'aprendiz';
  salario_atual: number;
  turno_padrao: string | null;
  treinamento_lgpd_concluido: boolean;
  data_treinamento_lgpd: string | null;
  status: 'ativo' | 'ferias' | 'afastado' | 'desligado';
  cargos?: Cargo | Cargo[] | null;
}

interface RegistroPonto {
  id: string;
  funcionario_id: string;
  data_hora: string;
  tipo_batida: 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';
  origem: 'relogio_fisico' | 'app_simulado' | 'ajuste_manual';
  horas_extras_min: number;
  observacao: string | null;
  funcionarios?: { matricula: string; nome_completo: string } | any;
}

interface EscalaTrabalho {
  id: string;
  funcionario_id: string;
  data_trabalho: string;
  hora_entrada_prevista: string;
  hora_saida_prevista: string;
  tipo_dia: 'normal' | 'folga' | 'ferias' | 'feriado' | 'atestado';
  funcionarios?: { matricula: string; nome_completo: string; turno_padrao: string } | any;
}

interface FolhaGerencial {
  id: string;
  funcionario_id: string;
  competencia: string;
  salario_base: number;
  adicionais_horas_extras: number;
  beneficios: number;
  descontos_simulados: number;
  liquido_estimado: number;
  status: 'calculada_preliminar' | 'validada_externamente' | 'paga_simulada';
  funcionarios?: { matricula: string; nome_completo: string } | any;
}

interface AvaliacaoDesempenho {
  id: string;
  funcionario_id: string;
  tipo: string;
  periodo_referencia: string;
  nota_geral: number;
  pontos_fortes: string | null;
  metas_pdi: string | null;
  funcionarios?: { matricula: string; nome_completo: string } | any;
}

interface Treinamento {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  carga_horaria: number;
  obrigatorio: boolean;
  data_realizacao: string | null;
}

const extrairItem = <T,>(valor: T | T[] | null | undefined): T | undefined => {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
};

export const RecursosHumanosPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<
    'colaboradores' | 'organograma' | 'ponto' | 'escalas' | 'folha' | 'desenvolvimento' | 'portal'
  >('colaboradores');

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);
  const [escalas, setEscalas] = useState<EscalaTrabalho[]>([]);
  const [folhas, setFolhas] = useState<FolhaGerencial[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDesempenho[]>([]);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Ficha 360º do Colaborador / Portal
  const [fichaColaborador, setFichaColaborador] = useState<Funcionario | null>(null);
  const [colaboradorPortalId, setColaboradorPortalId] = useState<string>('');

  // Modal Admissão de Novo Colaborador Fictício
  const [modalNovoFunc, setModalNovoFunc] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('000.111.222-33');
  const [formCargoId, setFormCargoId] = useState('');
  const [formContrato, setFormContrato] = useState<'clt' | 'estagio' | 'temporario' | 'aprendiz'>('clt');
  const [formSalario, setFormSalario] = useState<number>(2800);
  const [formTurno, setFormTurno] = useState('Manhã (06:00 - 14:20)');

  const carregarTudo = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resFunc, resCargos, resPonto, resEscala, resFolha, resAval, resTrein] =
        await Promise.all([
          supabase
            .from('funcionarios')
            .select('*, cargos(*)')
            .order('matricula', { ascending: true }),
          supabase.from('cargos').select('*').eq('ativo', true).order('nome', { ascending: true }),
          supabase
            .from('registros_ponto')
            .select('*, funcionarios(matricula, nome_completo)')
            .order('data_hora', { ascending: false })
            .limit(30),
          supabase
            .from('escalas_trabalho')
            .select('*, funcionarios(matricula, nome_completo, turno_padrao)')
            .order('data_trabalho', { ascending: true })
            .limit(30),
          supabase
            .from('folha_gerencial')
            .select('*, funcionarios(matricula, nome_completo)')
            .order('competencia', { ascending: false }),
          supabase
            .from('avaliacoes_desempenho')
            .select('*, funcionarios!avaliacoes_desempenho_funcionario_id_fkey(matricula, nome_completo)')
            .order('created_at', { ascending: false }),
          supabase.from('treinamentos').select('*').order('codigo', { ascending: true }),
        ]);

      if (resFunc.error) throw resFunc.error;
      if (resCargos.error) throw resCargos.error;

      const listaFuncs = (resFunc.data as unknown as Funcionario[]) || [];
      setFuncionarios(listaFuncs);
      setCargos((resCargos.data as Cargo[]) || []);
      setPontos((resPonto.data as unknown as RegistroPonto[]) || []);
      setEscalas((resEscala.data as unknown as EscalaTrabalho[]) || []);
      setFolhas((resFolha.data as unknown as FolhaGerencial[]) || []);
      setAvaliacoes((resAval.data as unknown as AvaliacaoDesempenho[]) || []);
      setTreinamentos((resTrein.data as Treinamento[]) || []);

      if (listaFuncs[0]?.id && !colaboradorPortalId) {
        setColaboradorPortalId(listaFuncs[0].id);
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados do módulo de RH.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  // Admissão de Novo Colaborador Fictício
  const salvarNovoColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCargoId) return;

    setSalvando(true);
    setErro(null);
    try {
      const proximaMatricula = `MAT-${String(funcionarios.length + 1).padStart(3, '0')}`;
      const unId = funcionarios[0]?.unidade_id || '11111111-1111-1111-1111-111111111101';
      const emailSlug = formNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');

      const { error: errIns } = await supabase.from('funcionarios').insert({
        unidade_id: unId,
        cargo_id: formCargoId,
        matricula: proximaMatricula,
        nome_completo: formNome.trim(),
        cpf_ficticio: formCpf,
        email_corporativo: `${emailSlug}@docegestao.demo`,
        data_admissao: new Date().toISOString().split('T')[0],
        tipo_contrato: formContrato,
        salario_atual: Number(formSalario),
        turno_padrao: formTurno,
        treinamento_lgpd_concluido: true,
        data_treinamento_lgpd: new Date().toISOString().split('T')[0],
        status: 'ativo',
      });

      if (errIns) throw errIns;

      setModalNovoFunc(false);
      setFormNome('');
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao admitir colaborador.');
    } finally {
      setSalvando(false);
    }
  };

  // Aprovar / Validar Ajuste de Ponto Híbrido
  const aprovarAjustePonto = async (ponto: RegistroPonto) => {
    setSalvando(true);
    try {
      await supabase
        .from('registros_ponto')
        .update({
          origem: 'ajuste_manual',
          observacao: `${ponto.observacao || ''} — [Ajuste aprovado pelo Gestor]`,
        })
        .eq('id', ponto.id);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao aprovar ajuste de ponto.');
    } finally {
      setSalvando(false);
    }
  };

  // Validar Folha Gerencial Externamente
  const validarFolhaGerencial = async (folha: FolhaGerencial) => {
    setSalvando(true);
    try {
      await supabase
        .from('folha_gerencial')
        .update({ status: 'validada_externamente' })
        .eq('id', folha.id);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao validar folha.');
    } finally {
      setSalvando(false);
    }
  };

  // Indicadores Dinâmicos
  const indicadores = useMemo(() => {
    const ativos = funcionarios.filter((f) => f.status === 'ativo').length;
    const afastadosOuFerias = funcionarios.filter((f) =>
      ['ferias', 'afastado'].includes(f.status)
    ).length;
    const lgpdOk = funcionarios.filter((f) => f.treinamento_lgpd_concluido).length;
    const pctLgpd = funcionarios.length > 0 ? (lgpdOk / funcionarios.length) * 100 : 100;
    const folhaEstimada = funcionarios
      .filter((f) => f.status !== 'desligado')
      .reduce((acc, f) => acc + Number(f.salario_atual || 0), 0);
    const totalHorasExtrasMin = pontos.reduce(
      (acc, p) => acc + Number(p.horas_extras_min || 0),
      0
    );

    return {
      ativos,
      afastadosOuFerias,
      pctLgpd,
      folhaEstimada,
      horasExtrasFmt: `${Math.floor(totalHorasExtrasMin / 60)}h ${totalHorasExtrasMin % 60}m`,
    };
  }, [funcionarios, pontos]);

  const departamentosUnicos = useMemo(() => {
    const set = new Set<string>();
    cargos.forEach((c) => c.departamento && set.add(c.departamento));
    return Array.from(set);
  }, [cargos]);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      const cargo = extrairItem(f.cargos);
      const termo = busca.toLowerCase();
      const bateBusca =
        !termo ||
        f.matricula.toLowerCase().includes(termo) ||
        f.nome_completo.toLowerCase().includes(termo) ||
        (cargo?.nome || '').toLowerCase().includes(termo);
      const bateDepto = filtroDepto === 'todos' || cargo?.departamento === filtroDepto;
      const bateStatus = filtroStatus === 'todos' || f.status === filtroStatus;
      return bateBusca && bateDepto && bateStatus;
    });
  }, [funcionarios, busca, filtroDepto, filtroStatus]);

  const colaboradorPortal = useMemo(
    () => funcionarios.find((f) => f.id === colaboradorPortalId) || funcionarios[0],
    [funcionarios, colaboradorPortalId]
  );

  const dadosCsv = useMemo(
    () =>
      funcionariosFiltrados.map((f) => {
        const cargo = extrairItem(f.cargos);
        return {
          Matricula: f.matricula,
          Nome: f.nome_completo,
          Cargo: cargo?.nome || '-',
          Departamento: cargo?.departamento || '-',
          Contrato: f.tipo_contrato.toUpperCase(),
          Turno: f.turno_padrao || '-',
          Salario_Base_R$: Number(f.salario_atual).toFixed(2),
          LGPD_Concluido: f.treinamento_lgpd_concluido ? 'Sim' : 'Pendente',
          Status: f.status,
        };
      }),
    [funcionariosFiltrados]
  );

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.12 • Recursos Humanos & Departamento Pessoal"
        titulo="Gestão de Pessoas, Jornada Híbrida & Folha Prévia"
        descricao="Ciclo de vida funcional (dados fictícios), organograma, ponto híbrido (06h–20h), escalas, folha gerencial preliminar, PDI e Portal do Colaborador."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_rh_colaboradores.csv"
        textoBotaoNovo="Admitir Colaborador (Demo)"
        onNovoRegistro={() => {
          setFormCargoId(cargos[0]?.id || '');
          setFormSalario(Number(cargos[0]?.salario_base || 2800));
          setModalNovoFunc(true);
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
            <span>Colaboradores Ativos</span>
            <Users className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">{indicadores.ativos}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Férias / Afastados: {indicadores.afastadosOuFerias}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Folha Base Mensal Estimada</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            R$ {indicadores.folhaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Soma dos salários-base ativos
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Banco de Horas / Extras</span>
            <Clock className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">{indicadores.horasExtrasFmt}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Apurado nos registros de ponto híbrido
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Treinamento LGPD Admissional</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">
            {indicadores.pctLgpd.toFixed(0)}%
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Requisito obrigatório de privacidade
          </p>
        </div>
      </div>

      {/* Navegação por Abas Internas */}
      <div className="bg-white p-2 rounded-2xl border border-[#E8D4BC] flex flex-wrap gap-2">
        {[
          { id: 'colaboradores', label: 'Colaboradores & Ficha 360º', icon: Users },
          { id: 'organograma', label: 'Organograma & Cargos', icon: Network },
          { id: 'ponto', label: 'Ponto Híbrido & Ajustes', icon: Clock },
          { id: 'escalas', label: 'Escalas (06h–20h)', icon: Calendar },
          { id: 'folha', label: 'Folha Prévia Gerencial', icon: DollarSign },
          { id: 'desenvolvimento', label: 'PDI & Treinamentos', icon: Award },
          { id: 'portal', label: 'Portal do Colaborador', icon: UserCheck },
        ].map((tab) => {
          const Icone = tab.icon;
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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

      {/* ABA 1: COLABORADORES & FICHA 360 */}
      {abaAtiva === 'colaboradores' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC] flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por matrícula, nome ou cargo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8D4BC]"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={filtroDepto}
                onChange={(e) => setFiltroDepto(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white"
              >
                <option value="todos">Todos os Departamentos</option>
                {departamentosUnicos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white"
              >
                <option value="todos">Todas as Situações</option>
                <option value="ativo">Ativo</option>
                <option value="ferias">Férias</option>
                <option value="afastado">Afastado</option>
                <option value="desligado">Desligado</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                    <th className="py-3 px-4">Matrícula / Colaborador</th>
                    <th className="py-3 px-3">Cargo / Departamento</th>
                    <th className="py-3 px-3">Turno</th>
                    <th className="py-3 px-3">Salário-Base</th>
                    <th className="py-3 px-3">LGPD</th>
                    <th className="py-3 px-3">Situação</th>
                    <th className="py-3 px-4 text-right">Ficha 360º</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E8D8] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7F7269]">
                        Carregando colaboradores...
                      </td>
                    </tr>
                  ) : (
                    funcionariosFiltrados.map((f) => {
                      const cargo = extrairItem(f.cargos);
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setFichaColaborador(f)}
                          className="hover:bg-[#FBF5EE] cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#701D2B]">{f.matricula}</span>
                            <div className="font-semibold text-[#542C20]">
                              {f.nome_completo}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-[#542C20]">{cargo?.nome}</div>
                            <div className="text-[11px] text-[#7F7269]">
                              {cargo?.departamento}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#542C20]">
                            {f.turno_padrao || 'Comercial'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#542C20]">
                            R$ {Number(f.salario_atual).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            {f.treinamento_lgpd_concluido ? (
                              <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">Pendente</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                                f.status === 'ativo'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.status === 'ferias'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setFichaColaborador(f)}
                              className="px-3 py-1.5 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Abrir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ORGANOGRAMA & ESTRUTURA DE CARGOS */}
      {abaAtiva === 'organograma' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cargos.map((c) => {
            const ocupantes = funcionarios.filter(
              (f) => f.cargo_id === c.id && f.status === 'ativo'
            );
            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-[#C69A55]">
                    {c.departamento}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F5E8D8] text-[#542C20] text-[11px] font-semibold">
                    {ocupantes.length} ativo(s)
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#542C20]">{c.nome}</h3>
                <p className="text-xs text-[#7F7269]">
                  Piso Salarial Base: <strong>R$ {Number(c.salario_base).toFixed(2)}</strong>
                </p>
                <p className="text-xs text-[#542C20]/90">
                  {c.descricao_competencias ||
                    'Competências técnicas de pâtisserie, higiene BPF e atendimento.'}
                </p>
                <div className="pt-2 border-t border-[#F5E8D8] space-y-1">
                  {ocupantes.map((oc) => (
                    <div key={oc.id} className="text-xs font-medium text-[#701D2B]">
                      • {oc.matricula} — {oc.nome_completo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA 3: PONTO HÍBRIDO & TRATAMENTO DE INCONSISTÊNCIAS */}
      {abaAtiva === 'ponto' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Tipo Batida</th>
                  <th className="py-3 px-3">Origem Híbrida</th>
                  <th className="py-3 px-3">Extras</th>
                  <th className="py-3 px-3">Observação</th>
                  <th className="py-3 px-4 text-right">Gestor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8] text-xs">
                {pontos.map((p) => {
                  const func = extrairItem(p.funcionarios);
                  const pendenteAjuste = p.origem === 'app_simulado';
                  return (
                    <tr key={p.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-semibold text-[#542C20]">
                        {func?.matricula} — {func?.nome_completo}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(p.data_hora).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 uppercase font-medium">{p.tipo_batida}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.origem === 'relogio_fisico'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.origem === 'app_simulado'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.origem === 'relogio_fisico'
                            ? 'Relógio Físico'
                            : p.origem === 'app_simulado'
                            ? 'App Externo (Validar)'
                            : 'Ajuste Aprovado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#701D2B]">
                        +{p.horas_extras_min} min
                      </td>
                      <td className="py-3 px-3 text-[#7F7269] max-w-xs truncate">
                        {p.observacao}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {podeEditar() && pendenteAjuste && (
                          <button
                            onClick={() => aprovarAjustePonto(p)}
                            className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold"
                          >
                            Aprovar Ajuste
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

      {/* ABA 4: ESCALAS (OPERAÇÃO 06H ÀS 20H) */}
      {abaAtiva === 'escalas' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Entrada Prevista</th>
                  <th className="py-3 px-3">Saída Prevista</th>
                  <th className="py-3 px-3">Tipo de Dia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8] text-xs">
                {escalas.map((esc) => {
                  const func = extrairItem(esc.funcionarios);
                  return (
                    <tr key={esc.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-semibold text-[#542C20]">
                        {esc.data_trabalho.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3">
                        {func?.matricula} — {func?.nome_completo}
                      </td>
                      <td className="py-3 px-3">{esc.hora_entrada_prevista?.slice(0, 5)}</td>
                      <td className="py-3 px-3">{esc.hora_saida_prevista?.slice(0, 5)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                            esc.tipo_dia === 'normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {esc.tipo_dia}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5: FOLHA PRÉVIA GERENCIAL */}
      {abaAtiva === 'folha' && (
        <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                  <th className="py-3 px-4">Competência</th>
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Salário Base</th>
                  <th className="py-3 px-3">H. Extras</th>
                  <th className="py-3 px-3">Benefícios</th>
                  <th className="py-3 px-3">Líquido Estimado</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Validação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E8D8] text-xs">
                {folhas.map((fl) => {
                  const func = extrairItem(fl.funcionarios);
                  return (
                    <tr key={fl.id} className="hover:bg-[#FBF5EE]">
                      <td className="py-3 px-4 font-bold text-[#701D2B]">{fl.competencia}</td>
                      <td className="py-3 px-3">
                        {func?.matricula} — {func?.nome_completo}
                      </td>
                      <td className="py-3 px-3">R$ {Number(fl.salario_base).toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-700">
                        +R$ {Number(fl.adicionais_horas_extras).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">R$ {Number(fl.beneficios).toFixed(2)}</td>
                      <td className="py-3 px-3 font-bold text-[#542C20]">
                        R$ {Number(fl.liquido_estimado).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            fl.status === 'validada_externamente'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {fl.status === 'validada_externamente'
                            ? 'Validada Externamente'
                            : 'Prévia Calculada'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {podeEditar() && fl.status === 'calculada_preliminar' && (
                          <button
                            onClick={() => validarFolhaGerencial(fl)}
                            className="px-3 py-1 rounded-lg bg-[#701D2B] text-white text-[11px] font-semibold"
                          >
                            Marcar Validada
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

      {/* ABA 6: PDI & TREINAMENTOS */}
      {abaAtiva === 'desenvolvimento' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#542C20]">
              Trilhas de Treinamento & Conformidade LGPD/BPF
            </h3>
            {treinamentos.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-[#E8D4BC] bg-[#FBF5EE] text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#701D2B]">{t.codigo}</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E8D4BC] text-[10px] font-semibold uppercase">
                    {t.carga_horaria}h • {t.obrigatorio ? 'Obrigatório' : 'Eletivo'}
                  </span>
                </div>
                <p className="font-semibold text-[#542C20]">{t.titulo}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#542C20]">
              Avaliações Semestrais & PDI
            </h3>
            {avaliacoes.map((av) => {
              const func = extrairItem(av.funcionarios);
              return (
                <div
                  key={av.id}
                  className="p-3.5 rounded-xl border border-[#E8D4BC] bg-white text-xs space-y-1.5"
                >
                  <div className="flex justify-between">
                    <strong className="text-[#542C20]">
                      {func?.matricula} — {func?.nome_completo}
                    </strong>
                    <span className="font-bold text-emerald-700">
                      Nota: {Number(av.nota_geral).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <p className="text-[#7F7269]">
                    <strong>Pontos Fortes:</strong> {av.pontos_fortes}
                  </p>
                  <p className="text-[#701D2B]">
                    <strong>Meta PDI:</strong> {av.metas_pdi}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 7: PORTAL DO COLABORADOR (VISÃO RESTRITA INDIVIDUAL) */}
      {abaAtiva === 'portal' && colaboradorPortal && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8D4BC] space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8D4BC]">
            <div>
              <span className="text-[11px] font-bold uppercase text-[#C69A55]">
                Autoatendimento • Acesso Individual Autorizado
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#542C20]">
                Olá, {colaboradorPortal.nome_completo} ({colaboradorPortal.matricula})
              </h2>
            </div>

            <select
              value={colaboradorPortal.id}
              onChange={(e) => setColaboradorPortalId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE] font-semibold text-[#542C20]"
            >
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  Simular visão de: {f.matricula} — {f.nome_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <p className="font-bold text-[#701D2B]">Meus Dados Contratuais</p>
              <p className="mt-1">
                Cargo: <strong>{extrairItem(colaboradorPortal.cargos)?.nome}</strong>
              </p>
              <p>Turno: {colaboradorPortal.turno_padrao}</p>
              <p>Admissão: {colaboradorPortal.data_admissao.split('-').reverse().join('/')}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <p className="font-bold text-[#701D2B]">Demonstrativo Prévia (2026-11)</p>
              <p className="mt-1">
                Salário-Base:{' '}
                <strong>R$ {Number(colaboradorPortal.salario_atual).toFixed(2)}</strong>
              </p>
              <p>Vale-Alimentação / Benefícios: R$ 480,00</p>
              <p className="text-emerald-700 font-semibold mt-1">
                Certificado LGPD: Ativo
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
              <p className="font-bold text-[#701D2B]">Próximas Escalas</p>
              {escalas
                .filter((e) => e.funcionario_id === colaboradorPortal.id)
                .slice(0, 3)
                .map((e) => (
                  <p key={e.id} className="mt-1">
                    {e.data_trabalho.split('-').reverse().join('/')} •{' '}
                    {e.tipo_dia === 'folga'
                      ? 'Folga Semanal'
                      : `${e.hora_entrada_prevista.slice(0, 5)} às ${e.hora_saida_prevista.slice(0, 5)}`}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FICHA 360º DO COLABORADOR */}
      {fichaColaborador && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-5 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase text-[#C69A55] font-bold">
                  {fichaColaborador.matricula} • Dados Fictícios de Portfólio
                </span>
                <h3 className="font-serif text-xl font-bold">
                  {fichaColaborador.nome_completo}
                </h3>
              </div>
              <button onClick={() => setFichaColaborador(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs text-[#542C20]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7F7269]">Cargo / Departamento:</span>
                  <p className="font-bold">
                    {extrairItem(fichaColaborador.cargos)?.nome} (
                    {extrairItem(fichaColaborador.cargos)?.departamento})
                  </p>
                </div>
                <div>
                  <span className="text-[#7F7269]">Contrato / Admissão:</span>
                  <p className="font-bold uppercase">
                    {fichaColaborador.tipo_contrato} •{' '}
                    {fichaColaborador.data_admissao.split('-').reverse().join('/')}
                  </p>
                </div>
                <div>
                  <span className="text-[#7F7269]">CPF Fictício:</span>
                  <p className="font-semibold">{fichaColaborador.cpf_ficticio}</p>
                </div>
                <div>
                  <span className="text-[#7F7269]">Salário-Base Atual:</span>
                  <p className="font-bold text-[#701D2B]">
                    R$ {Number(fichaColaborador.salario_atual).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMISSÃO DE NOVO COLABORADOR FICTÍCIO */}
      {modalNovoFunc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8D4BC] overflow-hidden">
            <div className="p-4 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C69A55]" />
                Admitir Colaborador Fictício
              </h3>
              <button onClick={() => setModalNovoFunc(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoColaborador} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#542C20]">Nome Completo (Fictício) *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Lucas Mendes Duarte"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Cargo *</label>
                  <select
                    required
                    value={formCargoId}
                    onChange={(e) => {
                      setFormCargoId(e.target.value);
                      const c = cargos.find((x) => x.id === e.target.value);
                      if (c) setFormSalario(Number(c.salario_base));
                    }}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.departamento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#542C20]">Tipo de Contrato *</label>
                  <select
                    value={formContrato}
                    onChange={(e) => setFormContrato(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="clt">CLT</option>
                    <option value="estagio">Estágio</option>
                    <option value="aprendiz">Aprendiz</option>
                    <option value="temporario">Temporário</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Salário-Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSalario}
                    onChange={(e) => setFormSalario(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Turno Padrão</label>
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="Manhã (06:00 - 14:20)">Manhã (06:00 - 14:20)</option>
                    <option value="Tarde/Noite (11:30 - 20:00)">
                      Tarde/Noite (11:30 - 20:00)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoFunc(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold"
                >
                  {salvando ? 'Admitindo...' : 'Concluir Admissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosHumanosPage;