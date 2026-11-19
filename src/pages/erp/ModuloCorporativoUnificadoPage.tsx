import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { supabase, formatBRL, formatDateBR, isSupabaseConfigured } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';

interface ConfigModulo {
  categoria: string;
  titulo: string;
  descricao: string;
  tabelaPrincipal: string;
  selectQuery: string;
  cardsResumo: { label: string; valor: string; detalhe: string }[];
  colunas: { chave: string; titulo: string; formato?: 'moeda' | 'data' | 'badge' }[];
}

const CONFIG_MODULOS: Record<string, ConfigModulo> = {
  'fichas-tecnicas': {
    categoria: 'Módulo 5.8 • Engenharia de Cardápio',
    titulo: 'Fichas Técnicas & Receitas (28 SKUs)',
    descricao: 'Custos unitários, rendimento, fator de perda, alergênicos e precificação por canal.',
    tabelaPrincipal: 'produtos',
    selectQuery: 'codigo_sku, nome, tipo_produto, custo_unitario_atual, preco_salao_balcao, preco_delivery, validade_dias',
    cardsResumo: [
      { label: 'Portfólio Ativo', valor: '28 SKUs', detalhe: '20 Confeitaria + 8 Cafeteria' },
      { label: 'Margem Bruta Média', valor: '69,4%', detalhe: 'Calculada sobre custo ficha' },
      { label: 'Versionamento', valor: '100% Auditado', detalhe: 'Histórico imutável de revisões' },
    ],
    colunas: [
      { chave: 'codigo_sku', titulo: 'SKU', formato: 'badge' },
      { chave: 'nome', titulo: 'Produto' },
      { chave: 'custo_unitario_atual', titulo: 'Custo Ficha', formato: 'moeda' },
      { chave: 'preco_salao_balcao', titulo: 'Preço Salão', formato: 'moeda' },
      { chave: 'preco_delivery', titulo: 'Preço Delivery', formato: 'moeda' },
      { chave: 'validade_dias', titulo: 'Validade (dias)' },
    ],
  },
  estoque: {
    categoria: 'Módulo 5.5 • Almoxarifado & Rastreabilidade',
    titulo: 'Estoque, Lotes, Endereçamento & FEFO',
    descricao: 'Controle rigoroso de validades (First-Expire, First-Out), quarentena e endereços como REF-CAM-02-03.',
    tabelaPrincipal: 'estoque_lotes',
    selectQuery: 'codigo_lote, data_fabricacao, data_validade, quantidade_atual, custo_unitario, status, ingredientes(nome), enderecos_estoque(codigo_endereco)',
    cardsResumo: [
      { label: 'Câmara Fria 02', valor: '2,8 °C', detalhe: 'Dentro da faixa (1°C a 4°C)' },
      { label: 'Política de Expedição', valor: 'FEFO Ativo', detalhe: 'Menor validade sai primeiro' },
      { label: 'Ponto de Reposição', valor: '1 Alerta', detalhe: 'Farinha de Amêndoas (7,5 kg)' },
    ],
    colunas: [
      { chave: 'codigo_lote', titulo: 'Lote', formato: 'badge' },
      { chave: 'ingrediente_nome', titulo: 'Matéria-Prima' },
      { chave: 'endereco_codigo', titulo: 'Endereço Físico' },
      { chave: 'quantidade_atual', titulo: 'Saldo Atual' },
      { chave: 'data_validade', titulo: 'Validade FEFO', formato: 'data' },
      { chave: 'status', titulo: 'Status', formato: 'badge' },
    ],
  },
  compras: {
    categoria: 'Módulo 5.6 & 5.16 • Suprimentos & Fornecedores',
    titulo: 'Compras, Cotações & Ranking de Fornecedores',
    descricao: 'Homologação, avaliação multicritério e pedidos de compra com aprovação humana obrigatória.',
    tabelaPrincipal: 'vw_ranking_fornecedores',
    selectQuery: 'codigo, nome_fantasia, categoria_fornecimento, media_qualidade, media_pontualidade, score_geral, status',
    cardsResumo: [
      { label: 'Fornecedores Ativos', valor: '4 Homologados', detalhe: 'Score médio: 4,80 / 5,00' },
      { label: 'Compras Autônomas', valor: 'Bloqueadas', detalhe: 'Exige aprovação humana' },
      { label: 'Pedido Vigente', valor: 'PC-2026-014', detalhe: 'R$ 2.740,00 (Maison Chocolat)' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'Código', formato: 'badge' },
      { chave: 'nome_fantasia', titulo: 'Fornecedor' },
      { chave: 'categoria_fornecimento', titulo: 'Categoria' },
      { chave: 'media_qualidade', titulo: 'Qualidade' },
      { chave: 'score_geral', titulo: 'Score Geral' },
      { chave: 'status', titulo: 'Status', formato: 'badge' },
    ],
  },
  producao: {
    categoria: 'Módulo 5.7 • Planejamento e Controle da Produção (PCP)',
    titulo: 'Ordens de Produção, MRP, CRP & Perdas',
    descricao: 'Programação diária a partir das 06h, consumo por lote FEFO e análise de capacidade.',
    tabelaPrincipal: 'ordens_producao',
    selectQuery: 'codigo, data_programada, hora_inicio_prevista, quantidade_planejada, quantidade_produzida, status, produtos(nome)',
    cardsResumo: [
      { label: 'Início Produção', valor: '06:00h', detalhe: 'Turno matinal de confeitaria' },
      { label: 'Rendimento OP-089', valor: '98,3%', detalhe: '60 Éclairs produzidos' },
      { label: 'Autonomia PCP', valor: 'Híbrida', detalhe: 'Sugestão MRP + aprovação Chef' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'Ordem (OP)', formato: 'badge' },
      { chave: 'produto_nome', titulo: 'Produto' },
      { chave: 'data_programada', titulo: 'Data', formato: 'data' },
      { chave: 'quantidade_planejada', titulo: 'Planejado' },
      { chave: 'quantidade_produzida', titulo: 'Produzido' },
      { chave: 'status', titulo: 'Status', formato: 'badge' },
    ],
  },
  financeiro: {
    categoria: 'Módulo 5.4 • Financeiro & Controladoria',
    titulo: 'Contas, Fluxo de Caixa, DRE & Capital Inicial',
    descricao: 'Regime Lucro Presumido (11,33%), estrutura de investimento de R$ 1.270.000,00 e lançamentos gerenciais.',
    tabelaPrincipal: 'lancamentos_financeiros',
    selectQuery: 'data_competencia, tipo, descricao, valor_bruto, valor_taxas, valor_liquido, status',
    cardsResumo: [
      { label: 'Investimento Inicial', valor: 'R$ 1.270.000,00', detalhe: '40% Sócios • 35% Banco • 25% Inv.' },
      { label: 'Regime Tributário', valor: 'Lucro Presumido', detalhe: 'Alíquota simulada: 11,33%' },
      { label: 'Saldo Disponível', valor: 'R$ 347.100,00', detalhe: 'Conta Corrente + Cofre Matriz' },
    ],
    colunas: [
      { chave: 'data_competencia', titulo: 'Competência', formato: 'data' },
      { chave: 'tipo', titulo: 'Natureza', formato: 'badge' },
      { chave: 'descricao', titulo: 'Histórico / Conta' },
      { chave: 'valor_bruto', titulo: 'Valor Bruto', formato: 'moeda' },
      { chave: 'valor_liquido', titulo: 'Valor Líquido', formato: 'moeda' },
      { chave: 'status', titulo: 'Situação', formato: 'badge' },
    ],
  },
  patrimonio: {
    categoria: 'Módulo 5.11 • Gestão Patrimonial & Ativos',
    titulo: 'Ativos Imobilizados, QR Code & Depreciação Linear',
    descricao: 'Controle individual por QR Code e cálculo automático de depreciação mensal (aprovação exclusiva da Diretoria).',
    tabelaPrincipal: 'vw_patrimonio_depreciacao',
    selectQuery: 'codigo_patrimonio, qr_code_hash, nome, localizacao_setor, valor_aquisicao, depreciacao_mensal, valor_contabil_liquido, status',
    cardsResumo: [
      { label: 'Valor Aquisição Total', valor: 'R$ 156.300,00', detalhe: '4 equipamentos principais' },
      { label: 'Depreciação Mensal', valor: 'R$ 1.196,25', detalhe: 'Método linear sobre vida útil' },
      { label: 'Alçada de Baixa', valor: 'Exclusiva Diretor', detalhe: 'Protegida via política RLS' },
    ],
    colunas: [
      { chave: 'codigo_patrimonio', titulo: 'Tombamento', formato: 'badge' },
      { chave: 'nome', titulo: 'Bem Patrimonial' },
      { chave: 'localizacao_setor', titulo: 'Setor' },
      { chave: 'valor_aquisicao', titulo: 'Aquisição', formato: 'moeda' },
      { chave: 'depreciacao_mensal', titulo: 'Depr./Mês', formato: 'moeda' },
      { chave: 'valor_contabil_liquido', titulo: 'Valor Líquido', formato: 'moeda' },
    ],
  },
  manutencao: {
    categoria: 'Módulo 5.10 • Manutenção & Confiabilidade',
    titulo: 'Ordens de Serviço, SLA, MTBF & MTTR',
    descricao: 'Gestão de preventivas e corretivas terceirizadas com indicadores de disponibilidade.',
    tabelaPrincipal: 'vw_manutencao_indicadores',
    selectQuery: 'codigo_patrimonio, equipamento_nome, total_os, total_corretivas, custo_manutencao_acumulado, mtbf_horas_estimado',
    cardsResumo: [
      { label: 'SLA Crítico', valor: '6 horas', detalhe: 'Fornos, espresso e câmaras frias' },
      { label: 'OS Aberta', valor: 'OS-2026-002', detalhe: 'Aferição sonda Forno Combinado' },
      { label: 'Contratação', valor: 'Avulsa por OS', detalhe: 'Prestador homologado RefriTech' },
    ],
    colunas: [
      { chave: 'codigo_patrimonio', titulo: 'Ativo', formato: 'badge' },
      { chave: 'equipamento_nome', titulo: 'Equipamento' },
      { chave: 'total_os', titulo: 'Total OS' },
      { chave: 'total_corretivas', titulo: 'Corretivas' },
      { chave: 'custo_manutencao_acumulado', titulo: 'Custo Acum.', formato: 'moeda' },
      { chave: 'mtbf_horas_estimado', titulo: 'MTBF Est. (h)' },
    ],
  },
  rh: {
    categoria: 'Módulo 5.12 • Recursos Humanos & Departamento Pessoal',
    titulo: 'Colaboradores, Escalas, Ponto Híbrido & Folha Prévia',
    descricao: 'Gestão de equipe da unidade Goiânia, treinamento obrigatório LGPD na admissão e folha gerencial.',
    tabelaPrincipal: 'funcionarios',
    selectQuery: 'matricula, nome_completo, turno_padrao, salario_atual, treinamento_lgpd_concluido, status, cargos(nome)',
    cardsResumo: [
      { label: 'Quadro Ativo', valor: '5 Colaboradores', detalhe: 'Turnos das 06h às 20h' },
      { label: 'Conformidade LGPD', valor: '100% Treinados', detalhe: 'Capacitação na admissão' },
      { label: 'Ponto & Folha', valor: 'Híbrido + Prévia', detalhe: 'Validação externa conceitual' },
    ],
    colunas: [
      { chave: 'matricula', titulo: 'Matrícula', formato: 'badge' },
      { chave: 'nome_completo', titulo: 'Colaborador' },
      { chave: 'cargo_nome', titulo: 'Cargo' },
      { chave: 'turno_padrao', titulo: 'Turno' },
      { chave: 'salario_atual', titulo: 'Salário Base', formato: 'moeda' },
      { chave: 'status', titulo: 'Status', formato: 'badge' },
    ],
  },
  crm: {
    categoria: 'Módulo 5.13 & 5.15 • CRM, Fidelização & Atendimento SAC',
    titulo: 'Base de Clientes, Segmentação & Pesquisa de Satisfação',
    descricao: 'Relacionamento sem carteira de pontos, campanhas direcionadas e avaliação 1 a 5 estrelas.',
    tabelaPrincipal: 'vw_crm_rfm_clientes',
    selectQuery: 'codigo, nome, tipo_pessoa, segmento, frequencia_pedidos, ticket_medio, valor_total_gasto',
    cardsResumo: [
      { label: 'Satisfação Média', valor: '5,0 / 5,0 ★', detalhe: 'Avaliações Salão e Delivery' },
      { label: 'Modelo Fidelidade', valor: 'Benefícios Diretos', detalhe: 'Sem programa de pontos' },
      { label: 'Campanha Ativa', valor: 'CRM-2026-01', detalhe: 'Mimo Aniversariante (34,5% conv.)' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'Código', formato: 'badge' },
      { chave: 'nome', titulo: 'Cliente' },
      { chave: 'tipo_pessoa', titulo: 'Tipo' },
      { chave: 'segmento', titulo: 'Segmento', formato: 'badge' },
      { chave: 'frequencia_pedidos', titulo: 'Pedidos' },
      { chave: 'valor_total_gasto', titulo: 'Total Comprado', formato: 'moeda' },
    ],
  },
  qualidade: {
    categoria: 'Módulo 5.9 • Qualidade & Segurança dos Alimentos (BPF)',
    titulo: 'POPs, Inspeções 100% Lotes, Temperatura & Não Conformidades',
    descricao: 'Controles críticos em 100% dos lotes e bloqueio automático via trigger em caso de desvio.',
    tabelaPrincipal: 'inspecoes_qualidade',
    selectQuery: 'codigo, data_inspecao, resultado, observacoes, checklists_modelos(nome)',
    cardsResumo: [
      { label: 'Controle Crítico', valor: '100% dos Lotes', detalhe: 'Liberação com aprovação humana' },
      { label: 'POPs Vigentes', valor: 'POP-001 e 002', detalhe: 'BPF e Cadeia Fria/Alergênicos' },
      { label: 'Bloqueio Automático', valor: 'Trigger Ativo', detalhe: 'Impede venda de lote reprovado' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'Inspeção', formato: 'badge' },
      { chave: 'checklist_nome', titulo: 'Checklist Aplicado' },
      { chave: 'data_inspecao', titulo: 'Data/Hora', formato: 'data' },
      { chave: 'resultado', titulo: 'Resultado', formato: 'badge' },
    ],
  },
  bpm: {
    categoria: 'Módulo 5.18 • Projetos, Kanban, Gantt & Processos BPM',
    titulo: 'Gestão de Projetos & Automação de Fluxos BPM',
    descricao: 'Acompanhamento de tarefas e instâncias de processos empresariais simulados.',
    tabelaPrincipal: 'tarefas',
    selectQuery: 'titulo, coluna_kanban, prioridade, data_inicio, prazo, projetos(nome)',
    cardsResumo: [
      { label: 'Projeto Ativo', valor: 'PRJ-001 (45%)', detalhe: 'Linha Páscoa & Corporativo 2027' },
      { label: 'Fluxo BPM Ativo', valor: 'INST-BPM-044', detalhe: 'Aprovação Compras -> FEFO' },
      { label: 'Visões Disponíveis', valor: 'Kanban & Gantt', detalhe: 'Dependências e SLAs' },
    ],
    colunas: [
      { chave: 'projeto_nome', titulo: 'Projeto' },
      { chave: 'titulo', titulo: 'Tarefa' },
      { chave: 'coluna_kanban', titulo: 'Etapa Kanban', formato: 'badge' },
      { chave: 'prioridade', titulo: 'Prioridade', formato: 'badge' },
      { chave: 'prazo', titulo: 'Prazo', formato: 'data' },
    ],
  },
  documentos: {
    categoria: 'Módulo 5.19 • Gestão Eletrônica de Documentos (GED)',
    titulo: 'Repositório Central, Versionamento & Controle de Sigilo',
    descricao: 'Classificação por nível de acesso (Público, Interno, Confidencial, Restrito) e assinatura eletrônica simulada.',
    tabelaPrincipal: 'documentos_ged',
    selectQuery: 'codigo, titulo, categoria, nivel_sigilo, data_validade, assinado_eletronicamente, status',
    cardsResumo: [
      { label: 'Armazenamento', valor: 'Supabase Storage', detalhe: 'Buckets segregados por sigilo' },
      { label: 'Alvará Sanitário', valor: 'Vigente', detalhe: 'Vencimento monitorado (DOC-001)' },
      { label: 'Política RLS', valor: 'Sigilo Aplicado', detalhe: 'Restritos visíveis só à Diretoria' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'Código', formato: 'badge' },
      { chave: 'titulo', titulo: 'Documento' },
      { chave: 'categoria', titulo: 'Categoria' },
      { chave: 'nivel_sigilo', titulo: 'Classificação', formato: 'badge' },
      { chave: 'data_validade', titulo: 'Validade', formato: 'data' },
      { chave: 'status', titulo: 'Status', formato: 'badge' },
    ],
  },
  seguranca: {
    categoria: 'Módulo 5.21 • Segurança da Informação & Auditoria',
    titulo: 'Trilha Imutável de Auditoria, Perfis & Anomalias',
    descricao: 'Registro automático (via triggers) de todas as inserções, alterações e exclusões em tabelas críticas.',
    tabelaPrincipal: 'auditoria_logs',
    selectQuery: 'created_at, tabela_nome, operacao, registro_id',
    cardsResumo: [
      { label: 'Integridade Logs', valor: '100% Imutável', detalhe: 'UPDATE/DELETE bloqueados via RLS' },
      { label: 'Proteção RLS', valor: '82/82 Tabelas', detalhe: 'Controle granular por perfil' },
      { label: 'Anomalias', valor: 'Investigação Humana', detalhe: 'Sem bloqueio automático cego' },
    ],
    colunas: [
      { chave: 'created_at', titulo: 'Data/Hora', formato: 'data' },
      { chave: 'tabela_nome', titulo: 'Tabela Auditada', formato: 'badge' },
      { chave: 'operacao', titulo: 'Operação', formato: 'badge' },
      { chave: 'registro_id', titulo: 'ID do Registro' },
    ],
  },
  lgpd: {
    categoria: 'Módulo 5.22 & 5.23 • Governança LGPD & Continuidade (Backup)',
    titulo: 'Inventário ROPA, Privacidade & Plano de Recuperação (DR)',
    descricao: 'Adequação à Lei 13.709/2018 e painel demonstrativo de backups com RPO <= 1h e RTO <= 4h.',
    tabelaPrincipal: 'lgpd_inventario_dados',
    selectQuery: 'codigo, processo_negocio, categoria_titular, base_legal, prazo_retencao, transferencia_internacional',
    cardsResumo: [
      { label: 'RPO / RTO Alvo', valor: '35min / 140min', detalhe: 'Dentro da meta (1h / 4h)' },
      { label: 'Retenção Backup', valor: '30d / 12m / 5a', detalhe: 'Diária, Mensal e Anual' },
      { label: 'Cookies Vitrine', valor: 'Granular', detalhe: 'Rejeição não-essenciais ativa' },
    ],
    colunas: [
      { chave: 'codigo', titulo: 'ROPA', formato: 'badge' },
      { chave: 'processo_negocio', titulo: 'Processo de Negócio' },
      { chave: 'categoria_titular', titulo: 'Titular' },
      { chave: 'base_legal', titulo: 'Base Legal LGPD' },
      { chave: 'prazo_retencao', titulo: 'Retenção' },
    ],
  },
};

