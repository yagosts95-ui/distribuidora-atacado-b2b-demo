import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BarChart3, Beef, Box, CheckCircle2, ChevronRight, ClipboardList,
  Flame, Home, Menu, Minus, PackageCheck, Plus, Search, Send, ShoppingCart,
  Snowflake, Store, Truck, UserRound, X
} from "lucide-react";
import { categories, featuredCodes, products, type CategoryId, type Product } from "./data/products";
import "./premium.css";

type Cart = Record<string, number>;
type StoreView = "home" | "catalog" | "cart" | "checkout" | "success";
type Status = "Novo" | "Em separação" | "Saiu para entrega" | "Concluído";
type DemoOrder = {
  id: string;
  client: string;
  phone: string;
  city: string;
  delivery: "Entrega" | "Retirada";
  note: string;
  total: number;
  itemCount: number;
  status: Status;
  createdAt: string;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const photoByCode: Record<string, string> = {
  "6605": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=900&q=82",
  "5803": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=82",
  "5211": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=82",
  "5305": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=82",
  "5307": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=82",
  "6606": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=82"
};

const fallbackPhotos = Object.values(photoByCode);

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={"mh-brand " + (inverse ? "mh-brand--inverse" : "")}>
      <div className="mh-seal">
        <div className="mh-cow"><Beef size={24} strokeWidth={1.7} /></div>
        <b>MH</b>
      </div>
      <div className="mh-brand-copy">
        <strong>MH Distribuidora</strong>
        <span>Atacado de carnes e alimentos</span>
      </div>
    </div>
  );
}

function ProductPhoto({ product, hero = false }: { product: Product; hero?: boolean }) {
  const idx = Number(product.code.slice(-1)) % fallbackPhotos.length;
  const url = photoByCode[product.code] || fallbackPhotos[idx];
  return (
    <div className={"mh-product-photo " + (hero ? "mh-product-photo--hero" : "")}>
      <img src={url} alt={product.name} loading={hero ? "eager" : "lazy"} />
      {!hero && <span>MH</span>}
    </div>
  );
}

function CategoryIcon({ id }: { id: CategoryId }) {
  if (id === "grill") return <Flame size={20} />;
  if (id === "congelados") return <Snowflake size={20} />;
  if (id === "dianteiro") return <Beef size={20} />;
  return <PackageCheck size={20} />;
}

function Qty({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="mh-qty">
      <button onClick={() => onChange(Math.max(0, value - 1))} aria-label="Diminuir"><Minus size={14}/></button>
      <strong>{value}</strong>
      <button onClick={() => onChange(value + 1)} aria-label="Aumentar"><Plus size={14}/></button>
    </div>
  );
}

function ProductCard({ product, quantity, onQuantity }: { product: Product; quantity: number; onQuantity: (n:number)=>void }) {
  return (
    <article className="mh-product-card">
      <ProductPhoto product={product} />
      <div className="mh-product-card__body">
        <div>
          <h3>{product.name}</h3>
          <span className="mh-sku">SKU {product.code}</span>
        </div>
        <div className="mh-price-line">
          <div><strong>{money.format(product.price)}</strong><small>/ kg*</small></div>
          {quantity > 0 ? <Qty value={quantity} onChange={onQuantity}/> :
            <button className="mh-add" onClick={() => onQuantity(1)}><ShoppingCart size={15}/>Adicionar</button>}
        </div>
      </div>
    </article>
  );
}

