import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  LayoutDashboard,
  Award,
  ShieldCheck,
  ChefHat,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  ThermometerSnowflake,
  ClipboardCheck,
  QrCode,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const colecaoDestaque = [
    {
      nome: 'Entremet Frutas Vermelhas & Baunilha',
      categoria: 'Signature Pâtisserie',
      preco: 'R$ 28,90',
      descricao:
        'Mousse leve de baunilha de Madagascar, inserto de framboesa fresca e glaçagem espelhada.',
    },
    {
      nome: 'Torta Ópera 70% Cacau',
      categoria: 'Clássico Francês',
      preco: 'R$ 26,50',
      descricao:
        'Camadas de biscuit Joconde embebido em café especial, ganache intenso e creme de manteiga.',
    },
    {
      nome: 'Croissant Folhado Manteiga Extra',
      categoria: 'Viennoiserie Artesanal',
      preco: 'R$ 16,90',
      descricao:
        'Fermentação natural de 48h com laminação francesa crocante e miolo alveolado.',
    },
    {
      nome: 'Coffret 12 Macarons Assortidos',
      categoria: 'Presentes & Eventos',
      preco: 'R$ 78,00',
      descricao:
        'Pistache iraniano, caramelo salgado, frutas vermelhas, limão siciliano e chocolate belga.',
    },
  ];

  const rolarParaSecao = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5EE] text-[#542C20] flex flex-col">
      {/* Barra Superior Fixa */}
      <header className="sticky top-0 z-40 bg-[#FBF5EE]/95 backdrop-blur border-b border-[#E8D4BC]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="#topo"
            onClick={(e) => rolarParaSecao(e, 'topo')}
            className="block"
          >
            <span className="font-serif text-2xl font-bold text-[#701D2B] tracking-tight">
              DoceGestão
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#C69A55] font-bold">
              Pâtisserie & Café • ERP Integrado
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#542C20]">
            <a
              href="#colecao"
              onClick={(e) => rolarParaSecao(e, 'colecao')}
              className="hover:text-[#701D2B] transition-colors py-1"
            >
              Coleção Artesanal
            </a>
            <a
              href="#diferenciais"
              onClick={(e) => rolarParaSecao(e, 'diferenciais')}
              className="hover:text-[#701D2B] transition-colors py-1"
            >
              Qualidade & Rastreabilidade
            </a>
            <a
              href="#unidade"
              onClick={(e) => rolarParaSecao(e, 'unidade')}
              className="hover:text-[#701D2B] transition-colors py-1"
            >
              Unidade Flagship
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/loja"
              className="px-4 py-2 rounded-xl border border-[#701D2B] text-[#701D2B] text-xs font-bold hover:bg-[#701D2B] hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Loja Digital
            </Link>
            <Link
              to="/erp/dashboard"
              className="px-4 py-2 rounded-xl bg-[#701D2B] text-[#F5E8D8] text-xs font-bold hover:bg-[#542C20] transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C69A55]" />
              Acessar ERP
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal */}
      <main id="topo" className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5E8D8] border border-[#E8D4BC] text-[#701D2B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C69A55]" />
              Alta Confeitaria + Gestão Corporativa Ponta a Ponta
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#542C20] leading-tight">
              A arte da pâtisserie francesa com precisão de{' '}
              <span className="text-[#701D2B]">gestão integrada</span>.
            </h1>

            <p className="text-sm sm:text-base text-[#7F7269] max-w-2xl leading-relaxed">
              Da ficha técnica com cálculo exato de CMV e rastreabilidade sanitária FEFO até a
              experiência do cliente na Loja Digital, PDV e Sala de Situação Executiva.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/erp/dashboard"
                className="px-6 py-3.5 rounded-2xl bg-[#701D2B] text-[#F5E8D8] text-sm font-bold hover:bg-[#542C20] transition-all inline-flex items-center gap-2 shadow-md"
              >
                Explorar ERP Corporativo
                <ArrowRight className="w-4 h-4 text-[#C69A55]" />
              </Link>
              <Link
                to="/loja"
                className="px-6 py-3.5 rounded-2xl bg-white border border-[#E8D4BC] text-[#542C20] text-sm font-bold hover:border-[#701D2B] transition-all inline-flex items-center gap-2"
              >
                Fazer Pedido na Loja Digital
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-7 rounded-3xl border border-[#E8D4BC] shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[#F5E8D8] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#C69A55]">
                  Ecossistema Integrado
                </span>
                <h2 className="font-serif text-xl font-bold text-[#542C20]">
                  Arquitetura em 8 Módulos
                </h2>
              </div>
              <ChefHat className="w-8 h-8 text-[#701D2B]" />
            </div>

            <ul className="space-y-3 text-xs text-[#542C20]">
              <li className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#C69A55] shrink-0" />
                <span>Dashboard Executivo 360º, BI & Simulador Tributário</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#C69A55] shrink-0" />
                <span>Comercial PDV, Mesas & Loja Digital Omnichannel</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#C69A55] shrink-0" />
                <span>PCP, Fichas Técnicas (28 SKUs) & Qualidade BPF / Cadeia Fria</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>RH & DP, CRM Fidelidade, Patrimônio QR, Auditoria & LGPD</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Seção 1: Coleção em Destaque */}
        <section id="colecao" className="scroll-mt-24 max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#701D2B]">
              Vitrine Gastronômica
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#542C20] mt-1">
              Criações Signature da Casa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {colecaoDestaque.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-[#E8D4BC] flex flex-col justify-between space-y-4 hover:border-[#701D2B] transition-colors"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C69A55]">
                    {item.categoria}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#542C20]">{item.nome}</h3>
                  <p className="text-xs text-[#7F7269] leading-relaxed">{item.descricao}</p>
                </div>

                <div className="pt-3 border-t border-[#F5E8D8] flex items-center justify-between">
                  <span className="font-bold text-sm text-[#701D2B]">{item.preco}</span>
                  <Link
                    to="/loja"
                    className="text-xs font-semibold text-[#542C20] hover:text-[#701D2B] underline"
                  >
                    Encomendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 2: Qualidade & Rastreabilidade */}
        <section id="diferenciais" className="scroll-mt-24 max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white p-8 rounded-3xl border border-[#E8D4BC] space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#701D2B]">
                Segurança dos Alimentos & Governança BPF
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#542C20] mt-1">
                Qualidade & Rastreabilidade Ponta a Ponta
              </h2>
              <p className="text-xs sm:text-sm text-[#7F7269] mt-2 max-w-3xl">
                Cada receita, insumo e lote produzido é rastreado em tempo real no ERP DoceGestão,
                garantindo conformidade sanitária, controle rigoroso de alergênicos e transparência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-[#FBF5EE] border border-[#E8D4BC] space-y-2.5">
                <ThermometerSnowflake className="w-6 h-6 text-[#701D2B]" />
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Monitoramento da Cadeia Fria
                </h3>
                <p className="text-xs text-[#7F7269] leading-relaxed">
                  Registros periódicos de temperatura em câmaras de resfriamento (0°C a 4°C) e
                  congelamento (-18°C), com bloqueio automático de lotes fora da faixa.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF5EE] border border-[#E8D4BC] space-y-2.5">
                <ClipboardCheck className="w-6 h-6 text-[#C69A55]" />
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Controle FEFO & Alergênicos
                </h3>
                <p className="text-xs text-[#7F7269] leading-relaxed">
                  Baixa automática pelo critério First-Expire, First-Out (FEFO) e rotulagem
                  detalhada de glúten, lactose, oleaginosas e derivados em todas as fichas técnicas.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF5EE] border border-[#E8D4BC] space-y-2.5">
                <QrCode className="w-6 h-6 text-emerald-700" />
                <h3 className="font-serif text-lg font-bold text-[#542C20]">
                  Inspeção 100% & Liberação Humana
                </h3>
                <p className="text-xs text-[#7F7269] leading-relaxed">
                  Nenhum lote segue para a vitrine ou delivery sem aprovação formal da equipe de
                  Qualidade e rastreio completo da origem dos insumos até o pedido final.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Seção 3: Unidade Flagship & Rodapé Institucional */}
      <footer id="unidade" className="scroll-mt-24 bg-[#542C20] text-[#F5E8D8] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#F5E8D8]">
                DoceGestão Pâtisserie
              </h3>
              <p className="text-[#E8D4BC]/80 mt-2 leading-relaxed">
                Projeto completo de arquitetura ERP e experiência digital desenvolvido para
                demonstração de engenharia de processos, controladoria e análise de dados.
              </p>
            </div>

            <div className="space-y-2 text-[#E8D4BC]/90">
              <p className="font-bold text-[#C69A55] uppercase">Unidade Matriz (Demo)</p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C69A55]" /> Setor Sul • Goiânia, GO
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C69A55]" /> Terça a Domingo • 08h às 20h
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C69A55]" /> (62) 3200-0000
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[#C69A55] uppercase">Acesso Rápido</p>
              <div className="flex flex-col gap-1.5">
                <Link to="/erp/dashboard" className="hover:text-[#C69A55]">
                  → Dashboard Executivo & Sala de Reunião
                </Link>
                <Link to="/loja" className="hover:text-[#C69A55]">
                  → Loja Digital & Encomendas
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E8D4BC]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#E8D4BC]/80">
            <p>© 2026 DoceGestão Pâtisserie & Café. Todos os direitos reservados.</p>
            <p>
              Desenvolvido por{' '}
              <a
                href="https://www.linkedin.com/in/ingridcmoura/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#C69A55] hover:underline"
              >
                Ingrid Moura • LinkedIn ↗
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;