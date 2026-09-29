import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, Beef, Box, CheckCircle2, ChevronRight,
  ClipboardList, Flame, Headphones, Home, Menu, Minus, PackageCheck, Plus,
  Search, Send, ShieldCheck, ShoppingCart, Snowflake, Store, Truck, UserRound, X
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

type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  accent: string;
  description: string;
  cta: string;
  image: string;
  category?: CategoryId;
  chips: { icon: "quality" | "truck" | "support" | "grill"; label: string }[];
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const heroSlides: HeroSlide[] = [
  {
    id: "institutional",
    kicker: "MH DIGITAL • CANAL B2B",
    title: "Qualidade para abastecer",
    accent: "o seu negócio.",
    description: "Carnes selecionadas, entrega confiável e atendimento comercial em uma experiência própria da MH.",
    cta: "Ver catálogo",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1800&q=88",
    chips: [
      { icon: "quality", label: "Qualidade garantida" },
      { icon: "truck", label: "Entrega confiável" },
      { icon: "support", label: "Atendimento comercial" }
    ]
  },
  {
    id: "cupim",
    kicker: "LINHA GRILL • ATACADO",
    title: "Cupim Grill para operações que",
    accent: "exigem padrão.",
    description: "Uma linha com apresentação forte e condição comercial para clientes do atacado.",
    cta: "Explorar linha Grill",
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=1800&q=88",
    category: "grill",
    chips: [
      { icon: "grill", label: "Linha Grill" },
      { icon: "quality", label: "Seleção premium" }
    ]
  },
  {
    id: "picanha",
    kicker: "SELEÇÃO MH • LINHA PREMIUM",
    title: "Picanha Grill com presença premium",
    accent: "no seu catálogo.",
    description: "Seleção de alto padrão para negócios que valorizam qualidade, experiência e relacionamento comercial.",
    cta: "Ver produtos",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=88",
    category: "grill",
    chips: [
      { icon: "quality", label: "Linha premium" },
      { icon: "support", label: "Atendimento comercial" }
    ]
  }
];

const productImages = [
  "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=900&q=84"
];

function Logo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div className={"brand-logo " + (inverse ? "inverse " : "") + (compact ? "compact" : "")}>
      <div className="brand-seal">
        <Beef size={compact ? 22 : 29} strokeWidth={1.55} />
        <span>MH</span>
      </div>
      <div className="brand-wordmark">
        <div><b>MH</b><strong>Digital</strong></div>
        <span>DISTRIBUIDORA DE ALIMENTOS</span>
      </div>
    </div>
  );
}

function ProductPhoto({ product }: { product: Product }) {
  const index = Number(product.code.slice(-1)) % productImages.length;
  return (
    <div className="product-photo">
      <img src={productImages[index]} alt={product.name} loading="lazy" />
      <span className="photo-brand">MH</span>
    </div>
  );
}

function CategoryIcon({ id }: { id: CategoryId }) {
  if (id === "grill") return <Flame size={21} />;
  if (id === "congelados") return <Snowflake size={21} />;
  if (id === "dianteiro") return <Beef size={21} />;
  return <PackageCheck size={21} />;
}

function ChipIcon({ kind }: { kind: HeroSlide["chips"][number]["icon"] }) {
  if (kind === "truck") return <Truck size={21} />;
  if (kind === "support") return <Headphones size={21} />;
  if (kind === "grill") return <Flame size={21} />;
  return <ShieldCheck size={21} />;
}

function Qty({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="qty">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Diminuir quantidade"><Minus size={14}/></button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Aumentar quantidade"><Plus size={14}/></button>
    </div>
  );
}

function ProductCard({ product, quantity, onQuantity }: { product: Product; quantity: number; onQuantity: (n:number)=>void }) {
  return (
    <article className="product-card">
      <ProductPhoto product={product}/>
      <div className="product-card-body">
        <div className="product-meta">
          <span>SKU {product.code}</span>
          <span>Atacado</span>
        </div>
        <h3>{product.name}</h3>
        <div className="commercial-price">
          <span>Preço de referência</span>
          <div><strong>{money.format(product.price)}</strong><small>valor demonstrativo</small></div>
        </div>
        <div className="product-action">
          {quantity > 0 ? (
            <>
              <Qty value={quantity} onChange={onQuantity}/>
              <span className="selected-label">incluído</span>
            </>
          ) : (
            <button onClick={() => onQuantity(1)}><Plus size={16}/> Incluir no pedido</button>
          )}
        </div>
      </div>
    </article>
  );
}