function Storefront() {
  const [view, setView] = useState<StoreView>("home");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [search, setSearch] = useState("");
  const [orderId, setOrderId] = useState("");
  const [cart, setCart] = useState<Cart>(() => {
    try { return JSON.parse(localStorage.getItem("mh-demo-cart") || "{}"); } catch { return {}; }
  });
  const [form, setForm] = useState({
    client: "", phone: "", city: "Goiânia", delivery: "Entrega" as "Entrega" | "Retirada", note: ""
  });

  useEffect(() => localStorage.setItem("mh-demo-cart", JSON.stringify(cart)), [cart]);
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [view]);

  const items = useMemo(() => Object.entries(cart)
    .filter(([,q]) => q > 0)
    .map(([code,qty]) => ({ product: products.find(p=>p.code===code)!, qty }))
    .filter(x=>x.product), [cart]);

  const itemCount = items.reduce((a,b)=>a+b.qty,0);
  const total = items.reduce((a,b)=>a+(b.product.price*b.qty),0);

  const filtered = products.filter(p => {
    const term = search.trim().toLowerCase();
    return (category === "all" || p.category === category) &&
      (!term || p.name.toLowerCase().includes(term) || p.code.includes(term));
  });

  const setQty = (code:string, qty:number) => setCart(c => ({...c,[code]:qty}));
  const openCategory = (id: CategoryId) => { setCategory(id); setView("catalog"); };
  const openCatalog = () => { setCategory("all"); setView("catalog"); };

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client.trim() || !form.phone.trim() || !itemCount) return;
    const id = "MH-" + String(Date.now()).slice(-5);
    const order: DemoOrder = {
      id, client: form.client.trim(), phone: form.phone.trim(), city: form.city.trim() || "Goiânia",
      delivery: form.delivery, note: form.note.trim(), total, itemCount, status: "Novo", createdAt: new Date().toISOString()
    };
    let current: DemoOrder[] = [];
    try { current = JSON.parse(localStorage.getItem("mh-demo-orders") || "[]"); } catch {}
    localStorage.setItem("mh-demo-orders", JSON.stringify([order,...current].slice(0,30)));
    setOrderId(id); setCart({}); setView("success");
  };

  if (view === "success") {
    return (
      <div className="mh-app">
        <header className="mh-topbar"><Brand/><a href="/admin" className="mh-admin-link">Painel</a></header>
        <main className="mh-success">
          <div className="mh-success-icon"><CheckCircle2 size={42}/></div>
          <span className="mh-kicker">PEDIDO RECEBIDO</span>
          <h1>{orderId}</h1>
          <p>Seu pedido demonstrativo foi registrado e já pode ser visualizado no painel comercial da MH.</p>
          <div className="mh-success-grid">
            <div><span>Status</span><b>Novo pedido</b></div>
            <div><span>Canal</span><b>MH Digital</b></div>
          </div>
          <button className="mh-primary" onClick={()=>setView("home")}>Voltar ao início</button>
          <a className="mh-secondary" href="/admin">Abrir painel gestor</a>
        </main>
      </div>
    );
  }

  return (
    <div className="mh-app">
      <header className="mh-topbar">
        <Brand/>
        <div className="mh-top-actions">
          <button className="mh-icon-btn" onClick={()=>setView("cart")}><ShoppingCart size={20}/>{itemCount>0 && <b>{itemCount}</b>}</button>
        </div>
      </header>

      <main className="mh-store">
        {view === "home" && <>
          <section className="mh-hero">
            <div className="mh-hero__copy">
              <span className="mh-kicker">MH DIGITAL • ATACADO</span>
              <h1>Qualidade para abastecer <em>o seu negócio.</em></h1>
              <p>Carnes selecionadas, entrega rápida e atendimento especializado em um canal próprio da MH.</p>
              <button onClick={openCatalog}>Fazer pedido <ChevronRight size={18}/></button>
            </div>
            <div className="mh-hero__media"><ProductPhoto hero product={products.find(p=>p.code==="5803") || products[0]}/></div>
          </section>

          <button className="mh-search-cta" onClick={openCatalog}><Search size={19}/><span>Buscar produtos, cortes ou SKU...</span></button>

          <section className="mh-section">
            <div className="mh-section-head"><div><span className="mh-kicker">NAVEGUE POR</span><h2>Categorias</h2></div><button onClick={openCatalog}>Ver todos →</button></div>
            <div className="mh-categories">
              {categories.map(c => <button key={c.id} className={"mh-category " + (c.id==="grill"?"active":"")} onClick={()=>openCategory(c.id)}>
                <span><CategoryIcon id={c.id}/></span><b>{c.short}</b>
              </button>)}
            </div>
          </section>

          <section className="mh-section">
            <div className="mh-section-head"><div><span className="mh-kicker">SELEÇÃO MH</span><h2>Produtos em destaque</h2></div><button onClick={openCatalog}>Ver todos →</button></div>
            <div className="mh-products">
              {products.filter(p=>featuredCodes.includes(p.code)).slice(0,6).map(p =>
                <ProductCard key={p.code} product={p} quantity={cart[p.code]||0} onQuantity={q=>setQty(p.code,q)}/>)}
            </div>
            <div className="mh-price-note">* Valores demonstrativos da tabela recebida; sujeitos à confirmação comercial.</div>
          </section>

          <section className="mh-trust">
            <div><Truck size={24}/><span><b>Entrega confiável</b><small>Goiânia e região</small></span></div>
            <div><BarChart3 size={24}/><span><b>Preços competitivos</b><small>Condições no atacado</small></span></div>
            <div><UserRound size={24}/><span><b>Parceiro do seu negócio</b><small>Atendimento humano</small></span></div>
          </section>
        </>}

        {view === "catalog" && <section className="mh-page">
          <div className="mh-page-title"><button onClick={()=>setView("home")}><ArrowLeft size={20}/></button><div><span className="mh-kicker">CATÁLOGO COMPLETO</span><h1>Escolha seus produtos</h1></div></div>
          <label className="mh-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto ou SKU"/>{search && <button onClick={()=>setSearch("")}><X size={16}/></button>}</label>
          <div className="mh-filters">
            <button className={category==="all"?"active":""} onClick={()=>setCategory("all")}>Todos</button>
            {categories.map(c=><button key={c.id} className={category===c.id?"active":""} onClick={()=>setCategory(c.id)}>{c.short}</button>)}
          </div>
          <div className="mh-count"><b>{filtered.length}</b> produtos encontrados</div>
          <div className="mh-products">{filtered.map(p=><ProductCard key={p.code} product={p} quantity={cart[p.code]||0} onQuantity={q=>setQty(p.code,q)}/>)}</div>
          <div className="mh-price-note">* Valores demonstrativos da tabela recebida; sujeitos à confirmação comercial.</div>
        </section>}

        {view === "cart" && <section className="mh-page">
          <div className="mh-page-title"><button onClick={()=>setView("home")}><ArrowLeft size={20}/></button><div><span className="mh-kicker">{itemCount} ITENS</span><h1>Meu Pedido</h1></div></div>
          {!items.length ? <div className="mh-empty"><ShoppingCart size={42}/><h2>Seu pedido está vazio</h2><p>Adicione cortes do catálogo para começar.</p><button className="mh-primary" onClick={openCatalog}>Explorar catálogo</button></div> :
          <>
            <div className="mh-cart-list">{items.map(({product,qty})=><article className="mh-cart-item" key={product.code}>
              <ProductPhoto product={product}/>
              <div className="mh-cart-info"><h3>{product.name}</h3><span>SKU {product.code}</span><b>{money.format(product.price)} / kg*</b></div>
              <Qty value={qty} onChange={q=>setQty(product.code,q)}/>
            </article>)}</div>
            <div className="mh-summary">
              <div><span>Subtotal ({itemCount} itens)</span><b>{money.format(total)}</b></div>
              <div><span>Entrega</span><b>A combinar</b></div>
              <div className="total"><span>Total estimado</span><b>{money.format(total)}</b></div>
              <small>* Valor demonstrativo sujeito à confirmação da equipe comercial.</small>
            </div>
            <button className="mh-primary full" onClick={()=>setView("checkout")}>Continuar pedido <ChevronRight size={18}/></button>
          </>}
        </section>}

        {view === "checkout" && <section className="mh-page mh-checkout">
          <div className="mh-page-title"><button onClick={()=>setView("cart")}><ArrowLeft size={20}/></button><div><span className="mh-kicker">FINALIZAÇÃO</span><h1>Enviar pedido</h1></div></div>
          <form onSubmit={submitOrder}>
            <label>Empresa / Nome<input required value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Ex.: Mercado Central"/></label>
            <label>WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(62) 99999-9999"/></label>
            <label>Cidade<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
            <fieldset><legend>Recebimento</legend><div className="mh-delivery">
              {(["Entrega","Retirada"] as const).map(opt=><button type="button" key={opt} className={form.delivery===opt?"active":""} onClick={()=>setForm({...form,delivery:opt})}>{opt==="Entrega"?<Truck size={19}/>:<Store size={19}/>}<span>{opt}</span>{form.delivery===opt&&<CheckCircle2 size={17}/>}</button>)}
            </div></fieldset>
            <label>Observações <small>(opcional)</small><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Preferência de entrega, horário, observações..."/></label>
            <div className="mh-summary compact"><div><span>{itemCount} itens</span><b>{money.format(total)}</b></div><small>* Valor demonstrativo.</small></div>
            <button className="mh-primary full" type="submit"><Send size={18}/>Enviar pedido</button>
          </form>
        </section>}
      </main>

      <nav className="mh-bottom">
        <button className={view==="home"?"active":""} onClick={()=>setView("home")}><Home size={19}/><span>Início</span></button>
        <button className={view==="catalog"?"active":""} onClick={openCatalog}><Menu size={19}/><span>Categorias</span></button>
        <button className={view==="cart"||view==="checkout"?"active":""} onClick={()=>setView("cart")}><ShoppingCart size={19}/><span>Meu Pedido</span>{itemCount>0&&<b>{itemCount}</b>}</button>
        <a href="/admin"><ClipboardList size={19}/><span>Pedidos</span></a>
      </nav>
    </div>
  );
}

