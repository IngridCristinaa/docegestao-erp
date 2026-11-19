import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PerfilDemo {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  nivel_hierarquia: number;
  usuario_nome: string;
  usuario_email: string;
}

interface AuthContextType {
  perfilAtivo: PerfilDemo;
  perfisDisponiveis: PerfilDemo[];
  modoSomenteLeitura: boolean;
  selecionarPerfilDemo: (codigo: string) => void;
  entrarModoVisitante: () => void;
  podeEditar: (modulo?: string) => boolean;
  podeAprovar: boolean;
}

const PERFIL_VISITANTE: PerfilDemo = {
  id: 'public-demo',
  codigo: 'visitante',
  nome: 'Demonstração Pública (Somente Leitura)',
  descricao: 'Navegação aberta para avaliação do portfólio sem alteração de dados.',
  nivel_hierarquia: 0,
  usuario_nome: 'Visitante Portfólio',
  usuario_email: 'visitante@docegestao.demo.br',
};

const PERFIS_FALLBACK: PerfilDemo[] = [
  { id: '33333333-3333-3333-3333-333333333301', codigo: 'diretor', nome: 'Diretor Executivo', descricao: 'Acesso total e aprovações patrimoniais.', nivel_hierarquia: 10, usuario_nome: 'Helena Vasconcelos (Diretora)', usuario_email: 'diretor@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333302', codigo: 'gerente_geral', nome: 'Gerente Geral', descricao: 'Supervisão operacional e tática.', nivel_hierarquia: 9, usuario_nome: 'Rafael Monteiro (Gerente Geral)', usuario_email: 'gerente@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333303', codigo: 'financeiro', nome: 'Financeiro & Controladoria', descricao: 'DRE, fluxo de caixa e conciliação.', nivel_hierarquia: 7, usuario_nome: 'Camila Nogueira (Controladoria)', usuario_email: 'financeiro@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333304', codigo: 'comercial', nome: 'Comercial & PDV', descricao: 'Caixas, comandas, loja digital e CRM.', nivel_hierarquia: 6, usuario_nome: 'Lucas Andrade (Líder Comercial)', usuario_email: 'comercial@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333305', codigo: 'estoque', nome: 'Estoque & Almoxarifado', descricao: 'Lotes FEFO, endereçamento e inventários.', nivel_hierarquia: 6, usuario_nome: 'Bruno Tavares (Almoxarifado)', usuario_email: 'estoque@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333306', codigo: 'producao', nome: 'Produção & PCP', descricao: 'MRP, CRP, ordens de produção e fichas.', nivel_hierarquia: 6, usuario_nome: 'Chef Laurent Moreau (PCP/Produção)', usuario_email: 'producao@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333307', codigo: 'rh', nome: 'Recursos Humanos & DP', descricao: 'Colaboradores, escalas, ponto e folha.', nivel_hierarquia: 7, usuario_nome: 'Patrícia Rezende (RH & DP)', usuario_email: 'rh@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333308', codigo: 'qualidade', nome: 'Qualidade & BPF', descricao: 'POPs, checklists e bloqueio de lotes.', nivel_hierarquia: 7, usuario_nome: 'Dra. Mariana Pires (Qualidade/BPF)', usuario_email: 'qualidade@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333309', codigo: 'compras', nome: 'Compras & Suprimentos', descricao: 'Cotações, pedidos e fornecedores.', nivel_hierarquia: 6, usuario_nome: 'Thiago Alencar (Suprimentos)', usuario_email: 'compras@docegestao.demo.br' },
  { id: '33333333-3333-3333-3333-333333333310', codigo: 'auditor', nome: 'Auditor Interno / LGPD', descricao: 'Trilhas de auditoria, LGPD e backup.', nivel_hierarquia: 8, usuario_nome: 'Dr. Eduardo Queiroz (Auditor/DPO)', usuario_email: 'auditor@docegestao.demo.br' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [perfisDisponiveis, setPerfisDisponiveis] = useState<PerfilDemo[]>(PERFIS_FALLBACK);
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilDemo>(() => {
    const salvo = localStorage.getItem('docegestao_perfil_codigo');
    if (!salvo || salvo === 'visitante') return PERFIL_VISITANTE;
    return PERFIS_FALLBACK.find((p) => p.codigo === salvo) || PERFIL_VISITANTE;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function carregarPerfisSupabase() {
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome_exibicao, email, perfis_acesso(id, codigo, nome, descricao, nivel_hierarquia)');

      if (!error && data && data.length > 0) {
        const mapeados: PerfilDemo[] = data
          .filter((u: any) => u.perfis_acesso)
          .map((u: any) => ({
            id: u.perfis_acesso.id,
            codigo: u.perfis_acesso.codigo,
            nome: u.perfis_acesso.nome,
            descricao: u.perfis_acesso.descricao || '',
            nivel_hierarquia: u.perfis_acesso.nivel_hierarquia,
            usuario_nome: u.nome_exibicao,
            usuario_email: u.email,
          }))
          .sort((a: PerfilDemo, b: PerfilDemo) => b.nivel_hierarquia - a.nivel_hierarquia);

        if (mapeados.length > 0) {
          setPerfisDisponiveis(mapeados);
        }
      }
    }

    carregarPerfisSupabase();
  }, []);

  const selecionarPerfilDemo = (codigo: string) => {
    const encontrado = perfisDisponiveis.find((p) => p.codigo === codigo);
    if (encontrado) {
      setPerfilAtivo(encontrado);
      localStorage.setItem('docegestao_perfil_codigo', codigo);
    }
  };

  const entrarModoVisitante = () => {
    setPerfilAtivo(PERFIL_VISITANTE);
    localStorage.setItem('docegestao_perfil_codigo', 'visitante');
  };

  const modoSomenteLeitura = perfilAtivo.codigo === 'visitante' || perfilAtivo.codigo === 'auditor';
  const podeAprovar = ['diretor', 'gerente_geral'].includes(perfilAtivo.codigo);

  const podeEditar = () => !modoSomenteLeitura;

  return (
    <AuthContext.Provider
      value={{
        perfilAtivo,
        perfisDisponiveis,
        modoSomenteLeitura,
        selecionarPerfilDemo,
        entrarModoVisitante,
        podeEditar,
        podeAprovar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}