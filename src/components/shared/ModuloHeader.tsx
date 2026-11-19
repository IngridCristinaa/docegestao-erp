import React from 'react';
import { Download, Plus, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ModuloHeaderProps {
  categoria: string;
  titulo: string;
  descricao: string;
  dadosExportacao?: any[];
  nomeArquivoCsv?: string;
  textoBotaoNovo?: string;
  onNovoRegistro?: () => void;
}

export const ModuloHeader: React.FC<ModuloHeaderProps> = ({
  categoria,
  titulo,
  descricao,
  dadosExportacao,
  nomeArquivoCsv = 'relatorio_docegestao.csv',
  textoBotaoNovo,
  onNovoRegistro,
}) => {
  const { podeEditar, perfilAtivo } = useAuth();

  const exportarCsv = () => {
    if (!dadosExportacao || dadosExportacao.length === 0) return;
    const colunas = Object.keys(dadosExportacao[0]);
    const linhas = [
      colunas.join(';'),
      ...dadosExportacao.map((row) =>
        colunas.map((c) => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(';')
      ),
    ];
    const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivoCsv;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E8D4BC] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#701D2B]">
          {categoria}
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#542C20]">{titulo}</h1>
        <p className="text-xs text-[#7F7269] mt-0.5">{descricao}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {dadosExportacao && dadosExportacao.length > 0 && (
          <button
            onClick={exportarCsv}
            className="px-3.5 py-2 rounded-lg border border-[#E8D4BC] hover:bg-[#F5E8D8] text-xs font-semibold text-[#542C20] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#701D2B]" />
            Exportar CSV
          </button>
        )}

        {textoBotaoNovo && (
          podeEditar() ? (
            <button
              onClick={onNovoRegistro}
              className="px-4 py-2 rounded-lg bg-[#701D2B] hover:bg-[#53131E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {textoBotaoNovo}
            </button>
          ) : (
            <span
              title={`Perfil ${perfilAtivo.nome} em modo somente leitura`}
              className="px-3 py-2 rounded-lg bg-[#F5E8D8] text-[#7F7269] text-xs font-medium flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Somente Leitura
            </span>
          )
        )}
      </div>
    </div>
  );
};