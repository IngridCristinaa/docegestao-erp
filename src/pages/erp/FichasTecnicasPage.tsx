import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Calculator,
  AlertTriangle,
  History,
  Save,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

interface Produto {
  id: string;
  codigo_sku: string;
  nome: string;
  tipo_produto: string;
  unidade_medida_id: string;
  preco_salao_balcao: number;
  preco_delivery: number;
  preco_encomenda: number;
  custo_unitario_atual: number;
  validade_dias: number;
  alergenicos: string[] | null;
}

interface Ingrediente {
  id: string;
  codigo: string;
  nome: string;
  unidade_medida_id: string;
  custo_medio: number;
  alergenico: boolean;
  alergenicos_detalhe: string[] | null;
}

interface FichaItem {
  id?: string;
  ficha_tecnica_id?: string;
  ingrediente_id: string;
  quantidade_bruta: number;
  quantidade_liquida: number;
  unidade_medida_id: string;
  custo_calculado: number;
  ordem_adicao: number;
  ingredientes?: { codigo: string; nome: string; custo_medio: number };
}

interface FichaVersao {
  id: string;
  numero_versao: number;
  motivo_alteracao: string | null;
  created_at: string;
}

interface FichaTecnica {
  id: string;
  produto_id: string;
  versao_atual: number;
  rendimento_qtd: number;
  unidade_rendimento_id: string;
  peso_final_gramas: number;
  tempo_preparo_min: number;
  fator_perda_percentual: number;
  modo_preparo: string;
  instrucoes_armazenamento: string | null;
  custo_total_receita: number;
  margem_alvo_percentual: number;
  status: 'rascunho' | 'aprovada' | 'obsoleta';
  updated_at: string;
  produtos?: Produto;
}