function HeroCarousel({ onCatalog, onCategory }: { onCatalog: () => void; onCategory: (id: CategoryId) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    timer.current = window.setInterval(() => setIndex(i => (i + 1) % heroSlides.length), 5200);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [paused]);

  const go = (next: number) => setIndex((next + heroSlides.length) % heroSlides.length);
  const slide = heroSlides[index];
  const action = () => slide.category ? onCategory(slide.category) : onCatalog();

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Destaques comerciais MH"
    >
      <div className="hero-background" style={{ backgroundImage: `url("${slide.image}")` }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <Logo inverse/>
        <div className="hero-copy">
          <span className="hero-kicker">{slide.kicker}</span>
          <h1>{slide.title} <em>{slide.accent}</em></h1>
          <p>{slide.description}</p>
          <div className="hero-chips">
            {slide.chips.map(chip => (
              <div key={chip.label}><ChipIcon kind={chip.icon}/><span>{chip.label}</span></div>
            ))}
          </div>
          <button className="hero-cta" onClick={action}>{slide.cta}<ArrowRight size={19}/></button>
        </div>
      </div>
      <button className="hero-arrow left" onClick={() => go(index - 1)} aria-label="Banner anterior"><ArrowLeft size={19}/></button>
      <button className="hero-arrow right" onClick={() => go(index + 1)} aria-label="Próximo banner"><ArrowRight size={19}/></button>
      <div className="hero-dots">
        {heroSlides.map((item, i) => <button key={item.id} className={i===index ? "active" : ""} onClick={() => go(i)} aria-label={`Ir para banner ${i+1}`}/>)}
      </div>
    </section>
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
  const [form, setForm] = useState({ client: "", phone: "", city: "Goiânia", delivery: "Entrega" as "Entrega" | "Retirada", note: "" });

  useEffect(() => localStorage.setItem("mh-demo-cart", JSON.stringify(cart)), [cart]);
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [view]);

  const items = useMemo(() => Object.entries(cart)
    .filter(([,q]) => q > 0)
    .map(([code,qty]) => ({ product: products.find(p=>p.code===code)!, qty }))
    .filter(x=>x.product), [cart]);

  const itemCount = items.reduce((sum,item)=>sum+item.qty,0);
  const total = items.reduce((sum,item)=>sum+(item.product.price*item.qty),0);

  const filtered = products.filter(product => {
    const term = search.trim().toLowerCase();
    return (category === "all" || product.category === category) &&
      (!term || product.name.toLowerCase().includes(term) || product.code.includes(term));
  });

  const setQty = (code:string, qty:number) => setCart(current => ({...current,[code]:qty}));
  const openCatalog = () => { setCategory("all"); setView("catalog"); };
  const openCategory = (id: CategoryId) => { setCategory(id); setView("catalog"); };

  const submitOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.client.trim() || !form.phone.trim() || !itemCount) return;
    const id = "MH-" + String(Date.now()).slice(-5);
    const order: DemoOrder = {
      id,
      client: form.client.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || "Goiânia",
      delivery: form.delivery,
      note: form.note.trim(),
      total,
      itemCount,
      status: "Novo",
      createdAt: new Date().toISOString()
    };
    let current: DemoOrder[] = [];
    try { current = JSON.parse(localStorage.getItem("mh-demo-orders") || "[]"); } catch {}
    localStorage.setItem("mh-demo-orders", JSON.stringify([order,...current].slice(0,30)));
    setOrderId(id);
    setCart({});
    setView("success");
  };

  if (view === "success") {
    return (
      <div className="store-shell">
        <header className="site-header"><Logo/><a className="admin-link" href="/admin">Painel comercial</a></header>
        <main className="success-screen">
          <div className="success-icon"><CheckCircle2 size={43}/></div>
          <span className="eyebrow">SOLICITAÇÃO REGISTRADA</span>
          <h1>{orderId}</h1>
          <p>O pedido demonstrativo foi registrado e já pode ser visualizado no painel comercial da MH.</p>
          <div className="success-card">
            <div><span>Status</span><b>Novo pedido</b></div>
            <div><span>Canal</span><b>MH Digital</b></div>
          </div>
          <button className="primary full-limit" onClick={()=>setView("home")}>Voltar ao início</button>
          <a className="secondary full-limit" href="/admin">Abrir painel gestor</a>
        </main>
      </div>
    );
  }

  return (
    <div className="store-shell">
      <div className="business-strip"><span>Canal digital B2B</span><span>•</span><span>Goiânia e região</span><span>•</span><span>Atendimento comercial MH</span></div>
      <header className="site-header">
        <Logo/>
        <nav className="desktop-nav">
          <button onClick={()=>setView("home")}>Início</button>
          <button onClick={openCatalog}>Catálogo</button>
          <button onClick={()=>setView("cart")}>Meu pedido {itemCount>0 && <b>{itemCount}</b>}</button>
          <a href="/admin">Painel comercial</a>
        </nav>
        <button className="cart-icon" onClick={()=>setView("cart")}><ShoppingCart size={20}/>{itemCount>0&&<b>{itemCount}</b>}</button>
      </header>

      <main className="store-main">
        {view === "home" && <>
          <HeroCarousel onCatalog={openCatalog} onCategory={openCategory}/>

          <section className="quick-search">
            <button onClick={openCatalog}><Search size={19}/><span>Buscar produtos, cortes ou SKU...</span><ChevronRight size={18}/></button>
          </section>

          <section className="content-section">
            <div className="section-heading">
              <div><span className="eyebrow">NAVEGUE POR</span><h2>Linhas comerciais</h2></div>
              <button onClick={openCatalog}>Ver catálogo completo <ArrowRight size={15}/></button>
            </div>
            <div className="category-grid">
              {categories.map(item => (
                <button key={item.id} className={"category-card " + (item.id==="grill"?"featured":"")} onClick={()=>openCategory(item.id)}>
                  <span className="category-icon"><CategoryIcon id={item.id}/></span>
                  <div><b>{item.short}</b><small>{products.filter(p=>p.category===item.id).length} produtos</small></div>
                  <ChevronRight size={17}/>
                </button>
              ))}
            </div>
          </section>

          <section className="content-section products-section">
            <div className="section-heading">
              <div><span className="eyebrow">SELEÇÃO MH</span><h2>Destaques do catálogo</h2></div>
              <button onClick={openCatalog}>Ver todos <ArrowRight size={15}/></button>
            </div>
            <div className="product-grid">
              {products.filter(p=>featuredCodes.includes(p.code)).slice(0,8).map(product => (
                <ProductCard key={product.code} product={product} quantity={cart[product.code]||0} onQuantity={qty=>setQty(product.code,qty)}/>
              ))}
            </div>
            <div className="pricing-note">
              <ShieldCheck size={16}/>
              <span>Valores exibidos são referências demonstrativas. Condições, unidade comercial e preço final devem ser confirmados pela equipe MH.</span>
            </div>
          </section>

          <section className="business-benefits">
            <article><Truck size={25}/><div><b>Entrega confiável</b><span>Operação voltada a Goiânia e região.</span></div></article>
            <article><ShieldCheck size={25}/><div><b>Qualidade comercial</b><span>Catálogo organizado para compras no atacado.</span></div></article>
            <article><Headphones size={25}/><div><b>Atendimento humano</b><span>O digital organiza o pedido; a equipe mantém o relacionamento.</span></div></article>
          </section>
        </>}

        {view === "catalog" && <section className="page-section">
          <div className="page-title">
            <button onClick={()=>setView("home")}><ArrowLeft size={20}/></button>
            <div><span className="eyebrow">CATÁLOGO B2B</span><h1>Selecione os produtos</h1><p>Monte uma solicitação comercial de forma rápida e organizada.</p></div>
          </div>
          <div className="catalog-toolbar">
            <label className="catalog-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto ou SKU"/>{search&&<button onClick={()=>setSearch("")}><X size={16}/></button>}</label>
            <div className="catalog-count"><b>{filtered.length}</b><span>produtos</span></div>
          </div>
          <div className="filter-row">
            <button className={category==="all"?"active":""} onClick={()=>setCategory("all")}>Todos</button>
            {categories.map(item=><button key={item.id} className={category===item.id?"active":""} onClick={()=>setCategory(item.id)}>{item.short}</button>)}
          </div>
          <div className="product-grid catalog-grid">
            {filtered.map(product=><ProductCard key={product.code} product={product} quantity={cart[product.code]||0} onQuantity={qty=>setQty(product.code,qty)}/>)}
          </div>
          <div className="pricing-note"><ShieldCheck size={16}/><span>Preço de referência demonstrativo. Unidade e condição comercial devem ser confirmadas no fechamento.</span></div>
        </section>}

        {view === "cart" && <section className="page-section cart-page">
          <div className="page-title"><button onClick={()=>setView("home")}><ArrowLeft size={20}/></button><div><span className="eyebrow">{itemCount} ITENS SELECIONADOS</span><h1>Meu Pedido</h1><p>Revise os itens antes de enviar sua solicitação comercial.</p></div></div>
          {!items.length ? (
            <div className="empty-state"><ShoppingCart size={43}/><h2>Seu pedido está vazio</h2><p>Escolha produtos do catálogo para montar sua solicitação.</p><button className="primary" onClick={openCatalog}>Explorar catálogo</button></div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {items.map(({product,qty})=><article className="cart-item" key={product.code}>
                  <ProductPhoto product={product}/>
                  <div className="cart-info"><span>SKU {product.code}</span><h3>{product.name}</h3><small>Preço de referência</small><b>{money.format(product.price)}</b></div>
                  <Qty value={qty} onChange={value=>setQty(product.code,value)}/>
                </article>)}
              </div>
              <aside className="order-summary">
                <span className="eyebrow">RESUMO COMERCIAL</span>
                <div><span>Itens selecionados</span><b>{itemCount}</b></div>
                <div><span>Entrega</span><b>A combinar</b></div>
                <div className="summary-total"><span>Estimativa de referência</span><b>{money.format(total)}</b></div>
                <p>Valor demonstrativo. Preço final, peso/unidade, disponibilidade e condição comercial serão confirmados pela MH.</p>
                <button className="primary full" onClick={()=>setView("checkout")}>Continuar <ChevronRight size={18}/></button>
              </aside>
            </div>
          )}
        </section>}

        {view === "checkout" && <section className="page-section checkout-page">
          <div className="page-title"><button onClick={()=>setView("cart")}><ArrowLeft size={20}/></button><div><span className="eyebrow">SOLICITAÇÃO COMERCIAL</span><h1>Enviar pedido</h1><p>Informe seus dados para a equipe MH receber a solicitação organizada.</p></div></div>
          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>Empresa / Nome<input required value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Ex.: Mercado Central"/></label>
              <div className="form-grid">
                <label>WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(62) 99999-9999"/></label>
                <label>Cidade<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
              </div>
              <fieldset><legend>Recebimento</legend><div className="delivery-options">
                {(["Entrega","Retirada"] as const).map(option=><button type="button" key={option} className={form.delivery===option?"active":""} onClick={()=>setForm({...form,delivery:option})}>{option==="Entrega"?<Truck size={20}/>:<Store size={20}/>}<span>{option}</span>{form.delivery===option&&<CheckCircle2 size={18}/>}</button>)}
              </div></fieldset>
              <label>Observações <small>(opcional)</small><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Horário, referência, condição desejada ou observações..."/></label>
              <button className="primary full" type="submit"><Send size={18}/>Enviar solicitação</button>
            </form>
            <aside className="order-summary checkout-summary">
              <span className="eyebrow">SEU PEDIDO</span>
              <div><span>Itens selecionados</span><b>{itemCount}</b></div>
              <div className="summary-total"><span>Estimativa de referência</span><b>{money.format(total)}</b></div>
              <p>O envio não representa faturamento. A equipe MH confirma disponibilidade, unidade, preço e condição comercial.</p>
            </aside>
          </div>
        </section>}
      </main>

      <nav className="mobile-nav">
        <button className={view==="home"?"active":""} onClick={()=>setView("home")}><Home size={19}/><span>Início</span></button>
        <button className={view==="catalog"?"active":""} onClick={openCatalog}><Menu size={19}/><span>Catálogo</span></button>
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
  return <span className={"status-badge "+cls}>{status}</span>;
}

function Admin() {
  const [orders,setOrders] = useState<DemoOrder[]>([]);
  useEffect(()=>{ try{ setOrders(JSON.parse(localStorage.getItem("mh-demo-orders")||"[]")); }catch{} },[]);
  const rows = [...orders,...baseOrders];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Logo inverse/>
        <nav>
          <a className="active" href="/admin"><BarChart3 size={18}/>Visão Geral</a>
          <a href="#pedidos"><ClipboardList size={18}/>Pedidos</a>
          <a href="#clientes"><UserRound size={18}/>Clientes</a>
          <a href="#produtos"><Box size={18}/>Produtos</a>
          <a href="/"><Store size={18}/>Abrir catálogo</a>
        </nav>
        <div className="admin-sidebar-foot"><span>DEMONSTRAÇÃO PREMIUM</span><b>MH Digital • B2B</b></div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div><span className="eyebrow">MH DISTRIBUIDORA</span><h1>Painel Comercial</h1><p>Acompanhe pedidos e a operação do canal digital.</p></div>
          <div className="admin-user"><span>JS</span><div><b>João Silva</b><small>Comercial</small></div></div>
        </header>

        <section className="metric-grid">
          <article><i className="red"><ShoppingCart size={22}/></i><div><b>{28+orders.length}</b><span>Novos pedidos</span></div></article>
          <article><i className="yellow"><Box size={22}/></i><div><b>17</b><span>Em separação</span></div></article>
          <article><i className="blue"><Truck size={22}/></i><div><b>12</b><span>Saiu para entrega</span></div></article>
          <article><i className="green"><CheckCircle2 size={22}/></i><div><b>156</b><span>Concluídos</span></div></article>
        </section>

        <section className="admin-panel" id="pedidos">
          <div className="admin-panel-head"><div><h2>Últimos pedidos</h2><span>Solicitações recebidas pelo canal MH Digital</span></div><button>Ver todos <ArrowRight size={14}/></button></div>
          <div className="admin-table-wrap"><table><thead><tr><th># Pedido</th><th>Cliente</th><th>Cidade</th><th>Referência</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{rows.map(order=><tr key={order.id}><td><b>#{order.id.replace("MH-","")}</b></td><td>{order.client}</td><td>{order.city}</td><td>{money.format(order.total)}</td><td>{order.itemCount}</td><td><Badge status={order.status}/></td><td><button className="dots">•••</button></td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="admin-bottom-grid">
          <article className="admin-panel" id="produtos">
            <span className="eyebrow">CATÁLOGO</span><h2>42 SKUs demonstrativos</h2><p>Linhas comerciais organizadas para uma experiência B2B rápida e clara.</p>
            <div className="admin-lines">{categories.map(item=><div key={item.id}><span>{item.label}</span><b>{products.filter(p=>p.category===item.id).length} SKUs</b></div>)}</div>
          </article>
          <article className="admin-panel dark" id="clientes">
            <span className="eyebrow">CANAL PRÓPRIO</span><h2>Instagram gera interesse. MH Digital organiza o pedido.</h2><p>O WhatsApp continua como relacionamento comercial, enquanto catálogo e solicitação ganham estrutura própria.</p><a href="/">Abrir experiência do cliente <ChevronRight size={17}/></a>
          </article>
        </section>
      </main>
    </div>
  );
}

export default function AppPremium() {
  return window.location.pathname.startsWith("/admin") ? <Admin/> : <Storefront/>;
}
