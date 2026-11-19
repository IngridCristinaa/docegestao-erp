import React, { useEffect, useState } from 'react';
import { Monitor, Users, Receipt, PlusCircle, CheckCircle2 } from 'lucide-react';
import { supabase, formatBRL, formatDateBR, isSupabaseConfigured } from '../../lib/supabase';
import { ModuloHeader } from '../../components/shared/ModuloHeader';
import { useAuth } from '../../contexts/AuthContext';

export const ComercialPdvPage: React.FC = () => {
  const { podeEditar } = useAuth();
  const [caixas, setCaixas] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [canalNovo, setCanalNovo] = useState('balcao');
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [qtdNovo, setQtdNovo] = useState(1);
  const [formaPgto, setFormaPgto] = useState('pix');
  const [feedback, setFeedback] = useState<string | null>(null);

  const carregarDados = async () => {
    if (!isSupabaseConfigured) return;
    const [{ data: cx }, { data: ms }, { data: pd }, { data: pr }] = await Promise.all([
      supabase.from('caixa_sessoes').select('*, caixas(codigo, nome, canal_padrao)').order('created_at', { ascending: false }),
      supabase.from('mesas').select('*').order('numero', { ascending: true }),
      supabase.from('pedidos').select('*, clientes(nome)').order('data_pedido', { ascending: false }).limit(15),
      supabase.from('produtos').select('id, codigo_sku, nome, preco_salao_balcao, preco_delivery, custo_unitario_atual').eq('ativo', true).order('codigo_sku'),
    ]);
    if (cx) setCaixas(cx);
    if (ms) setMesas(ms);
    if (pd) setPedidos(pd);
    if (pr && pr.length > 0) {
      setProdutos(pr);
      if (!produtoSelecionado) setProdutoSelecionado(pr[0].id);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const registrarVendaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = produtos.find((p) => p.id === produtoSelecionado);
    if (!prod || !isSupabaseConfigured) return;

    const preco = canalNovo === 'delivery' ? Number(prod.preco_delivery) : Number(prod.preco_salao_balcao);
    const numPedido = `PED-2026-${Math.floor(2000 + Math.random() * 7999)}`;

    const { data: novoPed, error } = await supabase
      .from('pedidos')
      .insert({
        unidade_id: '11111111-1111-1111-1111-111111111101',
        numero_pedido: numPedido,
        canal: canalNovo,
        origem: 'pdv',
        forma_pagamento: formaPgto,
        status: 'entregue',
      })
      .select()
      .single();

    if (!error && novoPed) {
      await supabase.from('pedido_itens').insert({
        pedido_id: novoPed.id,
        produto_id: prod.id,
        quantidade: qtdNovo,
        preco_unitario: preco,
        custo_unitario_momento: prod.custo_unitario_atual,
      });

      setFeedback(`Venda ${numPedido} (${formatBRL(preco * qtdNovo)}) registrada no PostgreSQL!`);
      carregarDados();
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <ModuloHeader
        categoria="Módulo 5.3 • Comercial, PDV & Salão"
        titulo="Frente de Caixa, Mesas & Pedidos"
        descricao="Controle individualizado dos caixas CX001–CX003, ocupação dos 36 lugares e lançamento simulado de vendas."
        dadosExportacao={pedidos}
        nomeArquivoCsv="vendas_docegestao.csv"
      />

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          {feedback}
        </div>
      )}

      {/* Status dos 3 Caixas (CX001, CX002, CX003) */}
      <div className="grid md:grid-cols-3 gap-4">
        {caixas.map((sessao) => (
          <div key={sessao.id} className="bg-white p-5 rounded-2xl border border-[#E8D4BC]">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-[#701D2B] text-white text-xs font-bold">
                {sessao.caixas?.codigo}
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {sessao.status}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold mt-2 text-[#542C20]">{sessao.caixas?.nome}</h3>
            <div className="mt-3 pt-3 border-t border-[#F5E8D8] flex justify-between text-xs">
              <span className="text-[#7F7269]">Fundo Inicial: {formatBRL(sessao.saldo_inicial)}</span>
              <span className="font-bold text-[#701D2B]">Saldo: {formatBRL(sessao.saldo_final_sistema)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Mapa das 10 Mesas (36 lugares) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E8D4BC]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#542C20] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#701D2B]" />
                Mapa de Mesas do Salão (Capacidade: 36 Lugares)
              </h2>
              <p className="text-xs text-[#7F7269]">Distribuição por zona: Vitrine, Salão Principal e Varanda.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {mesas.map((m) => {
              const corStatus =
                m.status === 'ocupada'
                  ? 'bg-[#701D2B] text-white border-[#701D2B]'
                  : m.status === 'reservada'
                  ? 'bg-[#C69A55]/25 text-[#542C20] border-[#C69A55]'
                  : 'bg-[#FBF5EE] text-[#542C20] border-[#E8D4BC]';
              return (
                <div key={m.id} className={`p-3 rounded-xl border text-center ${corStatus}`}>
                  <p className="font-serif text-lg font-bold">Mesa {String(m.numero).padStart(2, '0')}</p>
                  <p className="text-[11px] opacity-85">{m.lugares} lugares</p>
                  <span className="inline-block mt-1.5 text-[10px] uppercase font-bold tracking-wider">
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lançamento Rápido PDV */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E8D4BC]">
          <h2 className="font-serif text-xl font-bold text-[#542C20] flex items-center gap-2 mb-3">
            <Monitor className="w-5 h-5 text-[#701D2B]" />
            Simulador Rápido de Venda PDV
          </h2>
          <form onSubmit={registrarVendaRapida} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Produto (28 SKUs)</label>
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE]"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_sku} — {p.nome} ({formatBRL(p.preco_salao_balcao)})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold block mb-1">Canal</label>
                <select
                  value={canalNovo}
                  onChange={(e) => setCanalNovo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE]"
                >
                  <option value="balcao">Balcão</option>
                  <option value="salao">Salão</option>
                  <option value="delivery">Delivery</option>
                  <option value="encomenda">Encomenda</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Qtd.</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={qtdNovo}
                  onChange={(e) => setQtdNovo(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Pagamento</label>
                <select
                  value={formaPgto}
                  onChange={(e) => setFormaPgto(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE]"
                >
                  <option value="pix">Pix</option>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={!podeEditar()}
              className="w-full py-2.5 rounded-xl bg-[#701D2B] hover:bg-[#53131E] disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {podeEditar() ? 'Registrar Pedido no Banco' : 'Alterne para Perfil Operacional para Vender'}
            </button>
          </form>
        </div>
      </div>

      {/* Histórico de Pedidos */}
      <div className="bg-white rounded-2xl border border-[#E8D4BC] overflow-x-auto">
        <div className="p-4 border-b border-[#E8D4BC] flex items-center gap-2 font-serif text-lg font-bold">
          <Receipt className="w-5 h-5 text-[#701D2B]" />
          Últimos Pedidos Registrados
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-[#F5E8D8]/70 text-[#542C20] font-semibold">
            <tr>
              <th className="p-3">Nº Pedido</th>
              <th className="p-3">Data</th>
              <th className="p-3">Canal</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Pagamento</th>
              <th className="p-3">Valor Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8D4BC]">
            {pedidos.map((p) => (
              <tr key={p.id} className="hover:bg-[#FBF5EE]">
                <td className="p-3 font-bold text-[#701D2B]">{p.numero_pedido}</td>
                <td className="p-3">{formatDateBR(p.data_pedido)}</td>
                <td className="p-3 uppercase">{p.canal}</td>
                <td className="p-3">{p.clientes?.nome || 'Consumidor Balcão'}</td>
                <td className="p-3 uppercase">{p.forma_pagamento}</td>
                <td className="p-3 font-bold">{formatBRL(p.valor_total)}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};