const baseOrders = [
  { id:"MH-1028",client:"Mercado Central",city:"Goiânia",itemCount:12,total:1240,status:"Novo" as Status },
  { id:"MH-1027",client:"Supermercado Goiás",city:"Aparecida de Goiânia",itemCount:8,total:890,status:"Em separação" as Status },
  { id:"MH-1026",client:"Açougue do Povo",city:"Goiânia",itemCount:5,total:560,status:"Saiu para entrega" as Status },
  { id:"MH-1025",client:"Rede Econômica",city:"Trindade",itemCount:21,total:2430,status:"Concluído" as Status },
  { id:"MH-1024",client:"Distribuidora Alves",city:"Goiânia",itemCount:9,total:930,status:"Concluído" as Status }
];

function Badge({ status }: { status: Status }) {
  const cls = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s/g,"-");
  return <span className={"mh-badge "+cls}>{status}</span>;
}

function Admin() {
  const [orders,setOrders] = useState<DemoOrder[]>([]);
  useEffect(()=>{ try{ setOrders(JSON.parse(localStorage.getItem("mh-demo-orders")||"[]")); }catch{} },[]);
  const rows = [...orders,...baseOrders];
  return (
    <div className="mh-admin">
      <aside className="mh-side">
        <Brand inverse/>
        <nav>
          <a className="active" href="/admin"><BarChart3 size={18}/>Visão Geral</a>
          <a href="#pedidos"><ClipboardList size={18}/>Pedidos</a>
          <a href="#clientes"><UserRound size={18}/>Clientes</a>
          <a href="#produtos"><Box size={18}/>Produtos</a>
          <a href="/"><Store size={18}/>Abrir catálogo</a>
        </nav>
        <div className="mh-side-foot"><span>DEMONSTRAÇÃO</span><b>MH Digital</b></div>
      </aside>
      <main className="mh-admin-main">
        <header className="mh-admin-head">
          <div><h1>Painel Comercial</h1><p>Acompanhe seus pedidos e o desempenho das vendas em tempo real.</p></div>
          <div className="mh-user"><span>JS</span><div><b>João Silva</b><small>Comercial</small></div></div>
        </header>

        <section className="mh-metrics">
          <article><i className="red"><ShoppingCart size={22}/></i><div><b>{28+orders.length}</b><span>Novos pedidos</span></div></article>
          <article><i className="yellow"><Box size={22}/></i><div><b>17</b><span>Em separação</span></div></article>
          <article><i className="blue"><Truck size={22}/></i><div><b>12</b><span>Saiu para entrega</span></div></article>
          <article><i className="green"><CheckCircle2 size={22}/></i><div><b>156</b><span>Concluídos</span></div></article>
        </section>

        <section className="mh-panel" id="pedidos">
          <div className="mh-panel-head"><div><h2>Últimos pedidos</h2><span>Operação comercial demonstrativa</span></div><button>Ver todos →</button></div>
          <div className="mh-table-wrap"><table><thead><tr><th># Pedido</th><th>Cliente</th><th>Cidade</th><th>Valor</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{rows.map(o=><tr key={o.id}><td><b>#{o.id.replace("MH-","")}</b></td><td>{o.client}</td><td>{o.city}</td><td>{money.format(o.total)}</td><td>{o.itemCount}</td><td><Badge status={o.status}/></td><td><button className="mh-dots">•••</button></td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="mh-admin-grid">
          <article className="mh-panel" id="produtos"><span className="mh-kicker">CATÁLOGO</span><h2>42 SKUs carregados</h2><p>Produtos organizados nas linhas Grill, Dianteiro, Traseiro e Congelados.</p><div className="mh-lines">{categories.map(c=><div key={c.id}><span>{c.label}</span><b>{products.filter(p=>p.category===c.id).length} SKUs</b></div>)}</div></article>
          <article className="mh-panel dark" id="clientes"><span className="mh-kicker">CANAL PRÓPRIO</span><h2>Do Instagram ao pedido estruturado.</h2><p>A experiência organiza catálogo, quantidade, cliente e entrega antes do contato comercial.</p><a href="/">Abrir experiência do cliente <ChevronRight size={17}/></a></article>
        </section>
      </main>
    </div>
  );
}

export default function AppPremium() {
  return window.location.pathname.startsWith("/admin") ? <Admin/> : <Storefront/>;
}
