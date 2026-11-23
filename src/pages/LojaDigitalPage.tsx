import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Sparkles,
  Coffee,
  CakeSlice,
} from 'lucide-react';
import { supabase, formatBRL, isSupabaseConfigured } from '../lib/supabase';

interface ProdutoVitrine {
  id: string;
  codigo_sku: string;
  nome: string;
  descricao: string;
  preco_delivery: number;
  alergenicos: string[];
  imagem_url?: string | null;
}

const TAXAS_GOIANIA_10KM = [
  { bairro: 'Setor Sul (Até 2 km)', distancia: 1.5, taxa: 6.0 },
  { bairro: 'Setor Marista (Até 4 km)', distancia: 3.4, taxa: 9.5 },
  { bairro: 'Setor Bueno / Oeste (Até 6 km)', distancia: 5.8, taxa: 12.0 },
  { bairro: 'Jardim Goiás / Flamboyant (Até 8 km)', distancia: 7.6, taxa: 15.0 },
  { bairro: 'Setor Jaó / Alto da Glória (Até 10 km)', distancia: 9.8, taxa: 18.0 },
];

const FOTOS_POR_SKU: Record<string, string> = {
  'SKU-001': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSL7BvTG6zQS6HXBawmWvCx6vKoU0PgQWByVTgywOgEHhbiYK4nYF-5hgI&s=10',
  'SKU-002': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
  'SKU-003': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
  'SKU-004': 'https://copra.com.br/wp-content/uploads/2021/07/IMG_3658-2-1.jpg',
  'SKU-005': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFKshFyKb8HqM4YBWbObM9OX-ADOf8TcQxha2G72xKzg&s=10',
  'SKU-006': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnVNlj49Q2wWa3OpoF5GGKBQ7e-bGhZph1CMH7RFQwaw&s=10',
  'SKU-007': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  'SKU-008': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0iAVhC4hMNte8lykxCiVDYs73dp_OUA90hrztqbGl2DoJ4aKG-PhRb7E&s=10',
  'SKU-009': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  'SKU-010': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80',
  'SKU-011': 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80',
  'SKU-012': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgZCRimc2EQtr5DS3J99RE2aJzWGWYNew9r5FI3lbDmw&s=10',
  'SKU-013': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80',
  'SKU-014': 'https://www.estadao.com.br/resizer/v2/ZCPBAHPOLFLLZELK5UWYAYR7DE.jpg?auth=5fcd6530019fb5ce32d54d6aa4bc39e3c33ec4870ec6ac9d00a37eaeda6b8215',
  'SKU-015': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcDYAfzhMIlXzH9KQATs4kNDX0TRFZlC9wPJxkOXll7i2H37e4VRtquyM&s=10',
  'SKU-016': 'https://media.istockphoto.com/id/1408941134/pt/foto/tasty-mine-banoffee-pie-banoffee-tartlet.jpg?s=612x612&w=0&k=20&c=wqcXlCPX-IfZh3iDxXW4dNireJnbKT4r3g_IE2B2sK0=',
  'SKU-017': 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/9484c4a6eed08f7b1ff547ab7b37425f/Derivates/7d52d28874c2374d7bc0b1f4f9af502e12b43ca9.jpg',
  'SKU-018': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
  'SKU-019': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOtNoEInCVE-uWxg5spjYgE59orBQW3Kfd2WrlYS1ILW-v_SJbf4tPvn4&s=10',
  'SKU-020': 'https://docemaison.com.br/wp-content/uploads/2020/08/DM-229-scaled-e1698773164106.jpg',
  'SKU-021': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
  'SKU-022': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  'SKU-023': 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80',
  'SKU-024': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3BqS3MzEeFCQL_DpCJP5t-F-5bhzRJF4uM6RaMKpReg&s=10',
  'SKU-025': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfaKgsllVvS47n-0e_Hh6b9xwI9DAGZWCQGiiH6QtEh96mkjYBGaIOTPts&s=10',
  'SKU-026': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
  'SKU-027': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
  'SKU-028': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
};

