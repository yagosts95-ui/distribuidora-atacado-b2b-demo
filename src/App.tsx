import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  Home,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Snowflake,
  Store,
  Truck,
  UserRound,
  X
} from "lucide-react";
import { categories, featuredCodes, products, type CategoryId, type Product } from "./data/products";

type Cart = Record<string, number>;
type StoreView = "home" | "catalog" | "cart" | "checkout" | "success";
type DemoOrder = {
  id: string;
  client: string;
  phone: string;
  city: string;
  delivery: "Entrega" | "Retirada";
  note: string;
  total: number;
  itemCount: number;
  status: "Novo";
  createdAt: string;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"brand " + (compact ? "brand--compact" : "")}>
      <div className="brand__mark">
        <span className="brand__cow">◆</span>
        <strong>MH</strong>
      </div>
      {!compact && (
        <div>
          <strong className="brand__name">MH Distribuidora</strong>
          <span className="brand__sub">Atacado de carnes e alimentos</span>
        </div>
      )}
    </div>
  );
}

function ProductArt({ product, large = false }: { product: Product; large?: boolean }) {
  const seed = Number(product.code.slice(-2)) || 1;
  const flip = seed % 2 === 0;
  return (
    <div className={"product-art " + (large ? "product-art--large" : "")}>
      <svg viewBox="0 0 280 190" aria-hidden="true">
        <path
          d={flip
            ? "M45 109C55 62 98 39 154 46c45 6 75 31 82 61 8 34-26 55-70 49-34-4-54-2-80 2-34 5-50-16-41-49Z"
            : "M39 106c12-42 55-67 104-63 47 4 86 30 96 61 11 34-21 57-67 54-29-2-51-5-78 0-40 8-66-14-55-52Z"}
          fill="#861f24"
        />
        <path
          d={flip
            ? "M71 105c13-25 41-40 76-38 34 2 61 18 70 38-26-10-49-12-69-7-24 5-42 17-77 7Z"
            : "M61 102c19-23 46-36 76-34 34 2 60 17 78 37-35-8-62-6-84 1-24 8-44 7-70-4Z"}
          fill="#b33a3f"
        />
        <path
          d="M58 126c38 13 68 4 91-4 25-9 49-6 75 2"
          fill="none"
          stroke="#f4d4c7"
          strokeWidth="9"
          strokeLinecap="round"
          opacity=".9"
        />
        <path
          d="M91 77c19 8 36 7 52 3M166 76c13 3 24 9 35 17"
          fill="none"
          stroke="#f8e6dd"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".85"
        />
      </svg>
      <span className="product-art__badge">MH</span>
    </div>
  );
}

function CategoryIcon({ id }: { id: CategoryId }) {
  if (id === "grill") return <Flame size={20} />;
  if (id === "congelados") return <Snowflake size={20} />;
  if (id === "dianteiro") return <Store size={20} />;
  return <PackageCheck size={20} />;
}

function QuantityControl({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="quantity">
      <button aria-label="Diminuir" onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus size={15} />
      </button>
      <strong>{value}</strong>
      <button aria-label="Aumentar" onClick={() => onChange(value + 1)}>
        <Plus size={15} />
      </button>
    </div>
  );
}

