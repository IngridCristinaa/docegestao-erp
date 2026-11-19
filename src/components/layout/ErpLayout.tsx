import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Factory, DollarSign, ShieldCheck,
  Wrench, Landmark, Users, HeartHandshake, FileText, GitBranch, Lock,
  DatabaseBackup, Store, Menu, X, Bell, Search, Eye, UserCheck, ChevronDown,
  BookOpen, Truck, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface NavGroup {
  titulo: string;
  itens: { nome: string; rota: string; icon: React.ReactNode }[];
}

const MENU_GRUPOS: NavGroup[] = [
  {
    titulo: 'Estratégia & BI',
    itens: [
      { nome: 'Dashboard Executivo', rota: '/erp/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { nome: 'BI & Simulador', rota: '/erp/bi', icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    titulo: 'Operações & Cadeia',
    itens: [
      { nome: 'Comercial & PDV', rota: '/erp/comercial', icon: <ShoppingBag className="w-4 h-4" /> },
      { nome: 'Loja Digital', rota: '/loja', icon: <Store className="w-4 h-4" /> },
      { nome: 'Produção & PCP', rota: '/erp/producao', icon: <Factory className="w-4 h-4" /> },
      { nome: 'Fichas Técnicas (28)', rota: '/erp/fichas-tecnicas', icon: <BookOpen className="w-4 h-4" /> },
      { nome: 'Estoque & FEFO', rota: '/erp/estoque', icon: <Package className="w-4 h-4" /> },
      { nome: 'Compras & Fornec.', rota: '/erp/compras', icon: <Truck className="w-4 h-4" /> },
    ],
  },
  {
    titulo: 'Controladoria & Ativos',
    itens: [
      { nome: 'Financeiro & DRE', rota: '/erp/financeiro', icon: <DollarSign className="w-4 h-4" /> },
      { nome: 'Patrimônio (QR)', rota: '/erp/patrimonio', icon: <Landmark className="w-4 h-4" /> },
      { nome: 'Manutenção & SLA', rota: '/erp/manutencao', icon: <Wrench className="w-4 h-4" /> },
    ],
  },
  {
    titulo: 'Pessoas & Relacionamento',
    itens: [
      { nome: 'Recursos Humanos', rota: '/erp/rh', icon: <Users className="w-4 h-4" /> },
      { nome: 'CRM & Atendimento', rota: '/erp/crm', icon: <HeartHandshake className="w-4 h-4" /> },
    ],
  },
  {
    titulo: 'Qualidade & Governança',
    itens: [
      { nome: 'Qualidade & BPF', rota: '/erp/qualidade', icon: <ShieldCheck className="w-4 h-4" /> },
      { nome: 'Projetos & BPM', rota: '/erp/bpm', icon: <GitBranch className="w-4 h-4" /> },
      { nome: 'Documentos (GED)', rota: '/erp/documentos', icon: <FileText className="w-4 h-4" /> },
      { nome: 'Segurança & Auditoria', rota: '/erp/seguranca', icon: <Lock className="w-4 h-4" /> },
      { nome: 'LGPD & Backup', rota: '/erp/lgpd', icon: <DatabaseBackup className="w-4 h-4" /> },
    ],
  },
];

export const ErpLayout: React.FC = () => {
  const location = useLocation();
  const { perfilAtivo, perfisDisponiveis, modoSomenteLeitura, selecionarPerfilDemo, entrarModoVisitante } = useAuth();
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const [dropdownPerfil, setDropdownPerfil] = useState(false);
  const [dropdownNotif, setDropdownNotif] = useState(false);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [notificacoes, setNotificacoes] = useState<any[]>([
    { id: '1', titulo: 'Estoque em Ponto de Reposição', mensagem: 'Farinha de Amêndoas (7,5 kg) abaixo do ponto de reposição (9,0 kg).', prioridade: 'alerta' },
    { id: '2', titulo: 'OS Corretiva Aprovada (OS-2026-002)', mensagem: 'Forno Combinado Prática aguardando técnico RefriTech (SLA 6h).', prioridade: 'critico' },
  ]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, prioridade, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) setNotificacoes(data);
      });
  }, []);

  return (
    <div className="min-h-screen flex bg-[#FBF5EE] text-[#542C20]">
      {/* Backdrop mobile */}
      {menuAbertoMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuAbertoMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-68 bg-[#701D2B] text-[#F5E8D8] flex flex-col transition-transform duration-200 ${
          menuAbertoMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-[#C69A55]/30 flex items-center justify-between">
          <Link to="/" className="block">
            <span className="font-serif text-2xl font-bold tracking-wide text-[#F5E8D8]">
              Doce<span className="text-[#C69A55]">Gestão</span>
            </span>
            <p className="text-[11px] text-[#F5E8D8]/75 tracking-wider uppercase mt-0.5">
              Pâtisserie & Café ERP
            </p>
          </Link>
          <button
            className="lg:hidden text-[#F5E8D8]"
            onClick={() => setMenuAbertoMobile(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {MENU_GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[#C69A55] mb-1.5">
                {grupo.titulo}
              </p>
              <div className="space-y-0.5">
                {grupo.itens
                  .filter((i) => i.nome.toLowerCase().includes(buscaGlobal.toLowerCase()))
                  .map((item) => {
                    const ativo = location.pathname === item.rota;
                    return (
                      <Link
                        key={item.rota}
                        to={item.rota}
                        onClick={() => setMenuAbertoMobile(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          ativo
                            ? 'bg-[#C69A55] text-[#3A1D14] font-semibold shadow-sm'
                            : 'text-[#F5E8D8]/90 hover:bg-[#53131E] hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span>{item.nome}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#C69A55]/25 text-xs text-[#F5E8D8]/75 bg-[#53131E]">
          <div className="flex items-center justify-between">
            <span>Unidade Matriz</span>
            <span className="text-[#C69A55] font-medium">Setor Sul • GO</span>
          </div>
          <p className="text-[10px] mt-1 text-[#F5E8D8]/60">
            Ambiente Demonstrativo • Dados Fictícios
          </p>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner informativo de modo somente leitura */}
        {modoSomenteLeitura && (
          <div className="bg-[#542C20] text-[#F5E8D8] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#C69A55]" />
              Modo <strong>Somente Leitura ({perfilAtivo.nome})</strong> ativo. Alterações no banco estão bloqueadas pela política RLS.
            </span>
            <button
              onClick={() => selecionarPerfilDemo('diretor')}
              className="underline text-[#C69A55] hover:text-white font-medium"
            >
              Alternar para Perfil Diretor (Edição Completa)
            </button>
          </div>
        )}

        {/* Cabeçalho */}
        <header className="h-16 bg-white border-b border-[#E8D4BC] px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMenuAbertoMobile(true)}
              className="lg:hidden p-2 rounded-lg text-[#701D2B] hover:bg-[#F5E8D8]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-xs w-full hidden sm:block">
              <Search className="w-4 h-4 text-[#A99B91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaGlobal}
                onChange={(e) => setBuscaGlobal(e.target.value)}
                placeholder="Filtrar módulos do ERP..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#FBF5EE] border border-[#E8D4BC] rounded-lg focus:outline-none focus:border-[#C69A55]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownNotif(!dropdownNotif);
                  setDropdownPerfil(false);
                }}
                className="p-2 rounded-lg border border-[#E8D4BC] hover:bg-[#F5E8D8]/60 relative"
                title="Central de Alertas"
              >
                <Bell className="w-4 h-4 text-[#701D2B]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#701D2B] text-white text-[10px] flex items-center justify-center font-bold">
                  {notificacoes.length}
                </span>
              </button>

              {dropdownNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8D4BC] rounded-xl shadow-xl p-3 z-50">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#701D2B] pb-2 border-b border-[#E8D4BC]">
                    Alertas Internos do Sistema
                  </p>
                  <div className="divide-y divide-[#F5E8D8] max-h-64 overflow-y-auto">
                    {notificacoes.map((n) => (
                      <div key={n.id} className="py-2.5 text-xs">
                        <p className="font-semibold text-[#542C20]">{n.titulo}</p>
                        <p className="text-[#7F7269] mt-0.5">{n.mensagem}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seletor de Perfil Demonstrativo */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownPerfil(!dropdownPerfil);
                  setDropdownNotif(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C69A55]/60 bg-[#FBF5EE] hover:bg-[#F5E8D8] text-left"
              >
                <UserCheck className="w-4 h-4 text-[#701D2B] shrink-0" />
                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-[#542C20] leading-tight">
                    {perfilAtivo.usuario_nome}
                  </p>
                  <p className="text-[10px] text-[#701D2B] font-medium">
                    {perfilAtivo.nome}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#7F7269]" />
              </button>

              {dropdownPerfil && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E8D4BC] rounded-xl shadow-xl p-2 z-50 max-h-96 overflow-y-auto">
                  <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A99B91]">
                    Alternar Conta Demonstrativa
                  </p>
                  <button
                    onClick={() => {
                      entrarModoVisitante();
                      setDropdownPerfil(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs mb-1 ${
                      perfilAtivo.codigo === 'visitante' ? 'bg-[#701D2B] text-white' : 'hover:bg-[#F5E8D8]'
                    }`}
                  >
                    <p className="font-semibold">Visitante Público (Somente Leitura)</p>
                    <p className="text-[10px] opacity-80">Simula acesso aberto sem autenticação</p>
                  </button>
                  <div className="border-t border-[#E8D4BC] my-1" />
                  {perfisDisponiveis.map((p) => (
                    <button
                      key={p.codigo}
                      onClick={() => {
                        selecionarPerfilDemo(p.codigo);
                        setDropdownPerfil(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        perfilAtivo.codigo === p.codigo
                          ? 'bg-[#701D2B] text-white'
                          : 'hover:bg-[#F5E8D8] text-[#542C20]'
                      }`}
                    >
                      <p className="font-semibold">{p.nome}</p>
                      <p className="text-[10px] opacity-80">{p.usuario_nome}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico das Páginas */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};