export const LojaDigitalPage: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoVitrine[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'confeitaria' | 'cafeteria'>('todos');
  const [carrinho, setCarrinho] = useState<{ produto: ProdutoVitrine; qtd: number }[]>([]);
  const [regiaoEntrega, setRegiaoEntrega] = useState(TAXAS_GOIANIA_10KM[1]);
  const [tipoRecebimento, setTipoRecebimento] = useState<'entrega' | 'retirada'>('entrega');
  const [pedidoFinalizado, setPedidoFinalizado] = useState<string | null>(null);
  const [imagensComErro, setImagensComErro] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregarVitrine() {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from('produtos')
        .select('id, codigo_sku, nome, descricao, preco_delivery, alergenicos, imagem_url')
        .eq('ativo', true)
        .eq('visivel_loja_digital', true)
        .order('codigo_sku', { ascending: true });

      if (data && data.length > 0) {
        setProdutos(data);
      }
    }
    carregarVitrine();
  }, []);

  const ehCafeteria = (sku: string) =>
    sku.startsWith('SKU-02') && Number(sku.slice(-2)) >= 21;

  const produtosFiltrados = produtos.filter((p) => {
    if (filtroCategoria === 'cafeteria') return ehCafeteria(p.codigo_sku);
    if (filtroCategoria === 'confeitaria') return !ehCafeteria(p.codigo_sku);
    return true;
  });

  const obterFoto = (prod: ProdutoVitrine): string | null => {
    if (FOTOS_POR_SKU[prod.codigo_sku]) return FOTOS_POR_SKU[prod.codigo_sku];
    if (prod.imagem_url && prod.imagem_url.trim().length > 5) return prod.imagem_url;
    return null;
  };

  const adicionarAoCarrinho = (produto: ProdutoVitrine) => {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.produto.id === produto.id);
      if (existe) {
        return prev.map((i) => (i.produto.id === produto.id ? { ...i, qtd: i.qtd + 1 } : i));
      }
      return [...prev, { produto, qtd: 1 }];
    });
  };

  const alterarQtd = (id: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.produto.id === id ? { ...i, qtd: i.qtd + delta } : i))
        .filter((i) => i.qtd > 0)
    );
  };

  const subtotal = carrinho.reduce((acc, i) => acc + Number(i.produto.preco_delivery) * i.qtd, 0);
  const taxaEntrega = tipoRecebimento === 'entrega' && subtotal > 0 ? regiaoEntrega.taxa : 0;
  const total = subtotal + taxaEntrega;

  const finalizarCheckoutSimulado = () => {
    const codigo = `WEB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setPedidoFinalizado(codigo);
    setCarrinho([]);
  };

  return (
    <div className="min-h-screen bg-[#FBF5EE] text-[#542C20]">
      <header className="bg-[#701D2B] text-[#F5E8D8] py-4 px-6 border-b border-[#C69A55]/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs flex items-center gap-1 text-[#C69A55] hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Portal
            </Link>
            <span className="font-serif text-2xl font-bold">
              Doce<span className="text-[#C69A55]">Gestão</span> • Vitrine Digital
            </span>
          </div>
          <Link
            to="/erp/dashboard"
            className="px-3.5 py-1.5 rounded-lg bg-[#C69A55] text-[#3A1D14] text-xs font-semibold hover:bg-[#DFBC82]"
          >
            Painel ERP
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* Catálogo dos 28 SKUs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#701D2B]">
                Pâtisserie Francesa & Cafeteria Especializada
              </h1>
              <p className="text-xs text-[#7F7269]">
                Catálogo sincronizado diretamente com o cadastro mestre do ERP ({produtos.length} SKUs disponíveis).
              </p>
            </div>
            <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[#E8D4BC]">
              {(['todos', 'confeitaria', 'cafeteria'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filtroCategoria === cat ? 'bg-[#701D2B] text-white' : 'text-[#542C20] hover:bg-[#F5E8D8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {produtosFiltrados.map((prod) => {
              const fotoUrl = obterFoto(prod);
              const exibirFoto = Boolean(fotoUrl) && !imagensComErro[prod.id];

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-[#E8D4BC] overflow-hidden flex flex-col justify-between hover:border-[#C69A55] hover:shadow-md transition-all group"
                >
                  <div>
                    {exibirFoto ? (
                      <div className="relative h-48 w-full overflow-hidden bg-[#F5E8D8]">
                        <img
                          src={fotoUrl!}
                          alt={prod.nome}
                          loading="lazy"
                          onError={() =>
                            setImagensComErro((prev) => ({ ...prev, [prod.id]: true }))
                          }
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#542C20]/85 text-[#F5E8D8]">
                          {prod.codigo_sku}
                        </span>
                        <span className="absolute bottom-3 right-3 font-serif text-base font-bold px-3 py-1 rounded-xl bg-white/95 text-[#701D2B] shadow-sm">
                          {formatBRL(prod.preco_delivery)}
                        </span>
                      </div>
                    ) : (
                      <div className="px-5 pt-5 pb-1 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F5E8D8] text-[#701D2B]">
                          {ehCafeteria(prod.codigo_sku) ? (
                            <Coffee className="w-3 h-3 text-[#C69A55]" />
                          ) : (
                            <CakeSlice className="w-3 h-3 text-[#C69A55]" />
                          )}
                          {prod.codigo_sku} • {ehCafeteria(prod.codigo_sku) ? 'Cafeteria' : 'Pâtisserie'}
                        </span>
                        <span className="font-serif text-xl font-bold text-[#701D2B]">
                          {formatBRL(prod.preco_delivery)}
                        </span>
                      </div>
                    )}

                    <div className="p-5 pt-3 pb-2">
                      <h3 className="font-serif text-xl font-bold text-[#542C20]">{prod.nome}</h3>
                      <p className="text-xs text-[#7F7269] mt-1.5 leading-relaxed">{prod.descricao}</p>
                      {prod.alergenicos && prod.alergenicos.length > 0 && (
                        <p className="text-[10px] text-amber-800 mt-2.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 inline-block">
                          Alergênicos: {prod.alergenicos.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-3">
                    <button
                      onClick={() => adicionarAoCarrinho(prod)}
                      className="w-full py-2.5 rounded-xl bg-[#F5E8D8] hover:bg-[#701D2B] text-[#701D2B] hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar ao Pedido
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrinho & Checkout Simulado */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E8D4BC] sticky top-24 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8D4BC] pb-3">
              <span className="font-serif text-xl font-bold flex items-center gap-2 text-[#701D2B]">
                <ShoppingCart className="w-5 h-5" />
                Seu Pedido
              </span>
              <span className="text-xs font-semibold bg-[#F5E8D8] px-2.5 py-0.5 rounded-full">
                {carrinho.reduce((a, b) => a + b.qtd, 0)} itens
              </span>
            </div>

            {pedidoFinalizado && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Pedido Simulado Registrado!
                </p>
                <p>Protocolo: <strong>{pedidoFinalizado}</strong>. Nenhuma cobrança real foi efetuada.</p>
              </div>
            )}

            {carrinho.length === 0 ? (
              <p className="text-xs text-[#7F7269] py-6 text-center">
                Selecione itens do catálogo ao lado para simular um pedido na vitrine digital.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {carrinho.map(({ produto, qtd }) => {
                  const fotoMini = obterFoto(produto);
                  return (
                    <div key={produto.id} className="flex items-center justify-between text-xs bg-[#FBF5EE] p-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5 pr-2">
                        {fotoMini && !imagensComErro[produto.id] && (
                          <img
                            src={fotoMini}
                            alt={produto.nome}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E8D4BC]"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-[#542C20]">{produto.nome}</p>
                          <p className="text-[#7F7269]">{formatBRL(produto.preco_delivery * qtd)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => alterarQtd(produto.id, -1)} className="p-1 rounded bg-white border border-[#E8D4BC]">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{qtd}</span>
                        <button onClick={() => alterarQtd(produto.id, 1)} className="p-1 rounded bg-white border border-[#E8D4BC]">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-[#E8D4BC] pt-3 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTipoRecebimento('entrega')}
                  className={`py-2 rounded-lg font-semibold border ${
                    tipoRecebimento === 'entrega' ? 'bg-[#701D2B] text-white border-[#701D2B]' : 'border-[#E8D4BC]'
                  }`}
                >
                  Entrega (até 10 km)
                </button>
                <button
                  onClick={() => setTipoRecebimento('retirada')}
                  className={`py-2 rounded-lg font-semibold border ${
                    tipoRecebimento === 'retirada' ? 'bg-[#701D2B] text-white border-[#701D2B]' : 'border-[#E8D4BC]'
                  }`}
                >
                  Retirada Setor Sul
                </button>
              </div>

              {tipoRecebimento === 'entrega' && (
                <div>
                  <label className="text-[11px] font-semibold text-[#7F7269] flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-[#701D2B]" />
                    Região de Entrega em Goiânia:
                  </label>
                  <select
                    value={regiaoEntrega.bairro}
                    onChange={(e) => {
                      const sel = TAXAS_GOIANIA_10KM.find((r) => r.bairro === e.target.value);
                      if (sel) setRegiaoEntrega(sel);
                    }}
                    className="w-full p-2 rounded-lg border border-[#E8D4BC] bg-[#FBF5EE] text-xs"
                  >
                    {TAXAS_GOIANIA_10KM.map((r) => (
                      <option key={r.bairro} value={r.bairro}>
                        {r.bairro} — {formatBRL(r.taxa)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1 pt-2 text-xs">
                <div className="flex justify-between text-[#7F7269]">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#7F7269]">
                  <span>Taxa de Entrega</span>
                  <span>{formatBRL(taxaEntrega)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#701D2B] pt-1 border-t border-[#E8D4BC]">
                  <span>Total Simulado</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              <button
                disabled={carrinho.length === 0}
                onClick={finalizarCheckoutSimulado}
                className="w-full py-3 rounded-xl bg-[#C69A55] hover:bg-[#DFBC82] disabled:opacity-40 text-[#3A1D14] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Finalizar Pedido Demonstrativo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LojaDigitalPage;