function ProductCard({
  product,
  quantity,
  onQuantity
}: {
  product: Product;
  quantity: number;
  onQuantity: (qty: number) => void;
}) {
  return (
    <article className="product-card">
      <ProductArt product={product} />
      <div className="product-card__body">
        <div>
          <span className="sku">SKU {product.code}</span>
          <h3>{product.name}</h3>
        </div>
        <div className="price-row">
          <div>
            <span className="price">{money.format(product.price)}</span>
            <small>valor demonstrativo</small>
          </div>
          {quantity > 0 ? (
            <QuantityControl value={quantity} onChange={onQuantity} />
          ) : (
            <button className="add-button" onClick={() => onQuantity(1)}>
              <ShoppingCart size={16} />
              Adicionar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Storefront() {
  const [view, setView] = useState<StoreView>("home");
  const [cart, setCart] = useState<Cart>(() => {
    try {
      return JSON.parse(localStorage.getItem("mh-demo-cart") || "{}");
    } catch {
      return {};
    }
  });
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [search, setSearch] = useState("");
  const [orderId, setOrderId] = useState("");
  const [form, setForm] = useState({
    client: "",
    phone: "",
    city: "Goiânia",
    delivery: "Entrega" as "Entrega" | "Retirada",
    note: ""
  });

  useEffect(() => {
    localStorage.setItem("mh-demo-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [view]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([code, qty]) => ({
          product: products.find((item) => item.code === code)!,
          qty
        }))
        .filter((item) => item.product),
    [cart]
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const filtered = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const setQty = (code: string, qty: number) =>
    setCart((current) => ({ ...current, [code]: qty }));

  const openCategory = (id: CategoryId) => {
    setCategory(id);
    setView("catalog");
  };

  const submitOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.client.trim() || !form.phone.trim() || itemCount === 0) return;
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
    const current: DemoOrder[] = JSON.parse(localStorage.getItem("mh-demo-orders") || "[]");
    localStorage.setItem("mh-demo-orders", JSON.stringify([order, ...current].slice(0, 20)));
    setOrderId(id);
    setCart({});
    setView("success");
  };

  const navTo = (next: StoreView) => {
    if (next === "catalog") setCategory("all");
    setView(next);
  };

  if (view === "success") {
    return (
      <div className="app-shell">
        <header className="mobile-header">
          <Logo />
        </header>
        <main className="success-page">
          <div className="success-icon"><Check size={38} /></div>
          <span className="eyebrow">PEDIDO RECEBIDO</span>
          <h1>{orderId}</h1>
          <p>
            Sua solicitação foi registrada na demonstração e está pronta para
            visualização no painel comercial da MH.
          </p>
          <div className="success-card">
            <div><span>Status</span><strong>Novo pedido</strong></div>
            <div><span>Atendimento</span><strong>Equipe comercial MH</strong></div>
          </div>
          <button className="primary-button" onClick={() => setView("home")}>
            Voltar ao início
          </button>
          <a
            className="secondary-button"
            href="https://wa.me/5562998327708?text=Ol%C3%A1%2C%20acabei%20de%20montar%20um%20pedido%20na%20MH%20Digital."
            target="_blank"
            rel="noreferrer"
          >
            Falar com vendedor
          </a>
          <a className="admin-shortcut" href="/admin">Abrir painel gestor →</a>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Logo />
        <button className="header-cart" onClick={() => setView("cart")}>
          <ShoppingCart size={21} />
          {itemCount > 0 && <span>{itemCount}</span>}
        </button>
      </header>

      <main className="store-main">
        {view === "home" && (
          <>
            <section className="hero">
              <div className="hero__copy">
                <span className="eyebrow">MH DIGITAL • ATACADO</span>
                <h1>
                  Qualidade para abastecer <em>o seu negócio.</em>
                </h1>
                <p>
                  Carnes selecionadas, agilidade no pedido e atendimento comercial
                  em um canal próprio da MH.
                </p>
                <button className="hero__button" onClick={() => navTo("catalog")}>
                  Fazer pedido <ChevronRight size={18} />
                </button>
              </div>
              <div className="hero__visual">
                <ProductArt product={products[5]} large />
              </div>
            </section>

            <div className="search-box" onClick={() => navTo("catalog")}>
              <Search size={19} />
              <span>Buscar produtos, cortes ou SKU...</span>
            </div>

            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">NAVEGUE POR</span>
                  <h2>Categorias</h2>
                </div>
                <button onClick={() => navTo("catalog")}>Ver todos</button>
              </div>
              <div className="category-grid">
                {categories.map((item) => (
                  <button key={item.id} className={"category-card category-card--" + item.id} onClick={() => openCategory(item.id)}>
                    <span><CategoryIcon id={item.id} /></span>
                    <strong>{item.short}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">SELEÇÃO MH</span>
                  <h2>Produtos em destaque</h2>
                </div>
                <button onClick={() => navTo("catalog")}>Ver todos</button>
              </div>
              <div className="product-grid">
                {products
                  .filter((item) => featuredCodes.includes(item.code))
                  .slice(0, 6)
                  .map((product) => (
                    <ProductCard
                      key={product.code}
                      product={product}
                      quantity={cart[product.code] || 0}
                      onQuantity={(qty) => setQty(product.code, qty)}
                    />
                  ))}
              </div>
            </section>

            <section className="trade-banner">
              <div className="trade-banner__icon"><Truck size={28} /></div>
              <div>
                <span className="eyebrow">PARA O SEU NEGÓCIO</span>
                <h2>Pedido rápido. Atendimento humano.</h2>
                <p>
                  Monte sua solicitação no catálogo e continue contando com a
                  equipe comercial da MH no fechamento.
                </p>
              </div>
            </section>
          </>
        )}

        {view === "catalog" && (
          <section className="catalog-page">
            <div className="page-title">
              <button className="round-button" onClick={() => setView("home")}><ArrowLeft size={20} /></button>
              <div>
                <span className="eyebrow">42 ITENS NA DEMONSTRAÇÃO</span>
                <h1>Catálogo MH</h1>
              </div>
            </div>

            <label className="search-input">
              <Search size={19} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produto ou SKU"
              />
              {search && <button onClick={() => setSearch("")}><X size={17} /></button>}
            </label>

            <div className="filter-row">
              <button
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                Todos
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  className={category === item.id ? "active" : ""}
                  onClick={() => setCategory(item.id)}
                >
                  {item.short}
                </button>
              ))}
            </div>

            <div className="catalog-count">
              <strong>{filtered.length}</strong> produtos encontrados
            </div>

            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.code}
                  product={product}
                  quantity={cart[product.code] || 0}
                  onQuantity={(qty) => setQty(product.code, qty)}
                />
              ))}
            </div>
          </section>
        )}

        {view === "cart" && (
          <section className="cart-page">
            <div className="page-title">
              <button className="round-button" onClick={() => setView("home")}><ArrowLeft size={20} /></button>
              <div>
                <span className="eyebrow">{itemCount} ITENS</span>
                <h1>Meu Pedido</h1>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={38} />
                <h2>Seu pedido está vazio</h2>
                <p>Escolha os cortes no catálogo para montar sua solicitação.</p>
                <button className="primary-button" onClick={() => navTo("catalog")}>
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cartItems.map(({ product, qty }) => (
                    <article className="cart-item" key={product.code}>
                      <ProductArt product={product} />
                      <div className="cart-item__info">
                        <span className="sku">SKU {product.code}</span>
                        <h3>{product.name}</h3>
                        <strong>{money.format(product.price)}</strong>
                      </div>
                      <QuantityControl value={qty} onChange={(next) => setQty(product.code, next)} />
                    </article>
                  ))}
                </div>
                <div className="order-summary">
                  <div><span>Itens selecionados</span><strong>{itemCount}</strong></div>
                  <div><span>Entrega</span><strong>A combinar</strong></div>
                  <div className="order-summary__total">
                    <span>Total demonstrativo</span>
                    <strong>{money.format(total)}</strong>
                  </div>
                  <small>
                    Valores da demonstração são referências comerciais e devem ser
                    confirmados pela equipe MH.
                  </small>
                </div>
                <button className="primary-button sticky-action" onClick={() => setView("checkout")}>
                  Continuar pedido <ChevronRight size={18} />
                </button>
              </>
            )}
          </section>
        )}

        {view === "checkout" && (
          <section className="checkout-page">
            <div className="page-title">
              <button className="round-button" onClick={() => setView("cart")}><ArrowLeft size={20} /></button>
              <div>
                <span className="eyebrow">ÚLTIMA ETAPA</span>
                <h1>Finalizar pedido</h1>
              </div>
            </div>
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>
                Empresa / Nome
                <input required value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Ex.: Mercado Central" />
              </label>
              <label>
                WhatsApp
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(62) 99999-9999" />
              </label>
              <label>
                Cidade
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <fieldset>
                <legend>Como deseja receber?</legend>
                <div className="delivery-options">
                  {(["Entrega", "Retirada"] as const).map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={form.delivery === option ? "selected" : ""}
                      onClick={() => setForm({ ...form, delivery: option })}
                    >
                      {option === "Entrega" ? <Truck size={20} /> : <Store size={20} />}
                      <span>{option}</span>
                      {form.delivery === option && <CheckCircle2 size={18} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Observações <small>opcional</small>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Horário, referência, preferência de atendimento..." />
              </label>

              <div className="order-summary compact">
                <div><span>{itemCount} itens</span><strong>{money.format(total)}</strong></div>
                <small>Valor demonstrativo sujeito à confirmação comercial.</small>
              </div>
              <button className="primary-button" type="submit">
                <Send size={18} /> Enviar pedido
              </button>
            </form>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><Home size={20} /><span>Início</span></button>
        <button className={view === "catalog" ? "active" : ""} onClick={() => navTo("catalog")}><Menu size={20} /><span>Catálogo</span></button>
        <button className={view === "cart" || view === "checkout" ? "active" : ""} onClick={() => setView("cart")}><ShoppingCart size={20} /><span>Meu pedido</span>{itemCount > 0 && <b>{itemCount}</b>}</button>
        <a href="/admin"><BarChart3 size={20} /><span>Painel</span></a>
      </nav>
    </div>
  );
}

const sampleOrders = [
  { id: "MH-1028", client: "Mercado Central", city: "Goiânia", itemCount: 12, total: 1240, status: "Novo" },
  { id: "MH-1027", client: "Supermercado Goiás", city: "Aparecida de Goiânia", itemCount: 8, total: 890, status: "Em separação" },
  { id: "MH-1026", client: "Açougue do Povo", city: "Goiânia", itemCount: 5, total: 560, status: "Saiu para entrega" },
  { id: "MH-1025", client: "Rede Econômica", city: "Trindade", itemCount: 21, total: 2430, status: "Concluído" },
  { id: "MH-1024", client: "Distribuidora Alves", city: "Goiânia", itemCount: 9, total: 930, status: "Concluído" }
];

function StatusBadge({ status }: { status: string }) {
  const slug = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "-");
  return <span className={"status status--" + slug}>{status}</span>;
}

function Admin() {
  const [demoOrders, setDemoOrders] = useState<DemoOrder[]>([]);

  useEffect(() => {
    try {
      setDemoOrders(JSON.parse(localStorage.getItem("mh-demo-orders") || "[]"));
    } catch {
      setDemoOrders([]);
    }
  }, []);

  const rows = [...demoOrders, ...sampleOrders];
  const metrics = [
    { label: "Novos pedidos", value: 28 + demoOrders.length, icon: <ShoppingCart size={22} />, type: "red" },
    { label: "Em separação", value: 17, icon: <Box size={22} />, type: "amber" },
    { label: "Saiu para entrega", value: 12, icon: <Truck size={22} />, type: "blue" },
    { label: "Concluídos", value: 156, icon: <CheckCircle2 size={22} />, type: "green" }
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Logo />
        <nav>
          <a className="active" href="/admin"><BarChart3 size={19} /> Visão geral</a>
          <a href="#pedidos"><ClipboardList size={19} /> Pedidos</a>
          <a href="#produtos"><Box size={19} /> Produtos</a>
          <a href="/"><Store size={19} /> Abrir loja</a>
        </nav>
        <div className="sidebar-footer">
          <span>DEMONSTRAÇÃO</span>
          <strong>MH Digital v0.1</strong>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="eyebrow">MH DISTRIBUIDORA</span>
            <h1>Painel Comercial</h1>
            <p>Acompanhe pedidos e a operação comercial em uma única visão.</p>
          </div>
          <div className="admin-user">
            <div>MH</div>
            <span><strong>Equipe Comercial</strong><small>Administrador</small></span>
            <UserRound size={19} />
          </div>
        </header>

        <section className="metric-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span className={"metric-icon metric-icon--" + metric.type}>{metric.icon}</span>
              <div><strong>{metric.value}</strong><span>{metric.label}</span></div>
            </article>
          ))}
        </section>

        <section className="admin-card" id="pedidos">
          <div className="admin-card__heading">
            <div>
              <span className="eyebrow">OPERAÇÃO</span>
              <h2>Últimos pedidos</h2>
            </div>
            <span className="live-dot"><i /> Demonstração ativa</span>
          </div>
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Cidade</th>
                  <th>Itens</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id.replace("MH-", "")}</strong></td>
                    <td>{order.client}</td>
                    <td>{order.city}</td>
                    <td>{order.itemCount}</td>
                    <td>{money.format(order.total)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td><button className="table-action">•••</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-grid" id="produtos">
          <article className="admin-card admin-insight">
            <span className="eyebrow">CATÁLOGO</span>
            <h2>42 produtos carregados</h2>
            <p>Catálogo demonstrativo organizado nas quatro linhas comerciais da tabela recebida.</p>
            <div className="progress-list">
              {categories.map((item) => {
                const amount = products.filter((product) => product.category === item.id).length;
                return <div key={item.id}><span>{item.label}</span><strong>{amount} SKUs</strong></div>;
              })}
            </div>
          </article>
          <article className="admin-card admin-insight dark">
            <span className="eyebrow">PRÓXIMA CAMADA</span>
            <h2>Pronto para evoluir</h2>
            <p>
              A demonstração usa armazenamento local. Após aprovação, o mesmo fluxo
              pode ser conectado ao banco, autenticação e operação real.
            </p>
            <a href="/">Visualizar experiência do cliente <ChevronRight size={18} /></a>
          </article>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return window.location.pathname.startsWith("/admin") ? <Admin /> : <Storefront />;
}
