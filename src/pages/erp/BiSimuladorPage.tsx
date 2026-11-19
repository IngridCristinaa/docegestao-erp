import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Sliders, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import { formatBRL } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const BiSimuladorPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [ticketMedio, setTicketMedio] = useState<number>(25);
  const [faturamentoM1, setFaturamentoM1] = useState<number>(105000);
  const [crescimentoMensal, setCrescimentoMensal] = useState<number>(10000);
  const [pctSalao, setPctSalao] = useState<number>(50);
  const [pctDelivery, setPctDelivery] = useState<number>(30);
  const [aliquotaPresumido, setAliquotaPresumido] = useState<number>(11.33);
  const [salvoMsg, setSalvoMsg] = useState(false);

  const pctEncomendas = Math.max(0, 100 - pctSalao - pctDelivery);

  const mesesSimulados = Array.from({ length: 6 }, (_, i) => {
    const fatBruto = faturamentoM1 + i * crescimentoMensal;
    const pedidosMes = Math.round(fatBruto / Math.max(1, ticketMedio));
    const impostos = fatBruto * (aliquotaPresumido / 100);
    const cmv = fatBruto * 0.29;
    const taxasCanais = fatBruto * ((pctDelivery / 100) * 0.08 + (pctSalao / 100) * 0.018);
    const despFixa = 34800;
    const lucroLiquido = fatBruto - impostos - cmv - taxasCanais - despFixa;

    return {
      mes: `Mês ${i + 1}`,
      faturamento: Math.round(fatBruto),
      custosTotais: Math.round(impostos + cmv + taxasCanais + despFixa),
      lucroLiquido: Math.round(lucroLiquido),
      pedidosMes,
      producaoDiariaSkus: Math.round((pedidosMes * 1.4) / 30),
    };
  });

  const resetarPremissas = () => {
    setTicketMedio(25);
    setFaturamentoM1(105000);
    setCrescimentoMensal(10000);
    setPctSalao(50);
    setPctDelivery(30);
    setAliquotaPresumido(11.33);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E8D4BC] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#701D2B]">
            Business Intelligence & Modelagem Preditiva de Cenários
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#542C20]">
            Simulador Interativo de Premissas de Negócio
          </h1>
          <p className="text-xs text-[#7F7269] mt-1">
            Altere ticket médio, mix de canais e carga tributária para observar os impactos imediatos na produção, demanda e DRE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetarPremissas}
            className="px-3.5 py-2 rounded-lg border border-[#E8D4BC] hover:bg-[#F5E8D8] text-xs font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Documento Mestre
          </button>
          {podeEditar() && (
            <button
              onClick={() => {
                setSalvoMsg(true);
                setTimeout(() => setSalvoMsg(false), 3000);
              }}
              className="px-4 py-2 rounded-lg bg-[#701D2B] text-white hover:bg-[#53131E] text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Cenário
            </button>
          )}
        </div>
      </div>

      {salvoMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Cenário simulado atualizado na sessão demonstrativa!
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Painel de Sliders */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E8D4BC] space-y-5">
          <div className="flex items-center gap-2 text-[#701D2B] font-bold text-sm border-b border-[#E8D4BC] pb-3">
            <Sliders className="w-4 h-4" />
            Parâmetros Ajustáveis
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Ticket Médio de Referência</span>
              <span className="text-[#701D2B]">{formatBRL(ticketMedio)}</span>
            </div>
            <input
              type="range"
              min={15}
              max={65}
              step={1}
              value={ticketMedio}
              onChange={(e) => setTicketMedio(Number(e.target.value))}
              className="w-full accent-[#701D2B]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Faturamento Inicial (Mês 1)</span>
              <span className="text-[#701D2B]">{formatBRL(faturamentoM1)}</span>
            </div>
            <input
              type="range"
              min={70000}
              max={180000}
              step={5000}
              value={faturamentoM1}
              onChange={(e) => setFaturamentoM1(Number(e.target.value))}
              className="w-full accent-[#701D2B]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Incremento Mensal Projetado</span>
              <span className="text-[#701D2B]">+{formatBRL(crescimentoMensal)}/mês</span>
            </div>
            <input
              type="range"
              min={0}
              max={25000}
              step={2500}
              value={crescimentoMensal}
              onChange={(e) => setCrescimentoMensal(Number(e.target.value))}
              className="w-full accent-[#701D2B]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Participação Salão & Balcão</span>
              <span className="text-[#701D2B]">{pctSalao}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={70}
              step={5}
              value={pctSalao}
              onChange={(e) => {
                const novoSalao = Number(e.target.value);
                setPctSalao(novoSalao);
                if (novoSalao + pctDelivery > 95) setPctDelivery(95 - novoSalao);
              }}
              className="w-full accent-[#C69A55]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Participação Delivery</span>
              <span className="text-[#701D2B]">{pctDelivery}% (Encomendas: {pctEncomendas}%)</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={pctDelivery}
              onChange={(e) => {
                const novoDel = Number(e.target.value);
                if (pctSalao + novoDel <= 95) setPctDelivery(novoDel);
              }}
              className="w-full accent-[#C69A55]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Alíquota Tributária Simulada</span>
              <span className="text-[#701D2B]">{aliquotaPresumido.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={6}
              max={18}
              step={0.5}
              value={aliquotaPresumido}
              onChange={(e) => setAliquotaPresumido(Number(e.target.value))}
              className="w-full accent-[#542C20]"
            />
          </div>
        </div>

        {/* Gráfico Comparativo e Tabela de Impacto */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8D4BC]">
            <h2 className="font-serif text-xl font-bold text-[#542C20] mb-1">
              Impacto Financeiro Semestral Simulado
            </h2>
            <p className="text-xs text-[#7F7269] mb-4">
              Comparação entre Receita Bruta, Custos/Despesas Totais e Lucro Líquido em cada mês.
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mesesSimulados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D4BC" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="faturamento" name="Faturamento Bruto" fill="#701D2B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="custosTotais" name="Custos & Impostos" fill="#A99B91" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="#C69A55" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#701D2B] text-[#F5E8D8]">
                <tr>
                  <th className="p-3">Período</th>
                  <th className="p-3">Faturamento</th>
                  <th className="p-3">Pedidos/Mês</th>
                  <th className="p-3">Produção Diária Est.</th>
                  <th className="p-3">Lucro Líquido Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D4BC]">
                {mesesSimulados.map((m) => (
                  <tr key={m.mes} className="hover:bg-[#FBF5EE]">
                    <td className="p-3 font-semibold">{m.mes}</td>
                    <td className="p-3">{formatBRL(m.faturamento)}</td>
                    <td className="p-3">{m.pedidosMes.toLocaleString('pt-BR')} pedidos</td>
                    <td className="p-3">{m.producaoDiariaSkus} unidades/dia</td>
                    <td className="p-3 font-bold text-[#701D2B]">{formatBRL(m.lucroLiquido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};