export const FichasTecnicasPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Drawer / Modal de Detalhe & Edição de Ficha Existente
  const [fichaSelecionada, setFichaSelecionada] = useState<FichaTecnica | null>(null);
  const [itensFichaAberta, setItensFichaAberta] = useState<FichaItem[]>([]);
  const [versoesFichaAberta, setVersoesFichaAberta] = useState<FichaVersao[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [motivoNovaVersao, setMotivoNovaVersao] = useState('');

  // Modal de Cadastro de Nova Ficha Técnica
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formProdutoId, setFormProdutoId] = useState('');
  const [formRendimento, setFormRendimento] = useState<number>(10);
  const [formPesoFinal, setFormPesoFinal] = useState<number>(1200);
  const [formTempoPreparo, setFormTempoPreparo] = useState<number>(45);
  const [formFatorPerda, setFormFatorPerda] = useState<number>(3.5);
  const [formMargemAlvo, setFormMargemAlvo] = useState<number>(68);
  const [formStatus, setFormStatus] = useState<'rascunho' | 'aprovada'>('aprovada');
  const [formModoPreparo, setFormModoPreparo] = useState(
    '1. Pesar todos os insumos conforme mise en place padronizada.\n2. Executar emulsão/mistura base respeitando curva térmica da receita.\n3. Porcionar em moldes padronizados e finalizar conforme padrão visual DoceGestão.'
  );
  const [formArmazenamento, setFormArmazenamento] = useState(
    'Conservar sob refrigeração controlada entre 2°C e 5°C por até 48h.'
  );
  const [formItens, setFormItens] = useState<FichaItem[]>([]);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resFichas, resProdutos, resIngredientes] = await Promise.all([
        supabase
          .from('fichas_tecnicas')
          .select('*, produtos(*)')
          .order('updated_at', { ascending: false }),
        supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true)
          .order('codigo_sku', { ascending: true }),
        supabase
          .from('ingredientes')
          .select('*')
          .eq('ativo', true)
          .order('nome', { ascending: true }),
      ]);

      if (resFichas.error) throw resFichas.error;
      if (resProdutos.error) throw resProdutos.error;
      if (resIngredientes.error) throw resIngredientes.error;

      setFichas((resFichas.data as FichaTecnica[]) || []);
      setProdutos((resProdutos.data as Produto[]) || []);
      setIngredientes((resIngredientes.data as Ingrediente[]) || []);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar fichas técnicas do Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Abrir ficha existente (carrega itens + histórico de versões)
  const abrirFichaExistente = async (ficha: FichaTecnica, iniciarEdicao = false) => {
    setFichaSelecionada(ficha);
    setModoEdicao(iniciarEdicao);
    setMotivoNovaVersao('');
    setCarregandoDetalhe(true);

    // Preenche estados de edição com os valores atuais da ficha
    setFormRendimento(Number(ficha.rendimento_qtd));
    setFormPesoFinal(Number(ficha.peso_final_gramas));
    setFormTempoPreparo(Number(ficha.tempo_preparo_min));
    setFormFatorPerda(Number(ficha.fator_perda_percentual));
    setFormMargemAlvo(Number(ficha.margem_alvo_percentual));
    setFormStatus(ficha.status === 'rascunho' ? 'rascunho' : 'aprovada');
    setFormModoPreparo(ficha.modo_preparo || '');
    setFormArmazenamento(ficha.instrucoes_armazenamento || '');

    try {
      const [resItens, resVersoes] = await Promise.all([
        supabase
          .from('ficha_tecnica_itens')
          .select('*, ingredientes(codigo, nome, custo_medio)')
          .eq('ficha_tecnica_id', ficha.id)
          .order('ordem_adicao', { ascending: true }),
        supabase
          .from('fichas_tecnicas_versoes')
          .select('*')
          .eq('ficha_tecnica_id', ficha.id)
          .order('numero_versao', { ascending: false }),
      ]);

      const itensCarregados = (resItens.data as FichaItem[]) || [];
      setItensFichaAberta(itensCarregados);
      setFormItens(itensCarregados);
      setVersoesFichaAberta((resVersoes.data as FichaVersao[]) || []);
    } catch (e: any) {
      setErro(e.message || 'Erro ao abrir detalhamento da ficha.');
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  // Preparar modal de Nova Ficha Técnica
  const abrirModalNovaFicha = () => {
    const produtosSemFicha = produtos.filter(
      (p) => !fichas.some((f) => f.produto_id === p.id)
    );
    const produtoPadrao = produtosSemFicha[0] || produtos[0];
    setFormProdutoId(produtoPadrao?.id || '');
    setFormRendimento(10);
    setFormPesoFinal(1200);
    setFormTempoPreparo(45);
    setFormFatorPerda(3.5);
    setFormMargemAlvo(68);
    setFormStatus('aprovada');
    setFormModoPreparo(
      '1. Realizar mise en place pesando cada insumo com precisão de balança digital.\n2. Executar preparo térmico/emulsão conforme padrão técnico da pâtisserie.\n3. Porcionar, finalizar e identificar lote com validade.'
    );
    setFormArmazenamento('Armazenar entre 2°C e 5°C em recipiente fechado.');

    if (ingredientes.length > 0) {
      const primeiroIng = ingredientes[0];
      setFormItens([
        {
          ingrediente_id: primeiroIng.id,
          quantidade_bruta: 250,
          quantidade_liquida: 240,
          unidade_medida_id: primeiroIng.unidade_medida_id,
          custo_calculado: Number((250 * Number(primeiroIng.custo_medio)).toFixed(2)),
          ordem_adicao: 1,
        },
      ]);
    } else {
      setFormItens([]);
    }
    setModalNovaAberto(true);
  };

  const adicionarLinhaIngrediente = () => {
    if (ingredientes.length === 0) return;
    const ing = ingredientes[0];
    setFormItens((prev) => [
      ...prev,
      {
        ingrediente_id: ing.id,
        quantidade_bruta: 100,
        quantidade_liquida: 95,
        unidade_medida_id: ing.unidade_medida_id,
        custo_calculado: Number((100 * Number(ing.custo_medio)).toFixed(2)),
        ordem_adicao: prev.length + 1,
      },
    ]);
  };

  const atualizarLinhaIngrediente = (
    idx: number,
    campo: 'ingrediente_id' | 'quantidade_bruta' | 'quantidade_liquida',
    valor: string | number
  ) => {
    setFormItens((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const atualizado = { ...item, [campo]: valor };
        const ing = ingredientes.find((x) => x.id === atualizado.ingrediente_id);
        if (ing) {
          atualizado.unidade_medida_id = ing.unidade_medida_id;
          atualizado.custo_calculado = Number(
            (Number(atualizado.quantidade_bruta || 0) * Number(ing.custo_medio || 0)).toFixed(2)
          );
        }
        return atualizado;
      })
    );
  };

  const removerLinhaIngrediente = (idx: number) => {
    setFormItens((prev) => prev.filter((_, i) => i !== idx));
  };

  const custoTotalFormulario = useMemo(
    () => formItens.reduce((acc, item) => acc + Number(item.custo_calculado || 0), 0),
    [formItens]
  );

  const custoUnitarioFormulario = useMemo(
    () => (formRendimento > 0 ? custoTotalFormulario / formRendimento : 0),
    [custoTotalFormulario, formRendimento]
  );

  // Salvar Nova Ficha Técnica no Supabase
  const salvarNovaFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdutoId) return;
    const prod = produtos.find((p) => p.id === formProdutoId);
    if (!prod) return;

    setSalvando(true);
    setErro(null);
    try {
      const { data: novaFicha, error: errFicha } = await supabase
        .from('fichas_tecnicas')
        .insert({
          produto_id: prod.id,
          versao_atual: 1,
          rendimento_qtd: Number(formRendimento),
          unidade_rendimento_id: prod.unidade_medida_id,
          peso_final_gramas: Number(formPesoFinal),
          tempo_preparo_min: Number(formTempoPreparo),
          fator_perda_percentual: Number(formFatorPerda),
          modo_preparo: formModoPreparo,
          instrucoes_armazenamento: formArmazenamento,
          custo_total_receita: Number(custoTotalFormulario.toFixed(2)),
          margem_alvo_percentual: Number(formMargemAlvo),
          status: formStatus,
        })
        .select()
        .single();

      if (errFicha) throw errFicha;

      if (formItens.length > 0 && novaFicha) {
        const payloadItens = formItens.map((it, idx) => ({
          ficha_tecnica_id: novaFicha.id,
          ingrediente_id: it.ingrediente_id,
          quantidade_bruta: Number(it.quantidade_bruta),
          quantidade_liquida: Number(it.quantidade_liquida),
          unidade_medida_id: it.unidade_medida_id || prod.unidade_medida_id,
          custo_calculado: Number(it.custo_calculado),
          ordem_adicao: idx + 1,
        }));

        const { error: errItens } = await supabase
          .from('ficha_tecnica_itens')
          .insert(payloadItens);
        if (errItens) throw errItens;
      }

      // Atualiza custo unitário atual do produto e grava snapshot v1
      await Promise.all([
        supabase
          .from('produtos')
          .update({ custo_unitario_atual: Number(custoUnitarioFormulario.toFixed(2)) })
          .eq('id', prod.id),
        supabase.from('fichas_tecnicas_versoes').insert({
          ficha_tecnica_id: novaFicha.id,
          numero_versao: 1,
          snapshot_json: {
            sku: prod.codigo_sku,
            produto: prod.nome,
            rendimento: formRendimento,
            custo_total: custoTotalFormulario,
            itens: formItens,
          },
          motivo_alteracao: 'Criação de nova ficha técnica na Engenharia de Cardápio',
        }),
      ]);

      setModalNovaAberto(false);
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar nova ficha técnica.');
    } finally {
      setSalvando(false);
    }
  };

  // Salvar Revisão / Nova Versão de Ficha Existente
  const salvarEdicaoFichaExistente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaSelecionada) return;

    setSalvando(true);
    setErro(null);
    try {
      const proximaVersao = Number(fichaSelecionada.versao_atual || 1) + 1;

      const { error: errUpd } = await supabase
        .from('fichas_tecnicas')
        .update({
          versao_atual: proximaVersao,
          rendimento_qtd: Number(formRendimento),
          peso_final_gramas: Number(formPesoFinal),
          tempo_preparo_min: Number(formTempoPreparo),
          fator_perda_percentual: Number(formFatorPerda),
          modo_preparo: formModoPreparo,
          instrucoes_armazenamento: formArmazenamento,
          custo_total_receita: Number(custoTotalFormulario.toFixed(2)),
          margem_alvo_percentual: Number(formMargemAlvo),
          status: formStatus,
        })
        .eq('id', fichaSelecionada.id);

      if (errUpd) throw errUpd;

      // Substitui itens da ficha atual e registra histórico da versão
      await supabase
        .from('ficha_tecnica_itens')
        .delete()
        .eq('ficha_tecnica_id', fichaSelecionada.id);

      if (formItens.length > 0) {
        await supabase.from('ficha_tecnica_itens').insert(
          formItens.map((it, idx) => ({
            ficha_tecnica_id: fichaSelecionada.id,
            ingrediente_id: it.ingrediente_id,
            quantidade_bruta: Number(it.quantidade_bruta),
            quantidade_liquida: Number(it.quantidade_liquida),
            unidade_medida_id: it.unidade_medida_id,
            custo_calculado: Number(it.custo_calculado),
            ordem_adicao: idx + 1,
          }))
        );
      }

      await Promise.all([
        supabase
          .from('produtos')
          .update({ custo_unitario_atual: Number(custoUnitarioFormulario.toFixed(2)) })
          .eq('id', fichaSelecionada.produto_id),
        supabase.from('fichas_tecnicas_versoes').insert({
          ficha_tecnica_id: fichaSelecionada.id,
          numero_versao: proximaVersao,
          snapshot_json: {
            rendimento: formRendimento,
            custo_total: custoTotalFormulario,
            status: formStatus,
            itens: formItens,
          },
          motivo_alteracao:
            motivoNovaVersao.trim() || `Revisão técnica v${proximaVersao} aprovada`,
        }),
      ]);

      setModoEdicao(false);
      await carregarDados();
      const atualizada = {
        ...fichaSelecionada,
        versao_atual: proximaVersao,
        rendimento_qtd: formRendimento,
        peso_final_gramas: formPesoFinal,
        tempo_preparo_min: formTempoPreparo,
        fator_perda_percentual: formFatorPerda,
        modo_preparo: formModoPreparo,
        instrucoes_armazenamento: formArmazenamento,
        custo_total_receita: custoTotalFormulario,
        margem_alvo_percentual: formMargemAlvo,
        status: formStatus,
      };
      await abrirFichaExistente(atualizada, false);
    } catch (e: any) {
      setErro(e.message || 'Erro ao atualizar versão da ficha técnica.');
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem e KPIs dinâmicos
  const fichasFiltradas = useMemo(() => {
    return fichas.filter((f) => {
      const sku = f.produtos?.codigo_sku?.toLowerCase() || '';
      const nome = f.produtos?.nome?.toLowerCase() || '';
      const tipo = f.produtos?.tipo_produto?.toLowerCase() || '';
      const termo = busca.toLowerCase();

      const bateBusca = !termo || sku.includes(termo) || nome.includes(termo);
      const bateCat =
        filtroCategoria === 'todos' || tipo.includes(filtroCategoria.toLowerCase());
      const bateStatus = filtroStatus === 'todos' || f.status === filtroStatus;

      return bateBusca && bateCat && bateStatus;
    });
  }, [fichas, busca, filtroCategoria, filtroStatus]);

  const indicadores = useMemo(() => {
    const total = fichas.length;
    const aprovadas = fichas.filter((f) => f.status === 'aprovada').length;
    const rascunhos = fichas.filter((f) => f.status === 'rascunho').length;

    const margens = fichas
      .map((f) => {
        const preco = Number(f.produtos?.preco_salao_balcao || 0);
        const custoUnit =
          Number(f.rendimento_qtd) > 0
            ? Number(f.custo_total_receita) / Number(f.rendimento_qtd)
            : 0;
        if (preco <= 0) return 0;
        return ((preco - custoUnit) / preco) * 100;
      })
      .filter((m) => m > 0);

    const margemMedia =
      margens.length > 0 ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;

    return { total, aprovadas, rascunhos, margemMedia };
  }, [fichas]);

  const dadosCsv = useMemo(
    () =>
      fichasFiltradas.map((f) => {
        const custoUnit =
          Number(f.rendimento_qtd) > 0
            ? Number(f.custo_total_receita) / Number(f.rendimento_qtd)
            : 0;
        const precoSalao = Number(f.produtos?.preco_salao_balcao || 0);
        const margem =
          precoSalao > 0 ? (((precoSalao - custoUnit) / precoSalao) * 100).toFixed(1) : '0.0';
        return {
          SKU: f.produtos?.codigo_sku || '-',
          Produto: f.produtos?.nome || '-',
          Versao: `v${f.versao_atual}`,
          Rendimento: f.rendimento_qtd,
          Custo_Receita_R$: Number(f.custo_total_receita).toFixed(2),
          Custo_Unitario_R$: custoUnit.toFixed(2),
          Preco_Salao_R$: precoSalao.toFixed(2),
          Preco_Delivery_R$: Number(f.produtos?.preco_delivery || 0).toFixed(2),
          Margem_Salao_Pct: `${margem}%`,
          Status: f.status,
        };
      }),
    [fichasFiltradas]
  );

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.8 • Engenharia de Cardápio & Custos"
        titulo="Fichas Técnicas & Receitas"
        descricao="Composição padronizada com fator de correção, versionamento técnico, formação de preços por canal e controle de alergênicos."
        dadosExportacao={dadosCsv}
        nomeArquivoCsv="docegestao_fichas_tecnicas.csv"
        textoBotaoNovo="Nova Ficha Técnica"
        onNovoRegistro={abrirModalNovaFicha}
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
            <span>Fichas Cadastradas</span>
            <Layers className="w-4 h-4 text-[#701D2B]" />
          </div>
          <p className="text-2xl font-bold text-[#542C20] mt-1">{indicadores.total}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            De {produtos.length} SKUs ativos no catálogo
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Fichas Aprovadas (PCP)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{indicadores.aprovadas}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Liberadas para ordens de produção
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Em Revisão / Rascunho</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{indicadores.rascunhos}</p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Aguardando homologação do Chef
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between text-xs text-[#7F7269]">
            <span>Margem Bruta Média (Salão)</span>
            <Calculator className="w-4 h-4 text-[#C69A55]" />
          </div>
          <p className="text-2xl font-bold text-[#701D2B] mt-1">
            {indicadores.margemMedia.toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#7F7269] mt-1">
            Cálculo: (Preço Salão − CMV) / Preço
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8D4BC] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por SKU ou nome do produto..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8D4BC] focus:outline-none focus:border-[#701D2B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white text-[#542C20]"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="confeitaria">Confeitaria</option>
            <option value="cafeteria">Cafeteria</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E8D4BC] bg-white text-[#542C20]"
          >
            <option value="todos">Todos os Status</option>
            <option value="aprovada">Aprovada</option>
            <option value="rascunho">Rascunho</option>
            <option value="obsoleta">Obsoleta</option>
          </select>
        </div>
      </div>

      {/* Tabela Principal de Fichas Técnicas */}
      <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5E8D8]/60 border-b border-[#E8D4BC] text-[11px] uppercase tracking-wider text-[#542C20]">
                <th className="py-3 px-4">SKU / Produto</th>
                <th className="py-3 px-3">Versão</th>
                <th className="py-3 px-3">Rendimento</th>
                <th className="py-3 px-3">Custo Unit.</th>
                <th className="py-3 px-3">Salão / Delivery</th>
                <th className="py-3 px-3">Margem Salão</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5E8D8] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#7F7269]">
                    Carregando fichas técnicas do Supabase...
                  </td>
                </tr>
              ) : fichasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#7F7269]">
                    Nenhuma ficha técnica encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                fichasFiltradas.map((f) => {
                  const custoUnit =
                    Number(f.rendimento_qtd) > 0
                      ? Number(f.custo_total_receita) / Number(f.rendimento_qtd)
                      : 0;
                  const precoSalao = Number(f.produtos?.preco_salao_balcao || 0);
                  const precoDelivery = Number(f.produtos?.preco_delivery || 0);
                  const margem =
                    precoSalao > 0 ? ((precoSalao - custoUnit) / precoSalao) * 100 : 0;
                  const abaixoMeta = margem < Number(f.margem_alvo_percentual || 60);

                  return (
                    <tr
                      key={f.id}
                      onClick={() => abrirFichaExistente(f, false)}
                      className="hover:bg-[#FBF5EE] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#701D2B]">
                          {f.produtos?.codigo_sku || 'SKU'}
                        </div>
                        <div className="font-medium text-[#542C20]">
                          {f.produtos?.nome || 'Produto sem vínculo'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F5E8D8] text-[#542C20] font-semibold">
                          v{f.versao_atual}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#542C20]">
                        {f.rendimento_qtd} un ({f.peso_final_gramas}g)
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#542C20]">
                        R$ {custoUnit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-[#542C20]">
                        <div>Salão: R$ {precoSalao.toFixed(2)}</div>
                        <div className="text-[11px] text-[#7F7269]">
                          Delivery: R$ {precoDelivery.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold ${
                            abaixoMeta ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {margem.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            f.status === 'aprovada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.status === 'rascunho'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {f.status === 'aprovada'
                            ? 'Aprovada'
                            : f.status === 'rascunho'
                            ? 'Rascunho'
                            : 'Obsoleta'}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => abrirFichaExistente(f, false)}
                          className="px-3 py-1.5 rounded-lg bg-[#701D2B] hover:bg-[#53131E] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Abrir Ficha
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

      {/* DRAWER / MODAL DE VISUALIZAÇÃO E EDIÇÃO DE FICHA EXISTENTE */}
      {fichaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="bg-white w-full max-w-3xl h-full overflow-y-auto shadow-2xl border-l border-[#E8D4BC] flex flex-col">
            <div className="p-5 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#C69A55] font-bold">
                  {fichaSelecionada.produtos?.codigo_sku} • Versão v
                  {fichaSelecionada.versao_atual}
                </span>
                <h2 className="font-serif text-2xl font-bold">
                  {fichaSelecionada.produtos?.nome}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {podeEditar() && !modoEdicao && (
                  <button
                    onClick={() => setModoEdicao(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#C69A55] text-[#542C20] text-xs font-bold hover:brightness-105"
                  >
                    Nova Versão / Editar
                  </button>
                )}
                <button
                  onClick={() => setFichaSelecionada(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {carregandoDetalhe ? (
              <div className="p-8 text-center text-xs text-[#7F7269]">
                Carregando composição de ingredientes e versões...
              </div>
            ) : modoEdicao ? (
              <form onSubmit={salvarEdicaoFichaExistente} className="p-6 space-y-5 text-xs">
                <div className="bg-[#FBF5EE] p-4 rounded-xl border border-[#E8D4BC]">
                  <p className="font-bold text-[#701D2B]">
                    Criando Revisão Técnica v{Number(fichaSelecionada.versao_atual) + 1}
                  </p>
                  <p className="text-[#7F7269] mt-0.5">
                    Ordens de produção já concluídas mantêm o snapshot da versão anterior.
                  </p>
                  <input
                    type="text"
                    required
                    value={motivoNovaVersao}
                    onChange={(e) => setMotivoNovaVersao(e.target.value)}
                    placeholder="Motivo da revisão (ex: Ajuste de gramatura de chocolate 70%)"
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-[#542C20]">Rendimento (un)</label>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={formRendimento}
                      onChange={(e) => setFormRendimento(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#542C20]">Peso Final (g)</label>
                    <input
                      type="number"
                      min={1}
                      value={formPesoFinal}
                      onChange={(e) => setFormPesoFinal(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#542C20]">Tempo Preparo (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={formTempoPreparo}
                      onChange={(e) => setFormTempoPreparo(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#542C20]">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) =>
                        setFormStatus(e.target.value as 'rascunho' | 'aprovada')
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                    >
                      <option value="aprovada">Aprovada</option>
                      <option value="rascunho">Rascunho</option>
                    </select>
                  </div>
                </div>

                {/* Lista Editável de Ingredientes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#542C20]">
                      Composição de Ingredientes
                    </span>
                    <button
                      type="button"
                      onClick={adicionarLinhaIngrediente}
                      className="px-2.5 py-1 rounded bg-[#701D2B] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formItens.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-[#FBF5EE] p-2 rounded-lg border border-[#E8D4BC]"
                      >
                        <select
                          value={item.ingrediente_id}
                          onChange={(e) =>
                            atualizarLinhaIngrediente(idx, 'ingrediente_id', e.target.value)
                          }
                          className="col-span-5 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                        >
                          {ingredientes.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.codigo} - {ing.nome}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantidade_bruta}
                          onChange={(e) =>
                            atualizarLinhaIngrediente(
                              idx,
                              'quantidade_bruta',
                              Number(e.target.value)
                            )
                          }
                          placeholder="Qtd Bruta"
                          className="col-span-2 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantidade_liquida}
                          onChange={(e) =>
                            atualizarLinhaIngrediente(
                              idx,
                              'quantidade_liquida',
                              Number(e.target.value)
                            )
                          }
                          placeholder="Qtd Líq."
                          className="col-span-2 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                        />
                        <div className="col-span-2 font-semibold text-right text-[#542C20]">
                          R$ {Number(item.custo_calculado).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removerLinhaIngrediente(idx)}
                          className="col-span-1 text-red-600 flex justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#542C20]">
                    Modo de Preparo Padronizado
                  </label>
                  <textarea
                    rows={4}
                    value={formModoPreparo}
                    onChange={(e) => setFormModoPreparo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8D4BC]">
                  <div className="text-[#542C20]">
                    Custo Total Receita:{' '}
                    <strong>R$ {custoTotalFormulario.toFixed(2)}</strong> • Unitário:{' '}
                    <strong>R$ {custoUnitarioFormulario.toFixed(2)}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModoEdicao(false)}
                      className="px-4 py-2 rounded-lg border border-[#E8D4BC]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={salvando}
                      className="px-4 py-2 rounded-lg bg-[#701D2B] text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {salvando ? 'Salvando...' : 'Publicar Nova Versão'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* MODO VISUALIZAÇÃO DETALHADA DA FICHA EXISTENTE */
              <div className="p-6 space-y-6 text-xs">
                {/* Resumo Técnico e Financeiro */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                    <span className="text-[#7F7269]">Rendimento</span>
                    <p className="text-base font-bold text-[#542C20] mt-0.5">
                      {fichaSelecionada.rendimento_qtd} un
                    </p>
                    <span className="text-[11px] text-[#7F7269]">
                      Peso final: {fichaSelecionada.peso_final_gramas}g
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                    <span className="text-[#7F7269]">Tempo & Perda</span>
                    <p className="text-base font-bold text-[#542C20] mt-0.5">
                      {fichaSelecionada.tempo_preparo_min} min
                    </p>
                    <span className="text-[11px] text-[#7F7269]">
                      Perda técnica: {fichaSelecionada.fator_perda_percentual}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                    <span className="text-[#7F7269]">Custo Total / Unit.</span>
                    <p className="text-base font-bold text-[#701D2B] mt-0.5">
                      R$ {Number(fichaSelecionada.custo_total_receita).toFixed(2)}
                    </p>
                    <span className="text-[11px] text-[#7F7269]">
                      Unit.: R${' '}
                      {(
                        Number(fichaSelecionada.custo_total_receita) /
                        Math.max(1, Number(fichaSelecionada.rendimento_qtd))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FBF5EE] border border-[#E8D4BC]">
                    <span className="text-[#7F7269]">Preços por Canal</span>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      Salão: R$ {Number(fichaSelecionada.produtos?.preco_salao_balcao || 0).toFixed(2)}
                    </p>
                    <span className="text-[11px] text-[#542C20]">
                      Delivery: R$ {Number(fichaSelecionada.produtos?.preco_delivery || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tabela de Ingredientes */}
                <div>
                  <h3 className="font-serif text-base font-bold text-[#542C20] mb-2 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-[#701D2B]" />
                    Composição de Insumos (Fator de Correção Bruto vs. Líquido)
                  </h3>
                  <div className="border border-[#E8D4BC] rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#F5E8D8]/70 text-[#542C20] text-[11px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Ordem</th>
                          <th className="py-2 px-3">Insumo</th>
                          <th className="py-2 px-3">Qtd Bruta</th>
                          <th className="py-2 px-3">Qtd Líquida</th>
                          <th className="py-2 px-3 text-right">Custo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5E8D8]">
                        {itensFichaAberta.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-[#7F7269]">
                              Nenhum insumo vinculado a esta versão.
                            </td>
                          </tr>
                        ) : (
                          itensFichaAberta.map((item) => (
                            <tr key={item.id || item.ordem_adicao}>
                              <td className="py-2 px-3 font-semibold">#{item.ordem_adicao}</td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-[#701D2B]">
                                  {item.ingredientes?.codigo}
                                </span>{' '}
                                — {item.ingredientes?.nome}
                              </td>
                              <td className="py-2 px-3">{item.quantidade_bruta}</td>
                              <td className="py-2 px-3">{item.quantidade_liquida}</td>
                              <td className="py-2 px-3 text-right font-semibold">
                                R$ {Number(item.custo_calculado).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modo de Preparo e Conservação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#E8D4BC] bg-white">
                    <h4 className="font-bold text-[#542C20] mb-1.5">
                      Modo de Preparo Padronizado
                    </h4>
                    <p className="whitespace-pre-line text-[#542C20]/90 leading-relaxed">
                      {fichaSelecionada.modo_preparo}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E8D4BC] bg-[#FBF5EE]">
                    <h4 className="font-bold text-[#542C20] mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Conservação & Alergênicos
                    </h4>
                    <p className="text-[#542C20]/90">
                      {fichaSelecionada.instrucoes_armazenamento ||
                        'Seguir padrão POP-002 de cadeia fria.'}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[#E8D4BC]">
                      <span className="font-semibold text-[#701D2B]">
                        Validade comercial:{' '}
                      </span>
                      {fichaSelecionada.produtos?.validade_dias || 3} dias
                    </div>
                  </div>
                </div>

                {/* Histórico de Versões */}
                <div>
                  <h4 className="font-bold text-[#542C20] mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#701D2B]" />
                    Histórico de Versionamento Auditável
                  </h4>
                  <div className="space-y-2">
                    {versoesFichaAberta.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg border border-[#E8D4BC] flex items-center justify-between bg-white"
                      >
                        <div>
                          <span className="font-bold text-[#701D2B]">
                            Versão v{v.numero_versao}
                          </span>{' '}
                          — <span>{v.motivo_alteracao || 'Atualização técnica'}</span>
                        </div>
                        <span className="text-[11px] text-[#7F7269]">
                          {new Date(v.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO DE NOVA FICHA TÉCNICA */}
      {modalNovaAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-[#E8D4BC]">
            <div className="p-5 bg-[#701D2B] text-[#F5E8D8] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C69A55]" />
                <h2 className="font-serif text-xl font-bold">
                  Cadastrar Nova Ficha Técnica
                </h2>
              </div>
              <button
                onClick={() => setModalNovaAberto(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarNovaFicha} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#542C20]">Produto (SKU) *</label>
                  <select
                    required
                    value={formProdutoId}
                    onChange={(e) => setFormProdutoId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo_sku} — {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#542C20]">Status Inicial *</label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'rascunho' | 'aprovada')
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    <option value="aprovada">Aprovada (Liberar para PCP)</option>
                    <option value="rascunho">Rascunho (Em testes de cozinha)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-[#542C20]">Rendimento (un) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="0.01"
                    value={formRendimento}
                    onChange={(e) => setFormRendimento(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Peso Final (g) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPesoFinal}
                    onChange={(e) => setFormPesoFinal(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Preparo (min) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formTempoPreparo}
                    onChange={(e) => setFormTempoPreparo(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">Perda Técnica (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formFatorPerda}
                    onChange={(e) => setFormFatorPerda(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              {/* Ingredientes da Nova Ficha */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#542C20]">
                    Ingredientes da Receita (Cálculo Automático de CMV)
                  </span>
                  <button
                    type="button"
                    onClick={adicionarLinhaIngrediente}
                    className="px-3 py-1 rounded-lg bg-[#701D2B] text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
                  </button>
                </div>

                <div className="space-y-2">
                  {formItens.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-[#FBF5EE] p-2 rounded-lg border border-[#E8D4BC]"
                    >
                      <select
                        value={item.ingrediente_id}
                        onChange={(e) =>
                          atualizarLinhaIngrediente(idx, 'ingrediente_id', e.target.value)
                        }
                        className="col-span-5 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                      >
                        {ingredientes.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.codigo} — {ing.nome}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={item.quantidade_bruta}
                        onChange={(e) =>
                          atualizarLinhaIngrediente(
                            idx,
                            'quantidade_bruta',
                            Number(e.target.value)
                          )
                        }
                        placeholder="Bruta"
                        className="col-span-2 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={item.quantidade_liquida}
                        onChange={(e) =>
                          atualizarLinhaIngrediente(
                            idx,
                            'quantidade_liquida',
                            Number(e.target.value)
                          )
                        }
                        placeholder="Líquida"
                        className="col-span-2 px-2 py-1.5 rounded border border-[#E8D4BC] bg-white"
                      />
                      <div className="col-span-2 text-right font-semibold text-[#542C20]">
                        R$ {Number(item.custo_calculado).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerLinhaIngrediente(idx)}
                        className="col-span-1 text-red-600 flex justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#542C20]">Modo de Preparo *</label>
                  <textarea
                    required
                    rows={3}
                    value={formModoPreparo}
                    onChange={(e) => setFormModoPreparo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#542C20]">
                    Conservação & Temperatura
                  </label>
                  <textarea
                    rows={3}
                    value={formArmazenamento}
                    onChange={(e) => setFormArmazenamento(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-[#E8D4BC]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5E8D8]/60 border border-[#E8D4BC] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[#7F7269]">Custo Total da Receita: </span>
                  <strong className="text-sm text-[#701D2B]">
                    R$ {custoTotalFormulario.toFixed(2)}
                  </strong>
                  <span className="mx-2 text-[#A99B91]">|</span>
                  <span className="text-[#7F7269]">Custo Unitário Calculado: </span>
                  <strong className="text-sm text-[#542C20]">
                    R$ {custoUnitarioFormulario.toFixed(2)}
                  </strong>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNovaAberto(false)}
                    className="px-4 py-2 rounded-lg border border-[#E8D4BC] bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 py-2 rounded-lg bg-[#701D2B] hover:bg-[#53131E] text-white font-semibold"
                  >
                    {salvando ? 'Gravando...' : 'Salvar Ficha Técnica'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichasTecnicasPage;