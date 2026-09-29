import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, Beef, Box, CheckCircle2, ChevronRight,
  ClipboardList, CreditCard, DollarSign, Flame, Headphones, Home, Menu, Minus,
  FileText, LayoutDashboard, PackageCheck, Plus, Printer, Receipt, Search, Send,
  ShieldCheck, ShoppingCart, Snowflake, Store, Truck, UserRound, Wallet, X
} from "lucide-react";
import { categories, featuredCodes, products, type CategoryId, type Product } from "./data/products";
import "./premium.css";

type Cart = Record<string, number>;
type StoreView = "home" | "catalog" | "cart" | "checkout" | "success" | "orders";
type AppMode = "store" | "admin";
type Status = "Aguardando aceite" | "Pedido aceito" | "Em separação" | "Saiu para entrega" | "Concluído";
type PaymentMethod = "A definir" | "PIX" | "Boleto" | "Prazo";

type DemoOrder = {
  id: string;
  client: string;
  phone: string;
  city: string;
  delivery: "Entrega" | "Retirada";
  note: string;
  itemCount: number;
  status: Status;
  createdAt: string;
  items: Array<{ code: string; name: string; qty: number }>;
  commercialValue: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  dueDate: string;
  orderNumber: string;
  acceptedAt: string;
};

type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  accent: string;
  description: string;
  cta: string;
  category?: CategoryId;
  image: string;
  chips: { icon: "quality" | "truck" | "support" | "grill"; label: string }[];
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusFlow: Status[] = ["Aguardando aceite", "Pedido aceito", "Em separação", "Saiu para entrega", "Concluído"];

function statusIndex(status: Status) {
  return statusFlow.indexOf(status);
}

function nextStatus(status: Status): Status | null {
  const index = statusIndex(status);
  return index >= 0 && index < statusFlow.length - 1 ? statusFlow[index + 1] : null;
}

function nextStatusLabel(status: Status) {
  if (status === "Aguardando aceite") return "Aceitar pedido";
  if (status === "Pedido aceito") return "Iniciar separação";
  if (status === "Em separação") return "Marcar saída para entrega";
  if (status === "Saiu para entrega") return "Concluir pedido";
  return "Pedido concluído";
}

function normalizeStatus(value: unknown): Status {
  if (value === "Aguardando aceite") return "Aguardando aceite";
  if (value === "Pedido aceito") return "Pedido aceito";
  if (value === "Em separação") return "Em separação";
  if (value === "Saiu para entrega") return "Saiu para entrega";
  if (value === "Concluído") return "Concluído";

  // Compatibilidade com pedidos gravados por versões anteriores da demo.
  if (value === "Novo") return "Aguardando aceite";
  if (value === "Aceito") return "Pedido aceito";
  if (value === "Separando") return "Em separação";
  if (value === "Em entrega") return "Saiu para entrega";
  if (value === "Concluido") return "Concluído";

  return "Aguardando aceite";
}

function normalizeOrder(raw: unknown): DemoOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<DemoOrder> & Record<string, unknown>;
  if (typeof value.id !== "string" || !value.id.trim()) return null;

  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems
    .filter(item => item && typeof item === "object")
    .map(item => {
      const entry = item as Record<string, unknown>;
      return {
        code: String(entry.code ?? "SEM-SKU"),
        name: String(entry.name ?? "Item do pedido"),
        qty: Math.max(1, Number(entry.qty) || 1)
      };
    });

  const computedCount = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    id: value.id,
    client: typeof value.client === "string" && value.client.trim() ? value.client : "Cliente MH",
    phone: typeof value.phone === "string" ? value.phone : "",
    city: typeof value.city === "string" && value.city.trim() ? value.city : "Goiânia",
    delivery: value.delivery === "Retirada" ? "Retirada" : "Entrega",
    note: typeof value.note === "string" ? value.note : "",
    itemCount: Math.max(1, Number(value.itemCount) || computedCount || 1),
    status: normalizeStatus(value.status),
    createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
    items,
    commercialValue: Math.max(0, Number(value.commercialValue) || 0),
    paidAmount: Math.max(0, Number(value.paidAmount) || 0),
    paymentMethod: value.paymentMethod === "PIX" || value.paymentMethod === "Boleto" || value.paymentMethod === "Prazo" ? value.paymentMethod : "A definir",
    dueDate: typeof value.dueDate === "string" ? value.dueDate : "",
    orderNumber: typeof value.orderNumber === "string" ? value.orderNumber : "",
    acceptedAt: typeof value.acceptedAt === "string" ? value.acceptedAt : ""
  };
}

function loadSavedOrders(): DemoOrder[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("mh-demo-orders") || "[]");
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeOrder).filter((order): order is DemoOrder => Boolean(order));
    localStorage.setItem("mh-demo-orders", JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

function saveSavedOrders(orders: DemoOrder[]) {
  const normalized = orders.map(normalizeOrder).filter((order): order is DemoOrder => Boolean(order)).slice(0,30);
  localStorage.setItem("mh-demo-orders", JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("mh-orders-updated"));
}

function financeStatus(order: DemoOrder) {
  if (order.commercialValue <= 0) return "A definir";
  if (order.paidAmount >= order.commercialValue) return "Pago";
  if (order.paidAmount > 0) return "Parcial";
  return "A receber";
}

function createOrderNumber(order: DemoOrder) {
  if (order.orderNumber) return order.orderNumber;
  const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `OP-${date}-${order.id.replace(/\D/g,"").slice(-5).padStart(5,"0")}`;
}

const ASSET_LOGO = "/assets/mh-logo.svg";
const ASSET_CATALOG = "/assets/b2b-catalog.svg";

const heroSlides: HeroSlide[] = [
  {
    id: "operacao",
    kicker: "MH DIGITAL • PEDIDOS",
    title: "Abastecimento organizado para",
    accent: "quem vende carne.",
    description: "Açougues, mercados e revendedores encontram os produtos e montam seus pedidos com mais agilidade.",
    cta: "Ver catálogo",
    image: "/assets/hero-distribution.svg",
    chips: [
      { icon: "quality", label: "Catálogo organizado" },
      { icon: "truck", label: "Entrega comercial" },
      { icon: "support", label: "Atendimento humano" }
    ]
  },
  {
    id: "linha-grill",
    kicker: "LINHA GRILL • DESTAQUES",
    title: "Cortes para operações que",
    accent: "exigem padrão.",
    description: "Uma seleção pensada para quem precisa manter qualidade e regularidade no abastecimento.",
    cta: "Explorar Linha Grill",
    category: "grill",
    image: "/assets/hero-grill.svg",
    chips: [
      { icon: "grill", label: "Linha Grill" },
      { icon: "quality", label: "Seleção premium" }
    ]
  },
  {
    id: "logistica",
    kicker: "DISTRIBUIÇÃO • GOIÂNIA E REGIÃO",
    title: "Do estoque ao seu negócio com",
    accent: "mais eficiência.",
    description: "Pedido organizado, comunicação clara e uma experiência simples para acompanhar cada etapa.",
    cta: "Montar pedido",
    image: "/assets/hero-logistics.svg",
    chips: [
      { icon: "truck", label: "Operação de distribuição" },
      { icon: "support", label: "Equipe comercial" }
    ]
  }
];

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("MH Digital render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-fallback">
          <img src={ASSET_LOGO} alt="MH Digital" />
          <h1>A experiência foi reiniciada.</h1>
          <p>Atualize a página para continuar a demonstração.</p>
          <button onClick={() => window.location.replace("/")}>Voltar ao início</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"brand-logo " + (compact ? "compact" : "")}>
      <img src={ASSET_LOGO} alt="MH Digital — Distribuidora de Alimentos" />
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

function productPosition(product: Product) {
  const n = Number(product.code.replace(/\D/g, "")) || 1;
  const positions = [
    "78% 16%", "67% 50%", "82% 82%", "56% 50%",
    "72% 18%", "88% 52%", "64% 84%", "48% 16%"
  ];
  return positions[n % positions.length];
}

function ProductPhoto({ product }: { product: Product }) {
  return (
    <div
      className="product-photo"
      style={{ backgroundImage: `url("${ASSET_CATALOG}")`, backgroundPosition: productPosition(product) }}
      role="img"
      aria-label={product.name}
    >
      <span className="photo-brand">MH</span>
    </div>
  );
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

function ProductCard({
  product,
  quantity,
  onQuantity,
  showPrice,
  onExplore
}: {
  product: Product;
  quantity: number;
  onQuantity: (n:number)=>void;
  showPrice: boolean;
  onExplore: () => void;
}) {
  return (
    <article className="product-card">
      <ProductPhoto product={product}/>
      <div className="product-card-body">
        <div className="product-meta">
          <span>SKU {product.code}</span>
          <span>Catálogo MH</span>
        </div>
        <h3>{product.name}</h3>

        {showPrice ? (
          <div className="commercial-price">
            <span>Referência da tabela</span>
            <div><strong>{money.format(product.price)}</strong><small>* demonstrativo</small></div>
          </div>
        ) : (
          <div className="home-product-copy">
            <span>Disponível no catálogo comercial</span>
          </div>
        )}

        <div className="product-action">
          {showPrice ? (
            quantity > 0 ? (
              <>
                <Qty value={quantity} onChange={onQuantity}/>
                <span className="selected-label">selecionado</span>
              </>
            ) : (
              <button type="button" onClick={() => onQuantity(1)}><Plus size={16}/> Incluir no pedido</button>
            )
          ) : (
            <button type="button" onClick={onExplore}>Ver no catálogo <ChevronRight size={15}/></button>
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
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [paused]);

  const slide = heroSlides[index];
  const go = (next: number) => setIndex((next + heroSlides.length) % heroSlides.length);
  const action = () => slide.category ? onCategory(slide.category) : onCatalog();

  return (
    <section
      className={"hero-carousel slide-" + index}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Destaques comerciais MH"
    >
      <div className="hero-media" style={{ backgroundImage: `url("${slide.image}")` }} aria-hidden="true" />
      <div className="hero-overlay" />

      <div className="hero-content">
        <div className="hero-brand"><Logo/></div>
        <div className="hero-copy">
          <span className="hero-kicker">{slide.kicker}</span>
          <h1>{slide.title} <em>{slide.accent}</em></h1>
          <p>{slide.description}</p>
          <div className="hero-chips">
            {slide.chips.map(chip => (
              <div key={chip.label}><ChipIcon kind={chip.icon}/><span>{chip.label}</span></div>
            ))}
          </div>
          <button type="button" className="hero-cta" onClick={action}>{slide.cta}<ArrowRight size={19}/></button>
        </div>
      </div>

      <button type="button" className="hero-arrow left" onClick={() => go(index - 1)} aria-label="Banner anterior"><ArrowLeft size={19}/></button>
      <button type="button" className="hero-arrow right" onClick={() => go(index + 1)} aria-label="Próximo banner"><ArrowRight size={19}/></button>

      <div className="hero-dots">
        {heroSlides.map((item, i) => (
          <button type="button" key={item.id} className={i===index ? "active" : ""} onClick={() => go(i)} aria-label={`Ir para banner ${i+1}`}/>
        ))}
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
  const [customerOrders, setCustomerOrders] = useState<DemoOrder[]>(() => loadSavedOrders());

  useEffect(() => {
    localStorage.setItem("mh-demo-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const syncOrders = () => setCustomerOrders(loadSavedOrders());
    window.addEventListener("storage", syncOrders);
    window.addEventListener("focus", syncOrders);
    window.addEventListener("mh-orders-updated", syncOrders);
    return () => {
      window.removeEventListener("storage", syncOrders);
      window.removeEventListener("focus", syncOrders);
      window.removeEventListener("mh-orders-updated", syncOrders);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const items = useMemo(() => Object.entries(cart)
    .filter(([,q]) => q > 0)
    .map(([code,qty]) => ({ product: products.find(p=>p.code===code), qty }))
    .filter((x): x is { product: Product; qty: number } => Boolean(x.product)), [cart]);

  const itemCount = items.reduce((sum,item)=>sum+item.qty,0);

  const filtered = products.filter(product => {
    const term = search.trim().toLowerCase();
    return (category === "all" || product.category === category) &&
      (!term || product.name.toLowerCase().includes(term) || product.code.includes(term));
  });

  const setQty = (code:string, qty:number) => {
    setCart(current => {
      const next = { ...current };
      if (qty <= 0) delete next[code];
      else next[code] = qty;
      return next;
    });
  };

  const openCatalog = () => {
    setCategory("all");
    setSearch("");
    setView("catalog");
  };

  const openCategory = (id: CategoryId) => {
    setCategory(id);
    setSearch("");
    setView("catalog");
  };

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
      itemCount,
      status: "Aguardando aceite",
      createdAt: new Date().toISOString(),
      items: items.map(({product, qty}) => ({ code: product.code, name: product.name, qty })),
      commercialValue: 0,
      paidAmount: 0,
      paymentMethod: "A definir",
      dueDate: "",
      orderNumber: "",
      acceptedAt: ""
    };

    const current = loadSavedOrders();
    const nextOrders = [order,...current].slice(0,30);
    saveSavedOrders(nextOrders);
    setCustomerOrders(nextOrders);

    setOrderId(id);
    setCart({});
    setView("success");
  };

  if (view === "success") {
    return (
      <div className="store-shell dark-theme">
        <header className="site-header success-header">
          <Logo/>
        </header>
        <main className="success-screen">
          <div className="success-icon"><CheckCircle2 size={43}/></div>
          <span className="eyebrow">SOLICITAÇÃO REGISTRADA</span>
          <h1>{orderId}</h1>
          <p>O pedido foi enviado para a MH e agora aguarda o aceite da equipe comercial.</p>
          <div className="success-card">
            <div><span>Status</span><b>Aguardando aceite</b></div>
            <div><span>Próximo passo</span><b>Confirmação da MH</b></div>
          </div>
          <button type="button" className="primary full-limit" onClick={()=>setView("orders")}>Acompanhar pedido</button>
          <button type="button" className="secondary full-limit" onClick={()=>setView("home")}>Voltar ao início</button>
        </main>
      </div>
    );
  }

  return (
    <div className="store-shell dark-theme">
      <div className="business-strip"><span>MH Distribuidora</span><span>•</span><span>Pedidos para açougues, mercados e revendedores</span><span>•</span><span>Goiânia e região</span></div>

      <header className="client-mobile-header">
        <Logo compact/>
        <div className="client-mobile-actions">
          <button type="button" aria-label="Buscar produtos" onClick={openCatalog}><Search size={19}/></button>
          <button type="button" aria-label="Abrir pedido" onClick={()=>setView("cart")}>
            <ShoppingCart size={19}/>
            {itemCount>0&&<b>{itemCount}</b>}
          </button>
        </div>
      </header>

      <header className="site-header">
        <Logo/>
        <nav className="desktop-nav">
          <button type="button" className={view==="home" ? "active" : ""} onClick={()=>setView("home")}>Início</button>
          <button type="button" className={view==="catalog" ? "active" : ""} onClick={openCatalog}>Catálogo</button>
          <button type="button" className={view==="cart"||view==="checkout" ? "active" : ""} onClick={()=>setView("cart")}>Meu pedido {itemCount>0 && <b>{itemCount}</b>}</button>
          <button type="button" className={view==="orders" ? "active" : ""} onClick={()=>setView("orders")}>Meus pedidos</button>
        </nav>
        <button type="button" className="cart-icon" onClick={()=>setView("cart")}><ShoppingCart size={20}/>{itemCount>0&&<b>{itemCount}</b>}</button>
      </header>

      <main className="store-main">
        {view === "home" && <>
          <HeroCarousel onCatalog={openCatalog} onCategory={openCategory}/>

          <section className="quick-search">
            <button type="button" onClick={openCatalog}><Search size={19}/><span>Buscar cortes, linha ou SKU...</span><ChevronRight size={18}/></button>
          </section>

          <section className="content-section">
            <div className="section-heading">
              <div><span className="eyebrow">CATÁLOGO POR LINHA</span><h2>Encontre rápido o que seu negócio precisa</h2></div>
              <button type="button" onClick={openCatalog}>Ver catálogo completo <ArrowRight size={15}/></button>
            </div>
            <div className="category-grid">
              {categories.map(item => (
                <button type="button" key={item.id} className={"category-card " + (item.id==="grill"?"featured":"")} onClick={()=>openCategory(item.id)}>
                  <span className="category-icon"><CategoryIcon id={item.id}/></span>
                  <div><b>{item.short}</b><small>{products.filter(p=>p.category===item.id).length} SKUs</small></div>
                  <ChevronRight size={17}/>
                </button>
              ))}
            </div>
          </section>

          <section className="content-section products-section">
            <div className="section-heading">
              <div><span className="eyebrow">DESTAQUES DA OPERAÇÃO</span><h2>Produtos para abastecimento comercial</h2></div>
              <button type="button" onClick={openCatalog}>Ver todos <ArrowRight size={15}/></button>
            </div>

            <div className="product-grid">
              {products.filter(p=>featuredCodes.includes(p.code)).slice(0,8).map(product => (
                <ProductCard
                  key={product.code}
                  product={product}
                  quantity={cart[product.code]||0}
                  onQuantity={qty=>setQty(product.code,qty)}
                  showPrice={false}
                  onExplore={() => openCategory(product.category)}
                />
              ))}
            </div>
          </section>

          <section className="business-benefits">
            <article><Truck size={25}/><div><b>Distribuição para o comércio</b><span>Experiência pensada para abastecimento e recompra.</span></div></article>
            <article><ShieldCheck size={25}/><div><b>Pedido estruturado</b><span>Produto, quantidade e dados do cliente em um único fluxo.</span></div></article>
            <article><Headphones size={25}/><div><b>Atendimento comercial</b><span>O digital organiza. A equipe MH mantém negociação e relacionamento.</span></div></article>
          </section>
        </>}

        {view === "catalog" && <section className="page-section">
          <div className="page-title">
            <button type="button" onClick={()=>setView("home")}><ArrowLeft size={20}/></button>
            <div><span className="eyebrow">CATÁLOGO MH</span><h1>Selecione os produtos</h1><p>Os preços abaixo são referências da tabela recebida e não representam condição comercial final.</p></div>
          </div>

          <div className="catalog-toolbar">
            <label className="catalog-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto ou SKU"/>{search&&<button type="button" onClick={()=>setSearch("")}><X size={16}/></button>}</label>
            <div className="catalog-count"><b>{filtered.length}</b><span>produtos</span></div>
          </div>

          <div className="filter-row">
            <button type="button" className={category==="all"?"active":""} onClick={()=>setCategory("all")}>Todos</button>
            {categories.map(item=><button type="button" key={item.id} className={category===item.id?"active":""} onClick={()=>setCategory(item.id)}>{item.short}</button>)}
          </div>

          <div className="product-grid catalog-grid">
            {filtered.map(product=>(
              <ProductCard
                key={product.code}
                product={product}
                quantity={cart[product.code]||0}
                onQuantity={qty=>setQty(product.code,qty)}
                showPrice
                onExplore={() => undefined}
              />
            ))}
          </div>

          <div className="pricing-note"><ShieldCheck size={16}/><span>* Referência demonstrativa. Unidade, peso, disponibilidade e condição comercial precisam ser confirmados pela MH.</span></div>
        </section>}

        {view === "cart" && <section className="page-section cart-page">
          <div className="page-title">
            <button type="button" onClick={()=>setView("home")}><ArrowLeft size={20}/></button>
            <div><span className="eyebrow">{itemCount} ITENS SELECIONADOS</span><h1>Meu Pedido</h1><p>Revise sua seleção antes de enviar para o comercial.</p></div>
          </div>

          {!items.length ? (
            <div className="empty-state">
              <ShoppingCart size={43}/>
              <h2>Seu pedido está vazio</h2>
              <p>Escolha produtos do catálogo para montar sua solicitação.</p>
              <button type="button" className="primary" onClick={openCatalog}>Explorar catálogo</button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {items.map(({product,qty})=>(
                  <article className="cart-item" key={product.code}>
                    <ProductPhoto product={product}/>
                    <div className="cart-info">
                      <span>SKU {product.code}</span>
                      <h3>{product.name}</h3>
                      <small>Referência da tabela</small>
                      <b>{money.format(product.price)}*</b>
                    </div>
                    <Qty value={qty} onChange={value=>setQty(product.code,value)}/>
                  </article>
                ))}
              </div>

              <aside className="order-summary">
                <span className="eyebrow">RESUMO DO PEDIDO</span>
                <div><span>Produtos selecionados</span><b>{items.length}</b></div>
                <div><span>Quantidade total</span><b>{itemCount}</b></div>
                <div><span>Valor final</span><b>A confirmar</b></div>
                <p>Como a tabela não informa de forma inequívoca a unidade comercial de todos os SKUs, a demo não calcula um total financeiro artificial.</p>
                <button type="button" className="primary full" onClick={()=>setView("checkout")}>Continuar <ChevronRight size={18}/></button>
              </aside>
            </div>
          )}
        </section>}

        {view === "checkout" && <section className="page-section checkout-page">
          <div className="page-title">
            <button type="button" onClick={()=>setView("cart")}><ArrowLeft size={20}/></button>
            <div><span className="eyebrow">SOLICITAÇÃO COMERCIAL</span><h1>Enviar pedido</h1><p>Informe seus dados para o pedido chegar organizado à equipe MH.</p></div>
          </div>

          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>Empresa / Nome<input required value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Ex.: Açougue Central"/></label>
              <div className="form-grid">
                <label>WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(62) 99999-9999"/></label>
                <label>Cidade<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
              </div>
              <fieldset>
                <legend>Recebimento</legend>
                <div className="delivery-options">
                  {(["Entrega","Retirada"] as const).map(option=>(
                    <button type="button" key={option} className={form.delivery===option?"active":""} onClick={()=>setForm({...form,delivery:option})}>
                      {option==="Entrega"?<Truck size={20}/>:<Store size={20}/>}
                      <span>{option}</span>
                      {form.delivery===option&&<CheckCircle2 size={18}/>}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>Observações <small>(opcional)</small><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Horário, referência, volume, preferência comercial..."/></label>
              <button className="primary full" type="submit"><Send size={18}/>Enviar pedido</button>
            </form>

            <aside className="order-summary checkout-summary">
              <span className="eyebrow">SEU PEDIDO</span>
              <div><span>Produtos</span><b>{items.length}</b></div>
              <div><span>Quantidade total</span><b>{itemCount}</b></div>
              <div><span>Condição comercial</span><b>A confirmar</b></div>
              <p>O envio registra a solicitação. A MH confirma disponibilidade, unidade, preço e condição antes do fechamento.</p>
            </aside>
          </div>
        </section>}

        {view === "orders" && <section className="page-section customer-orders-page">
          <div className="page-title">
            <button type="button" onClick={()=>setView("home")}><ArrowLeft size={20}/></button>
            <div><span className="eyebrow">ACOMPANHAMENTO</span><h1>Meus pedidos</h1><p>Acompanhe o aceite e cada etapa da operação MH.</p></div>
          </div>

          {!customerOrders.length ? (
            <div className="empty-state">
              <ClipboardList size={43}/>
              <h2>Nenhum pedido enviado ainda</h2>
              <p>Monte seu primeiro pedido pelo catálogo.</p>
              <button type="button" className="primary" onClick={openCatalog}>Abrir catálogo</button>
            </div>
          ) : (
            <div className="customer-orders-list">
              {customerOrders.map(order => {
                const currentIndex = statusIndex(order.status);
                return (
                  <article className="customer-order-card" key={order.id}>
                    <header>
                      <div>
                        <span className="eyebrow">PEDIDO</span>
                        <h2>#{order.id.replace("MH-","")}</h2>
                        {order.orderNumber && <small className="customer-order-number">Ordem {order.orderNumber}</small>}
                      </div>
                      <Badge status={order.status}/>
                    </header>

                    <div className="customer-order-meta">
                      <div><span>Empresa</span><b>{order.client}</b></div>
                      <div><span>Itens</span><b>{order.itemCount}</b></div>
                      <div><span>Recebimento</span><b>{order.delivery}</b></div>
                    </div>

                    <div className="customer-timeline">
                      {statusFlow.map((status, index) => (
                        <div
                          key={status}
                          className={"timeline-step " + (index < currentIndex ? "done " : "") + (index === currentIndex ? "current" : "")}
                        >
                          <i>{index < currentIndex ? <CheckCircle2 size={15}/> : index + 1}</i>
                          <span>{status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="customer-order-items">
                      {(order.items || []).slice(0,4).map(item => (
                        <span key={item.code}><b>{item.qty}×</b> {item.name}</span>
                      ))}
                      {(order.items || []).length > 4 && <span>+ {(order.items || []).length - 4} itens</span>}
                    </div>

                    <p className="customer-status-copy">
                      {order.status === "Aguardando aceite" && "A MH recebeu sua solicitação. O próximo passo é o aceite comercial."}
                      {order.status === "Pedido aceito" && "Pedido aceito pela MH. A operação pode iniciar a separação."}
                      {order.status === "Em separação" && "Seu pedido está sendo separado pela equipe MH."}
                      {order.status === "Saiu para entrega" && "Seu pedido saiu para entrega."}
                      {order.status === "Concluído" && "Pedido concluído."}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>}
      </main>

      <nav className="mobile-nav">
        <button type="button" className={view==="home"?"active":""} onClick={()=>setView("home")}><Home size={19}/><span>Início</span></button>
        <button type="button" className={view==="catalog"?"active":""} onClick={openCatalog}><Menu size={19}/><span>Catálogo</span></button>
        <button type="button" className={view==="cart"||view==="checkout"?"active":""} onClick={()=>setView("cart")}><ShoppingCart size={19}/><span>Meu Pedido</span>{itemCount>0&&<b>{itemCount}</b>}</button>
        <button type="button" className={view==="orders"?"active":""} onClick={()=>setView("orders")}><ClipboardList size={19}/><span>Pedidos</span></button>
      </nav>
    </div>
  );
}

const baseOrders: DemoOrder[] = [
  {
    id:"MH-1028", client:"Açougue Central", phone:"(62) 99911-2233", city:"Goiânia",
    delivery:"Entrega", note:"Receber até 16h.", itemCount:12, status:"Aguardando aceite",
    createdAt:"2026-09-29T13:42:00-03:00",
    commercialValue:0, paidAmount:0, paymentMethod:"A definir", dueDate:"", orderNumber:"", acceptedAt:"",
    items:[
      {code:"6605",name:"Cupim Grill",qty:4},
      {code:"5305",name:"Contra Filé Grill",qty:5},
      {code:"5803",name:"Picanha Grill",qty:3}
    ]
  },
  {
    id:"MH-1027", client:"Supermercado Goiás", phone:"(62) 99821-7744", city:"Aparecida de Goiânia",
    delivery:"Entrega", note:"Separar por linha.", itemCount:8, status:"Pedido aceito",
    createdAt:"2026-09-29T12:18:00-03:00",
    commercialValue:4890, paidAmount:0, paymentMethod:"Prazo", dueDate:"2026-10-06", orderNumber:"OP-20260929-01027", acceptedAt:"2026-09-29T12:22:00-03:00",
    items:[
      {code:"5211",name:"Filé Mignon sem Cordão",qty:3},
      {code:"5701",name:"Coxão Mole",qty:3},
      {code:"5101",name:"Patinho",qty:2}
    ]
  },
  {
    id:"MH-1026", client:"Casa de Carnes do Povo", phone:"(62) 99644-3801", city:"Goiânia",
    delivery:"Entrega", note:"Cliente recorrente.", itemCount:5, status:"Saiu para entrega",
    createdAt:"2026-09-29T10:05:00-03:00",
    commercialValue:2710, paidAmount:1000, paymentMethod:"PIX", dueDate:"2026-09-30", orderNumber:"OP-20260929-01026", acceptedAt:"2026-09-29T10:10:00-03:00",
    items:[
      {code:"5801",name:"Picanha (A)",qty:2},
      {code:"6101",name:"Fralda",qty:3}
    ]
  },
  {
    id:"MH-1025", client:"Rede Econômica", phone:"(62) 99325-1490", city:"Trindade",
    delivery:"Retirada", note:"Retirada pelo comprador.", itemCount:21, status:"Concluído",
    createdAt:"2026-09-28T16:40:00-03:00",
    commercialValue:7850, paidAmount:7850, paymentMethod:"Boleto", dueDate:"2026-09-28", orderNumber:"OP-20260928-01025", acceptedAt:"2026-09-28T16:45:00-03:00",
    items:[
      {code:"6301",name:"Acém com Pescoço",qty:8},
      {code:"6201",name:"Peito",qty:6},
      {code:"6405",name:"Paleta sem Músculo",qty:7}
    ]
  },
  {
    id:"MH-1024", client:"Mercado Alves", phone:"(62) 99510-4200", city:"Goiânia",
    delivery:"Entrega", note:"Conferir disponibilidade antes do faturamento.", itemCount:9, status:"Concluído",
    createdAt:"2026-09-28T14:15:00-03:00",
    commercialValue:3420, paidAmount:3420, paymentMethod:"PIX", dueDate:"2026-09-28", orderNumber:"OP-20260928-01024", acceptedAt:"2026-09-28T14:20:00-03:00",
    items:[
      {code:"6606",name:"Costela Desossada",qty:4},
      {code:"6502",name:"Costela em Tiras",qty:5}
    ]
  }
];

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

function Badge({ status }: { status: Status }) {
  const cls = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s/g,"-");
  return <span className={"status-badge "+cls}>{status}</span>;
}

function Admin({ onStore }: { onStore: () => void }) {
  const [orders,setOrders] = useState<DemoOrder[]>(baseOrders);
  const [selectedOrder,setSelectedOrder] = useState<DemoOrder | null>(null);
  const [orderFilter,setOrderFilter] = useState<"Todos" | Status>("Todos");
  const [adminSection,setAdminSection] = useState<"overview" | "orders" | "finance" | "catalog">("overview");
  const [adminMenuOpen,setAdminMenuOpen] = useState(false);

  useEffect(()=>{
    const saved = loadSavedOrders();
    const savedIds = new Set(saved.map(order => order.id));
    setOrders([...saved, ...baseOrders.filter(order => !savedIds.has(order.id))]);
  },[]);

  const updateStatus = (id: string, status: Status) => {
    const transition = (order: DemoOrder): DemoOrder => {
      if (order.id !== id) return order;
      if (status === "Pedido aceito" && order.status === "Aguardando aceite") {
        return {
          ...order,
          status,
          orderNumber: createOrderNumber(order),
          acceptedAt: new Date().toISOString()
        };
      }
      return { ...order, status };
    };

    setOrders(current => {
      const next = current.map(transition);
      const baseIds = new Set(baseOrders.map(order => order.id));
      saveSavedOrders(next.filter(order => !baseIds.has(order.id)));
      return next;
    });
    setSelectedOrder(current => current ? transition(current) : current);
  };

  const counts = {
    aguardando: orders.filter(order => order.status === "Aguardando aceite").length,
    aceitos: orders.filter(order => order.status === "Pedido aceito").length,
    separacao: orders.filter(order => order.status === "Em separação").length,
    entrega: orders.filter(order => order.status === "Saiu para entrega").length,
    concluidos: orders.filter(order => order.status === "Concluído").length
  };

  const finance = {
    confirmed: orders.reduce((sum, order) => sum + order.commercialValue, 0),
    received: orders.reduce((sum, order) => sum + Math.min(order.paidAmount, order.commercialValue), 0),
    receivable: orders.reduce((sum, order) => sum + Math.max(0, order.commercialValue - order.paidAmount), 0),
    undefinedCount: orders.filter(order => order.commercialValue <= 0).length
  };

  const updateFinance = (id: string, patch: Partial<Pick<DemoOrder, "commercialValue" | "paidAmount" | "paymentMethod" | "dueDate">>) => {
    setOrders(current => {
      const next = current.map(order => order.id === id ? { ...order, ...patch } : order);
      const baseIds = new Set(baseOrders.map(order => order.id));
      saveSavedOrders(next.filter(order => !baseIds.has(order.id)));
      return next;
    });
    setSelectedOrder(current => current?.id === id ? { ...current, ...patch } : current);
  };

  const filteredOrders = orderFilter === "Todos" ? orders : orders.filter(order => order.status === orderFilter);

  const printOrder = (order: DemoOrder) => {
    if (!order.orderNumber) return;
    setSelectedOrder(order);
    window.setTimeout(() => window.print(), 80);
  };

  const openAdminSection = (section: "overview" | "orders" | "finance" | "catalog") => {
    setAdminSection(section);
    setAdminMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-layout dark-admin">
      <aside className="admin-sidebar">
        <Logo/>
        <nav>
          <button type="button" className={adminSection==="overview" ? "active" : ""} onClick={()=>openAdminSection("overview")}><LayoutDashboard size={18}/>Visão Geral</button>
          <button type="button" className={adminSection==="orders" ? "active" : ""} onClick={()=>openAdminSection("orders")}><ClipboardList size={18}/>Pedidos</button>
          <button type="button" className={adminSection==="finance" ? "active" : ""} onClick={()=>openAdminSection("finance")}><DollarSign size={18}/>Financeiro</button>
          <button type="button" className={adminSection==="catalog" ? "active" : ""} onClick={()=>openAdminSection("catalog")}><Box size={18}/>Produtos</button>
          <button type="button" onClick={onStore}><Store size={18}/>Abrir catálogo</button>
        </nav>
        <div className="admin-sidebar-foot"><span>DEMONSTRAÇÃO PREMIUM</span><b>MH Digital</b></div>
      </aside>

      <header className="admin-mobile-topbar">
        <button type="button" className="admin-mobile-menu-button" onClick={()=>setAdminMenuOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button>
        <Logo compact/>
        <button type="button" className="admin-mobile-store-button" onClick={onStore} aria-label="Abrir catálogo"><Store size={19}/></button>
      </header>

      {adminMenuOpen && (
        <div className="admin-mobile-drawer-backdrop" onClick={()=>setAdminMenuOpen(false)}>
          <aside className="admin-mobile-drawer" onClick={event=>event.stopPropagation()}>
            <header><Logo/><button type="button" onClick={()=>setAdminMenuOpen(false)} aria-label="Fechar menu"><X size={20}/></button></header>
            <nav>
              <button type="button" className={adminSection==="overview" ? "active" : ""} onClick={()=>openAdminSection("overview")}><LayoutDashboard size={19}/><span>Visão geral</span></button>
              <button type="button" className={adminSection==="orders" ? "active" : ""} onClick={()=>openAdminSection("orders")}><ClipboardList size={19}/><span>Pedidos</span><b>{orders.length}</b></button>
              <button type="button" className={adminSection==="finance" ? "active" : ""} onClick={()=>openAdminSection("finance")}><DollarSign size={19}/><span>Financeiro</span></button>
              <button type="button" className={adminSection==="catalog" ? "active" : ""} onClick={()=>openAdminSection("catalog")}><Box size={19}/><span>Produtos</span></button>
            </nav>
            <button type="button" className="drawer-store-link" onClick={onStore}><Store size={18}/>Abrir catálogo do cliente</button>
          </aside>
        </div>
      )}

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="eyebrow">MH DISTRIBUIDORA</span>
            <h1 className="desktop-admin-title">Painel Comercial</h1>
            <h1 className="mobile-admin-title">
              {adminSection==="overview" && "Visão geral"}
              {adminSection==="orders" && "Pedidos"}
              {adminSection==="finance" && "Financeiro"}
              {adminSection==="catalog" && "Produtos"}
            </h1>
            <p>
              {adminSection==="overview" && "Resumo da operação."}
              {adminSection==="orders" && "Aceite, separação e acompanhamento."}
              {adminSection==="finance" && "Valores, recebimentos e saldos."}
              {adminSection==="catalog" && "Linhas e produtos cadastrados."}
            </p>
          </div>
          <div className="admin-user"><span>MH</span><div><b>Equipe Comercial</b><small>Administrador</small></div></div>
        </header>

        <section className={"metric-grid metric-grid-five admin-mobile-module " + (adminSection==="overview" ? "mobile-active" : "")}>
          <article><i className="red"><ShoppingCart size={22}/></i><div><b>{counts.aguardando}</b><span>Aguardando aceite</span></div></article>
          <article><i className="purple"><CheckCircle2 size={22}/></i><div><b>{counts.aceitos}</b><span>Pedidos aceitos</span></div></article>
          <article><i className="yellow"><Box size={22}/></i><div><b>{counts.separacao}</b><span>Em separação</span></div></article>
          <article><i className="blue"><Truck size={22}/></i><div><b>{counts.entrega}</b><span>Em entrega</span></div></article>
          <article><i className="green"><CheckCircle2 size={22}/></i><div><b>{counts.concluidos}</b><span>Concluídos</span></div></article>
        </section>

        <section className={"finance-module admin-mobile-module " + (adminSection==="finance" ? "mobile-active" : "")} id="financeiro">
          <div className="finance-heading">
            <div><span className="eyebrow">FINANCEIRO</span><h2>Visão financeira da operação</h2><p>Valores demonstrativos para apresentar o fluxo financeiro ligado aos pedidos.</p></div>
            <span className="finance-demo-badge">DEMONSTRAÇÃO</span>
          </div>

          <div className="finance-metrics">
            <article><i><DollarSign size={21}/></i><div><span>Valor confirmado</span><b>{money.format(finance.confirmed)}</b></div></article>
            <article><i><Wallet size={21}/></i><div><span>Recebido</span><b>{money.format(finance.received)}</b></div></article>
            <article><i><Receipt size={21}/></i><div><span>A receber</span><b>{money.format(finance.receivable)}</b></div></article>
            <article><i><CreditCard size={21}/></i><div><span>Sem valor definido</span><b>{finance.undefinedCount}</b></div></article>
          </div>

          <div className="finance-mobile-list">
            {orders.map(order => (
              <button type="button" className="finance-mobile-card" key={"finance-mobile-"+order.id} onClick={()=>setSelectedOrder(order)}>
                <div className="finance-mobile-card-head">
                  <div><span>Pedido #{order.id.replace("MH-","")}</span><b>{order.client}</b></div>
                  <span className={"finance-status "+financeStatus(order).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s/g,"-")}>{financeStatus(order)}</span>
                </div>
                <div className="finance-mobile-card-values">
                  <div><span>Confirmado</span><b>{order.commercialValue > 0 ? money.format(order.commercialValue) : "A definir"}</b></div>
                  <div><span>Recebido</span><b>{order.paidAmount > 0 ? money.format(order.paidAmount) : "—"}</b></div>
                  <div><span>Saldo</span><b>{order.commercialValue > 0 ? money.format(Math.max(0,order.commercialValue-order.paidAmount)) : "—"}</b></div>
                </div>
              </button>
            ))}
          </div>

          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Valor confirmado</th><th>Recebido</th><th>Saldo</th><th>Forma</th><th>Situação</th></tr></thead>
              <tbody>
                {orders.map(order => (
                  <tr key={"finance-"+order.id} onClick={()=>setSelectedOrder(order)}>
                    <td><b>#{order.id.replace("MH-","")}</b></td>
                    <td>{order.client}</td>
                    <td>{order.commercialValue > 0 ? money.format(order.commercialValue) : "A definir"}</td>
                    <td>{order.paidAmount > 0 ? money.format(order.paidAmount) : "—"}</td>
                    <td>{order.commercialValue > 0 ? money.format(Math.max(0,order.commercialValue-order.paidAmount)) : "—"}</td>
                    <td>{order.paymentMethod}</td>
                    <td><span className={"finance-status "+financeStatus(order).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s/g,"-")}>{financeStatus(order)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={"admin-panel orders-panel admin-mobile-module " + (adminSection==="orders" ? "mobile-active" : "")} id="pedidos">
          <div className="admin-panel-head orders-panel-head">
            <div>
              <span className="eyebrow">OPERAÇÃO</span>
              <h2>Pedidos</h2>
              <span>Pedidos organizados por etapa, com aceite e acompanhamento da operação.</span>
            </div>
            <button type="button" onClick={()=>setOrderFilter("Todos")}>Todos os pedidos <ArrowRight size={14}/></button>
          </div>

          <div className="order-filter-tabs">
            {(["Todos",...statusFlow] as Array<"Todos" | Status>).map(filter => (
              <button
                type="button"
                key={filter}
                className={orderFilter===filter ? "active" : ""}
                onClick={()=>setOrderFilter(filter)}
              >
                {filter}
                <b>{filter==="Todos" ? orders.length : orders.filter(order=>order.status===filter).length}</b>
              </button>
            ))}
          </div>

          <div className="order-cards-grid">
            {filteredOrders.map(order => {
              const next = nextStatus(order.status);
              return (
                <article className="admin-order-card" key={order.id}>
                  <header>
                    <div>
                      <span className="order-card-label">PEDIDO #{order.id.replace("MH-","")}</span>
                      <h3>{order.client}</h3>
                    </div>
                    <Badge status={order.status}/>
                  </header>

                  <div className="order-card-meta">
                    <div><span>Cidade</span><b>{order.city}</b></div>
                    <div><span>Itens</span><b>{order.itemCount}</b></div>
                    <div><span>Recebimento</span><b>{order.delivery}</b></div>
                  </div>

                  {order.orderNumber ? (
                    <div className="generated-order">
                      <FileText size={16}/>
                      <div><span>Ordem gerada</span><b>{order.orderNumber}</b></div>
                    </div>
                  ) : (
                    <div className="generated-order pending">
                      <ClipboardList size={16}/>
                      <div><span>Ordem de pedido</span><b>Gerada após aceite</b></div>
                    </div>
                  )}

                  <div className="order-card-items">
                    {order.items.slice(0,3).map(item => (
                      <span key={item.code}><b>{item.qty}×</b> {item.name}</span>
                    ))}
                    {order.items.length > 3 && <span>+ {order.items.length - 3} itens</span>}
                  </div>

                  <footer>
                    <button type="button" className="order-card-secondary" onClick={()=>setSelectedOrder(order)}>
                      Visualizar
                    </button>

                    {order.orderNumber && (
                      <button type="button" className="order-print-button" onClick={()=>printOrder(order)}>
                        <Printer size={15}/> Imprimir ordem
                      </button>
                    )}

                    {next && (
                      <button
                        type="button"
                        className={"order-card-primary " + (order.status==="Aguardando aceite" ? "accept" : "")}
                        onClick={()=>updateStatus(order.id,next)}
                      >
                        {nextStatusLabel(order.status)} <ChevronRight size={15}/>
                      </button>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </section>

        <section className={"admin-bottom-grid admin-mobile-module " + (adminSection==="catalog" ? "mobile-active" : "")}>
          <article className="admin-panel" id="produtos">
            <span className="eyebrow">CATÁLOGO</span>
            <h2>42 SKUs demonstrativos</h2>
            <p>As quatro linhas da tabela recebida já estão organizadas no catálogo.</p>
            <div className="admin-lines">
              {categories.map(item=><div key={item.id}><span>{item.label}</span><b>{products.filter(p=>p.category===item.id).length} SKUs</b></div>)}
            </div>
          </article>

          <article className="admin-panel accent-panel">
            <span className="eyebrow">FLUXO DE PEDIDOS</span>
            <h2>Do catálogo ao comercial com tudo organizado.</h2>
            <p>O cliente monta a seleção, a equipe recebe o pedido organizado e segue com o atendimento comercial.</p>
            <button type="button" onClick={onStore}>Abrir experiência do cliente <ChevronRight size={17}/></button>
          </article>
        </section>
      </main>

      {selectedOrder && (
        <div className="order-modal-backdrop" role="presentation" onMouseDown={()=>setSelectedOrder(null)}>
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes do pedido ${selectedOrder.id}`}
            onMouseDown={event=>event.stopPropagation()}
          >
            <header className="order-modal-head">
              <div>
                <span className="eyebrow">DETALHES DO PEDIDO</span>
                <h2>#{selectedOrder.id.replace("MH-","")}</h2>
                <p>{dateTime.format(new Date(selectedOrder.createdAt))}</p>
                {selectedOrder.orderNumber && <span className="modal-order-number">Ordem {selectedOrder.orderNumber}</span>}
              </div>
              <button type="button" className="modal-close" onClick={()=>setSelectedOrder(null)} aria-label="Fechar detalhes"><X size={19}/></button>
            </header>

            <div className="order-detail-grid">
              <article>
                <span>Cliente / empresa</span>
                <b>{selectedOrder.client}</b>
              </article>
              <article>
                <span>WhatsApp</span>
                <b>{selectedOrder.phone || "Não informado"}</b>
              </article>
              <article>
                <span>Cidade</span>
                <b>{selectedOrder.city}</b>
              </article>
              <article>
                <span>Recebimento</span>
                <b>{selectedOrder.delivery}</b>
              </article>
            </div>

            <div className="order-detail-status">
              <div><span>Status atual</span><Badge status={selectedOrder.status}/></div>

              <div className="admin-order-flow">
                {statusFlow.map((status, index) => {
                  const current = statusIndex(selectedOrder.status);
                  return (
                    <div key={status} className={(index < current ? "done " : "") + (index === current ? "current" : "")}>
                      <i>{index < current ? <CheckCircle2 size={14}/> : index + 1}</i>
                      <span>{status}</span>
                    </div>
                  );
                })}
              </div>

              {nextStatus(selectedOrder.status) ? (
                <button
                  type="button"
                  className="accept-next-action"
                  onClick={()=>updateStatus(selectedOrder.id,nextStatus(selectedOrder.status)!)}
                >
                  {selectedOrder.status === "Aguardando aceite" ? <CheckCircle2 size={18}/> : selectedOrder.status === "Saiu para entrega" ? <CheckCircle2 size={18}/> : <ArrowRight size={18}/>}
                  {nextStatusLabel(selectedOrder.status)}
                </button>
              ) : (
                <div className="flow-complete"><CheckCircle2 size={18}/> Pedido concluído</div>
              )}
            </div>

            <div className="order-items">
              <div className="order-items-head">
                <div><span className="eyebrow">ITENS DO PEDIDO</span><h3>{selectedOrder.itemCount} unidades selecionadas</h3></div>
              </div>
              {selectedOrder.items?.length ? selectedOrder.items.map(item=>{
                const product = products.find(product => product.code === item.code);
                return (
                  <article className="order-item-line" key={item.code}>
                    <div className="order-item-thumb">
                      {product ? <ProductPhoto product={product}/> : <Box size={23}/>}
                    </div>
                    <div className="order-item-copy">
                      <span>SKU {item.code}</span>
                      <b>{item.name}</b>
                    </div>
                    <div className="order-item-qty"><span>Qtd.</span><b>{item.qty}</b></div>
                  </article>
                );
              }) : (
                <div className="order-items-empty">Itens detalhados não disponíveis para este pedido demonstrativo.</div>
              )}
            </div>

            <div className="order-finance">
              <div className="order-finance-head">
                <div><span className="eyebrow">FINANCEIRO DO PEDIDO</span><h3>Condição financeira</h3></div>
                <span className={"finance-status "+financeStatus(selectedOrder).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s/g,"-")}>{financeStatus(selectedOrder)}</span>
              </div>

              <div className="finance-form-grid">
                <label>Valor confirmado
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedOrder.commercialValue || ""}
                    onChange={event=>updateFinance(selectedOrder.id,{commercialValue:Math.max(0,Number(event.target.value)||0)})}
                    placeholder="0,00"
                  />
                </label>
                <label>Valor recebido
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedOrder.paidAmount || ""}
                    onChange={event=>updateFinance(selectedOrder.id,{paidAmount:Math.max(0,Number(event.target.value)||0)})}
                    placeholder="0,00"
                  />
                </label>
                <label>Forma de pagamento
                  <select
                    value={selectedOrder.paymentMethod}
                    onChange={event=>updateFinance(selectedOrder.id,{paymentMethod:event.target.value as PaymentMethod})}
                  >
                    <option>A definir</option>
                    <option>PIX</option>
                    <option>Boleto</option>
                    <option>Prazo</option>
                  </select>
                </label>
                <label>Vencimento
                  <input
                    type="date"
                    value={selectedOrder.dueDate}
                    onChange={event=>updateFinance(selectedOrder.id,{dueDate:event.target.value})}
                  />
                </label>
              </div>

              <div className="finance-balance-line">
                <span>Saldo a receber</span>
                <b>{selectedOrder.commercialValue > 0 ? money.format(Math.max(0,selectedOrder.commercialValue-selectedOrder.paidAmount)) : "A definir"}</b>
              </div>
            </div>

            <div className="order-note">
              <span>Observações</span>
              <p>{selectedOrder.note || "Sem observações."}</p>
            </div>

            <footer className="order-modal-footer">
              <button type="button" className="secondary modal-secondary" onClick={()=>setSelectedOrder(null)}>Fechar</button>
              {selectedOrder.orderNumber && (
                <button type="button" className="secondary modal-secondary print-action" onClick={()=>printOrder(selectedOrder)}>
                  <Printer size={16}/> Imprimir ordem
                </button>
              )}
              <button type="button" className="primary" onClick={onStore}>Abrir catálogo do cliente</button>
            </footer>

            {selectedOrder.orderNumber && (
              <section className="print-order-sheet" aria-hidden="true">
                <header className="print-order-header">
                  <div className="print-brand">
                    <img src={ASSET_LOGO} alt="MH Digital"/>
                    <div><strong>ORDEM DO PEDIDO</strong><span>Documento operacional - MH Distribuidora</span></div>
                  </div>
                  <div className="print-order-number"><span>ORDEM</span><b>{selectedOrder.orderNumber}</b></div>
                </header>

                <div className="print-order-info">
                  <div><span>Pedido de origem</span><b>#{selectedOrder.id.replace("MH-","")}</b></div>
                  <div><span>Data do aceite</span><b>{selectedOrder.acceptedAt ? dateTime.format(new Date(selectedOrder.acceptedAt)) : "—"}</b></div>
                  <div><span>Status</span><b>{selectedOrder.status}</b></div>
                  <div><span>Recebimento</span><b>{selectedOrder.delivery}</b></div>
                </div>

                <div className="print-customer">
                  <div><span>Cliente / empresa</span><b>{selectedOrder.client}</b></div>
                  <div><span>WhatsApp</span><b>{selectedOrder.phone || "Não informado"}</b></div>
                  <div><span>Cidade</span><b>{selectedOrder.city}</b></div>
                </div>

                <table className="print-items-table">
                  <thead><tr><th>Item</th><th>SKU</th><th>Produto</th><th>Qtd.</th></tr></thead>
                  <tbody>
                    {selectedOrder.items.map((item,index)=>(
                      <tr key={item.code+"-"+index}>
                        <td>{index+1}</td>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="print-summary">
                  <div><span>Total de unidades selecionadas</span><b>{selectedOrder.itemCount}</b></div>
                  <div><span>Condição financeira</span><b>{selectedOrder.commercialValue > 0 ? money.format(selectedOrder.commercialValue) : "A confirmar"}</b></div>
                  <div><span>Forma de pagamento</span><b>{selectedOrder.paymentMethod}</b></div>
                </div>

                <div className="print-notes"><span>Observações</span><p>{selectedOrder.note || "Sem observações."}</p></div>

                <footer className="print-footer">
                  <span>Documento gerado automaticamente após o aceite comercial.</span>
                  <span>MH Digital</span>
                </footer>
              </section>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function AppPremiumInner() {
  const [mode, setMode] = useState<AppMode>(() => window.location.pathname.startsWith("/admin") ? "admin" : "store");

  useEffect(() => {
    const handler = () => setMode(window.location.pathname.startsWith("/admin") ? "admin" : "store");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const goStore = () => {
    window.history.pushState({}, "", "/");
    setMode("store");
    window.scrollTo({ top: 0 });
  };

  return mode === "admin" ? <Admin onStore={goStore}/> : <Storefront/>;
}

export default function AppPremium() {
  return <ErrorBoundary><AppPremiumInner/></ErrorBoundary>;
}
