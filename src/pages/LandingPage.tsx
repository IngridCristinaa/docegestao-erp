import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Store, ShieldCheck, BarChart3, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { perfisDisponiveis, selecionarPerfilDemo, entrarModoVisitante } = useAuth();

  const abrirDemoSomenteLeitura = () => {
    entrarModoVisitante();
    navigate('/erp/dashboard');
  };

  const abrirComPerfil = (codigo: string) => {
    selecionarPerfilDemo(codigo);
    navigate('/erp/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FBF5EE] text-[#542C20]">
      {/* Navbar Pública */}
      <header className="bg-[#701D2B] text-[#F5E8D8] border-b border-[#C69A55]/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-serif text-3xl font-bold tracking-wide">
              Doce<span className="text-[#C69A55]">Gestão</span>
            </span>
            <span className="ml-3 text-xs uppercase tracking-widest text-[#C69A55] hidden sm:inline">
              Pâtisserie & Café • ERP Integrado
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/loja"
              className="px-4 py-2 rounded-lg border border-[#C69A55] text-[#F5E8D8] hover:bg-[#C69A55] hover:text-[#3A1D14] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Vitrine Digital
            </Link>
            <button
              onClick={abrirDemoSomenteLeitura}
              className="px-4 py-2 rounded-lg bg-[#C69A55] text-[#3A1D14] hover:bg-[#DFBC82] text-sm font-semibold transition-colors flex items-center gap-2"
            >
              Explorar ERP
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#701D2B] via-[#5c1622] to-[#542C20] text-[#F5E8D8] py-16 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C69A55]/20 border border-[#C69A55]/40 text-[#DFBC82] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Projeto Demonstrativo de Portfólio • Arquitetura Full-Stack & BI
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Tecnologia e sabor para uma gestão ainda mais doce.
            </h1>
            <p className="text-base sm:text-lg text-[#F5E8D8]/85 max-w-2xl leading-relaxed">
              ERP completo projetado para uma confeitaria francesa contemporânea com cafeteria especializada em Goiânia (Setor Sul). Integra 23 módulos operacionais, rastreabilidade FEFO, fichas técnicas de 28 SKUs, PCP/MRP, DRE no Lucro Presumido e governança LGPD.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={abrirDemoSomenteLeitura}
                className="px-6 py-3.5 rounded-xl bg-[#C69A55] text-[#3A1D14] font-semibold hover:bg-[#DFBC82] transition-all flex items-center gap-2 shadow-lg"
              >
                Acessar Demonstração Navegável
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/loja"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5E8D8] font-medium border border-white/20 transition-all flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-[#C69A55]" />
                Abrir Vitrine & Pedidos Online
              </Link>
            </div>
          </div>

          {/* Card de Premissas da Empresa Fictícia */}
          <div className="lg:col-span-5 bg-[#FBF5EE] text-[#542C20] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#C69A55]/40">
            <p className="text-xs font-bold uppercase tracking-widest text-[#701D2B]">
              Caracterização da Operação Simulada
            </p>
            <h2 className="font-serif text-2xl font-bold mt-1 mb-4">
              DoceGestão Matriz — Goiânia/GO
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="p-3 rounded-xl bg-[#F5E8D8]/70">
                <p className="text-xs text-[#7F7269]">Estrutura Física</p>
                <p className="font-bold text-[#701D2B]">250 m² • 36 lugares</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5E8D8]/70">
                <p className="text-xs text-[#7F7269]">Ticket Médio Ref.</p>
                <p className="font-bold text-[#701D2B]">R$ 25,00</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5E8D8]/70">
                <p className="text-xs text-[#7F7269]">Investimento Inicial</p>
                <p className="font-bold text-[#701D2B]">R$ 1.270.000,00</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5E8D8]/70">
                <p className="text-xs text-[#7F7269]">Mix de Canais</p>
                <p className="font-bold text-[#701D2B]">50% Salão | 30% Del. | 20% Enc.</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-[#542C20]/90 border-t border-[#E8D4BC] pt-4">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#701D2B] shrink-0" />
                82 tabelas PostgreSQL no Supabase com RLS e auditoria imutável.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#701D2B] shrink-0" />
                Dados 100% fictícios e integrações externas exclusivamente simuladas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seletor Rápido de Perfis Demonstrativos */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#701D2B]">
            Modelo Híbrido de Acesso
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
            Explore sob a ótica de 10 Perfis Executivos e Operacionais
          </h2>
          <p className="text-sm text-[#7F7269] mt-2">
            Clique em qualquer perfil abaixo para entrar diretamente no ERP com as permissões e visão daquela área.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {perfisDisponiveis.map((perfil) => (
            <button
              key={perfil.codigo}
              onClick={() => abrirComPerfil(perfil.codigo)}
              className="text-left p-4 rounded-xl bg-white border border-[#E8D4BC] hover:border-[#701D2B] hover:shadow-md transition-all group"
            >
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F5E8D8] text-[#701D2B] group-hover:bg-[#701D2B] group-hover:text-white transition-colors">
                {perfil.codigo.replace('_', ' ')}
              </span>
              <h3 className="font-serif text-lg font-bold mt-2 text-[#542C20]">
                {perfil.nome}
              </h3>
              <p className="text-xs text-[#7F7269] mt-1 line-clamp-2">
                {perfil.descricao}
              </p>
            </button>
          ))}
        </div>

        {/* Pilares Técnicos */}
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          <div className="p-6 rounded-2xl bg-white border border-[#E8D4BC]">
            <BarChart3 className="w-7 h-7 text-[#701D2B] mb-3" />
            <h3 className="font-serif text-xl font-bold">BI & Simulador de Cenários</h3>
            <p className="text-xs text-[#7F7269] mt-1.5 leading-relaxed">
              Gráficos interativos Recharts conectados às views do PostgreSQL, permitindo simular alterações de ticket médio, mix de canais e projeção semestral.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E8D4BC]">
            <Layers className="w-7 h-7 text-[#C69A55] mb-3" />
            <h3 className="font-serif text-xl font-bold">Rastreabilidade Ponta a Ponta</h3>
            <p className="text-xs text-[#7F7269] mt-1.5 leading-relaxed">
              Do recebimento em endereços como REF-CAM-02-03 com controle FEFO até a ordem de produção, inspeção de qualidade e venda no PDV ou Loja Digital.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E8D4BC]">
            <ShieldCheck className="w-7 h-7 text-[#542C20] mb-3" />
            <h3 className="font-serif text-xl font-bold">Governança, Auditoria & LGPD</h3>
            <p className="text-xs text-[#7F7269] mt-1.5 leading-relaxed">
              Matriz granular de permissões, trilha de auditoria imutável via triggers, ROPA, gestão de consentimentos, cookies granulares e plano DR simulado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};