export const ModuloCorporativoUnificadoPage: React.FC = () => {
  const { modulo } = useParams<{ modulo: string }>();
  const config = CONFIG_MODULOS[modulo || 'fichas-tecnicas'] || CONFIG_MODULOS['fichas-tecnicas'];

  const [registros, setRegistros] = useState<any[]>([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function buscarDadosModulo() {
      if (!isSupabaseConfigured) return;
      setCarregando(true);
      const { data, error } = await supabase
        .from(config.tabelaPrincipal)
        .select(config.selectQuery)
        .limit(50);

      if (!error && data) {
        const normalizados = data.map((item: any) => ({
          ...item,
          ingrediente_nome: item.ingredientes?.nome || '—',
          endereco_codigo: item.enderecos_estoque?.codigo_endereco || '—',
          produto_nome: item.produtos?.nome || '—',
          cargo_nome: item.cargos?.nome || '—',
          checklist_nome: item.checklists_modelos?.nome || '—',
          projeto_nome: item.projetos?.nome || '—',
        }));
        setRegistros(normalizados);
      } else {
        setRegistros([]);
      }
      setCarregando(false);
    }

    buscarDadosModulo();
  }, [config.tabelaPrincipal, config.selectQuery]);

  const registrosFiltrados = registros.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const formatarCelula = (valor: any, formato?: string) => {
    if (valor === null || valor === undefined) return '—';
    if (formato === 'moeda') return formatBRL(valor);
    if (formato === 'data') return formatDateBR(String(valor));
    if (formato === 'badge') {
      return (
        <span className="px-2 py-0.5 rounded bg-[#F5E8D8] text-[#701D2B] font-bold text-[11px] uppercase">
          {String(valor)}
        </span>
      );
    }
    return String(valor);
  };

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria={config.categoria}
        titulo={config.titulo}
        descricao={config.descricao}
        dadosExportacao={registrosFiltrados}
        nomeArquivoCsv={`docegestao_${modulo}.csv`}
      />

      {/* Cards de Indicadores do Módulo */}
      <div className="grid md:grid-cols-3 gap-4">
        {config.cardsResumo.map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-2xl border border-[#E8D4BC]">
            <p className="text-xs font-semibold text-[#7F7269]">{c.label}</p>
            <p className="font-serif text-2xl font-bold text-[#701D2B] mt-1">{c.valor}</p>
            <p className="text-[11px] text-[#542C20]/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C69A55]" />
              {c.detalhe}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de Filtro e Tabela Dinâmica */}
      <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden">
        <div className="p-4 border-b border-[#E8D4BC] flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Filtrar registros nesta tabela..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FBF5EE] border border-[#E8D4BC] rounded-lg focus:outline-none focus:border-[#C69A55]"
            />
          </div>
          <span className="text-xs text-[#7F7269] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#701D2B]" />
            Exibindo {registrosFiltrados.length} registros reais do Supabase ({config.tabelaPrincipal})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#701D2B] text-[#F5E8D8]">
              <tr>
                {config.colunas.map((col) => (
                  <th key={col.chave} className="p-3.5 font-semibold">
                    {col.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8D4BC]">
              {carregando ? (
                <tr>
                  <td colSpan={config.colunas.length} className="p-8 text-center text-[#7F7269]">
                    Carregando dados do PostgreSQL...
                  </td>
                </tr>
              ) : registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={config.colunas.length} className="p-8 text-center text-[#7F7269]">
                    <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-[#C69A55]" />
                    Nenhum registro encontrado para o filtro atual ou protegido pela política RLS do perfil selecionado.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF5EE] transition-colors">
                    {config.colunas.map((col) => (
                      <td key={col.chave} className="p-3.5 text-[#542C20]">
                        {formatarCelula(row[col.chave], col.formato)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};