// ═══════════════════════════════════════════════
//  AURUM — Boutique de Relojes
//  Sistema de Inventario & Caja
// ═══════════════════════════════════════════════

const API = "https://dummyjson.com/products?limit=100";

// Nombres creativos de colecciones de relojes
const COLECCIONES = {
  "smartphones":        "Cronógrafos Digitales",
  "laptops":            "Relojes Inteligentes Pro",
  "fragrances":         "Colección Élite",
  "skincare":           "Edición Signature",
  "groceries":          "Serie Heritage",
  "home-decoration":    "Tourbillon Edition",
  "furniture":          "Grand Complication",
  "tops":               "Colección Casual Luxe",
  "womens-dresses":     "Dame Horlogère",
  "womens-shoes":       "Montre Femme",
  "mens-shoes":         "Gentleman's Watch",
  "mens-shirts":        "Dress Collection",
  "sunglasses":         "Sport Chrono",
  "automotive":         "Racing Timepieces",
  "motorcycle":         "Adventure Series",
  "lighting":           "Luminor Edition",
  "beauty":             "Atelier Précieux",
  "skin-care":          "Maison Luxe",
  "vehicle":            "Pilot Collection",
  "kitchen-accessories":"Cuisinier Edition",
  "sports-accessories": "Triathlon Series",
};

// Estado global
let productos = [];
let carrito   = [];
let inventario = {};
let ventaActual = null;

// ─── INIT ──────────────────────────────────────
window.onload = async () => {
  cargarCarritoLS();
  await cargarProductos();
  renderHistorial();
};

// ─── TABS ──────────────────────────────────────
function mostrarTab(tab, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");
  if (tab === "caja")      { renderCaja(productos); actualizarCarritoUI(); }
  if (tab === "historial") renderHistorial();
}

// ─── API ───────────────────────────────────────
async function cargarProductos() {
  document.getElementById("resultado-inv").innerHTML =
    `<div class="loading"><div class="spinner"></div><span class="loading-text">Cargando colección</span></div>`;
  try {
    const res   = await fetch(API);
    const datos = await res.json();
    productos   = datos.products;

    // Inventario: cargar desde LS o inicializar
    const invLS = localStorage.getItem("inventario_aurum");
    if (invLS) {
      inventario = JSON.parse(invLS);
      productos.forEach(p => {
        if (!(p.id in inventario)) inventario[p.id] = stockInicial(p);
      });
    } else {
      productos.forEach(p => { inventario[p.id] = stockInicial(p); });
    }
    guardarInventarioLS();
    poblarCategorias();
    filtrarInventario();
    actualizarStatVentas();
  } catch {
    document.getElementById("resultado-inv").innerHTML =
      `<div class="loading"><p style="color:var(--danger)">Error al cargar. Verifica tu conexión.</p></div>`;
  }
}

async function recargarProductos() {
  await cargarProductos();
  mostrarToast("Colección actualizada", "success");
}

function stockInicial(p) {
  // Stock pequeño para simular escasez de lujo
  const base = p.stock || 0;
  if (base > 0) return Math.min(base, 20);
  return Math.floor(Math.random() * 12) + 2;
}

// ─── CATEGORÍAS ────────────────────────────────
function poblarCategorias() {
  const cats = [...new Set(productos.map(p => p.category))].sort();
  const opts = cats.map(c =>
    `<option value="${c}">${coleccionNombre(c)}</option>`
  ).join("");
  ["filtro-cat", "filtro-cat-caja"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<option value="">Todas las colecciones</option>` + opts;
  });
}

function coleccionNombre(cat) {
  return COLECCIONES[cat] || cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// ─── INVENTARIO — FILTROS ──────────────────────
function filtrarInventario() {
  const texto = document.getElementById("buscar-inv").value.toLowerCase();
  const cat   = document.getElementById("filtro-cat").value;
  const orden = document.getElementById("orden-inv").value;

  let lista = productos.filter(p => {
    const matchNombre = p.title.toLowerCase().includes(texto) ||
                        String(p.id).includes(texto);
    const matchCat    = !cat || p.category === cat;
    return matchNombre && matchCat;
  });

  if (orden === "asc")        lista.sort((a, b) => a.price - b.price);
  else if (orden === "desc")  lista.sort((a, b) => b.price - a.price);
  else if (orden === "stock-asc")  lista.sort((a, b) => (inventario[a.id]??0) - (inventario[b.id]??0));
  else if (orden === "stock-desc") lista.sort((a, b) => (inventario[b.id]??0) - (inventario[a.id]??0));

  renderInventario(lista);
  actualizarStats(lista);
}

function renderInventario(lista) {
  if (!lista.length) {
    document.getElementById("resultado-inv").innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">◎</div><p>Sin resultados para esa búsqueda</p></div>`;
    return;
  }
  document.getElementById("resultado-inv").innerHTML = lista.map(cardInventario).join("");
}

function cardInventario(p) {
  const stock = inventario[p.id] ?? 0;
  const { cls, lbl } = badgeStock(stock);
  return `
  <div class="product-card">
    <div class="product-img-wrap">
      <img src="${p.thumbnail}" alt="${p.title}" loading="lazy"
        onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%231a1a15\\'/><text x=\\'50%\\' y=\\'55%\\' text-anchor=\\'middle\\' font-size=\\'36\\'  fill=\\'%235c5845\\'>⌚</text></svg>'"/>
      <span class="stock-badge ${cls}">${lbl}</span>
    </div>
    <div class="product-body">
      <div class="product-ref">Ref. #${String(p.id).padStart(4,"0")} · ${coleccionNombre(p.category)}</div>
      <div class="product-name">${p.title}</div>
      <div class="product-desc">${p.description}</div>
      <div class="product-stock-row">
        Stock disponible: <strong id="stock-inv-${p.id}" style="color:var(--text)">${stock} uds.</strong>
      </div>
      <div class="product-footer">
        <div class="product-price">$${p.price.toLocaleString("es-CO", {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
      </div>
    </div>
  </div>`;
}

function actualizarStats(lista) {
  const valor  = lista.reduce((s, p) => s + p.price * (inventario[p.id] ?? 0), 0);
  const bajo   = lista.filter(p => { const st = inventario[p.id]??0; return st > 0 && st <= 3; }).length;
  const cero   = lista.filter(p => (inventario[p.id]??0) <= 0).length;
  document.getElementById("stat-total").textContent = lista.length;
  document.getElementById("stat-valor").textContent = "$" + valor.toLocaleString("es-CO", {maximumFractionDigits:0});
  document.getElementById("stat-bajo").textContent  = bajo;
  document.getElementById("stat-cero").textContent  = cero;
}

function actualizarStatVentas() {
  const hoy = new Date().toDateString();
  const hist = JSON.parse(localStorage.getItem("historial_aurum") || "[]");
  const ventasHoy = hist.filter(v => new Date(v.fechaISO).toDateString() === hoy).length;
  document.getElementById("stat-ventas").textContent = ventasHoy;
}

function badgeStock(stock) {
  if (stock <= 0)  return { cls: "stock-out",  lbl: "Agotado" };
  if (stock <= 3)  return { cls: "stock-low",  lbl: `Últimas: ${stock}` };
  return               { cls: "stock-ok",   lbl: `En stock: ${stock}` };
}

// ─── CAJA — PRODUCTOS ──────────────────────────
function filtrarCaja() {
  const texto = document.getElementById("buscar-caja").value.toLowerCase();
  const cat   = document.getElementById("filtro-cat-caja").value;
  let lista = productos.filter(p =>
    p.title.toLowerCase().includes(texto) && (!cat || p.category === cat)
  );
  renderCaja(lista);
}

function renderCaja(lista) {
  if (!lista.length) {
    document.getElementById("resultado-caja").innerHTML =
      `<div class="empty-state"><p>Sin resultados</p></div>`;
    return;
  }
  document.getElementById("resultado-caja").innerHTML = lista.map(cardCaja).join("");
}

function cardCaja(p) {
  const stock   = inventario[p.id] ?? 0;
  const { cls, lbl } = badgeStock(stock);
  const agotado = stock <= 0;
  // Cantidad ya en carrito
  const enCarro = carrito.find(i => i.id === p.id);
  const enCarroQty = enCarro ? enCarro.cantidad : 0;
  const btnLabel = agotado ? "Agotado" : (enCarroQty > 0 ? `En carrito (${enCarroQty})` : "Agregar");
  return `
  <div class="product-card">
    <div class="product-img-wrap">
      <img src="${p.thumbnail}" alt="${p.title}" loading="lazy"
        onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%231a1a15\\'/><text x=\\'50%\\' y=\\'55%\\' text-anchor=\\'middle\\' font-size=\\'36\\' fill=\\'%235c5845\\'>⌚</text></svg>'"/>
      <span class="stock-badge ${cls}">${lbl}</span>
    </div>
    <div class="product-body">
      <div class="product-ref">Ref. #${String(p.id).padStart(4,"0")}</div>
      <div class="product-name">${p.title}</div>
      <div class="product-footer">
        <div class="product-price">$${p.price.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        <button class="btn-add" onclick="agregarCarrito(${p.id})" ${agotado ? "disabled" : ""}>${btnLabel}</button>
      </div>
    </div>
  </div>`;
}

// ─── CARRITO ───────────────────────────────────
function agregarCarrito(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  const stock = inventario[id] ?? 0;
  const item  = carrito.find(i => i.id === id);
  const qty   = item ? item.cantidad : 0;

  if (qty >= stock) {
    mostrarToast("Stock máximo alcanzado para esta referencia", "error");
    return;
  }

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({
      id: p.id,
      titulo: p.title,
      precio: p.price,
      imagen: p.thumbnail,
      category: p.category,
      cantidad: 1
    });
  }

  guardarCarritoLS();
  actualizarCarritoUI();
  renderCaja(productos.filter(x => {
    const t = document.getElementById("buscar-caja").value.toLowerCase();
    const c = document.getElementById("filtro-cat-caja").value;
    return x.title.toLowerCase().includes(t) && (!c || x.category === c);
  }));
  mostrarToast(`Referencia #${String(id).padStart(4,"0")} añadida al carrito`, "success");
}

function cambiarCantidad(id, delta) {
  const item  = carrito.find(i => i.id === id);
  if (!item) return;
  const stock = inventario[id] ?? 0;
  const nueva = item.cantidad + delta;

  if (nueva <= 0) { eliminarDelCarrito(id); return; }
  if (nueva > stock) { mostrarToast("Sin stock adicional disponible", "error"); return; }

  item.cantidad = nueva;
  guardarCarritoLS();
  actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarritoLS();
  actualizarCarritoUI();
  filtrarCaja();
}

function limpiarCarrito() {
  if (!carrito.length) return;
  carrito = [];
  guardarCarritoLS();
  actualizarCarritoUI();
  filtrarCaja();
}

function actualizarCarritoUI() {
  const contenedor = document.getElementById("cart-items");
  const label      = document.getElementById("cart-count-label");
  const badge      = document.getElementById("cart-badge");
  const checkout   = document.getElementById("btn-checkout");

  const totalUds = carrito.reduce((s, i) => s + i.cantidad, 0);

  // Badge en nav
  if (totalUds > 0) {
    badge.style.display = "inline-flex";
    badge.textContent   = totalUds;
  } else {
    badge.style.display = "none";
  }

  if (!carrito.length) {
    contenedor.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">◈</div><div class="cart-empty-text">Carrito vacío</div></div>`;
    label.textContent    = "Ningún artículo seleccionado";
    document.getElementById("subtotal").textContent  = "$0.00";
    document.getElementById("iva").textContent       = "$0.00";
    document.getElementById("total-caja").textContent= "$0.00";
    checkout.disabled = true;
    return;
  }

  label.textContent = `${totalUds} artículo${totalUds !== 1 ? "s" : ""} seleccionado${totalUds !== 1 ? "s" : ""}`;

  contenedor.innerHTML = carrito.map(item => {
    const sub = item.precio * item.cantidad;
    const stock = inventario[item.id] ?? 0;
    return `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.imagen}" alt="${item.titulo}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'56\\' height=\\'56\\'><rect width=\\'56\\' height=\\'56\\' fill=\\'%231a1a15\\'/><text x=\\'50%\\' y=\\'58%\\' text-anchor=\\'middle\\' font-size=\\'24\\' fill=\\'%235c5845\\'>⌚</text></svg>'"/>
      <div>
        <div class="cart-item-name">${item.titulo}</div>
        <div class="cart-item-ref">Ref. #${String(item.id).padStart(4,"0")}</div>
        <div class="cart-item-unitprice">$${item.precio.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})} / ud.</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="cambiarCantidad(${item.id},-1)">−</button>
          <span class="qty-num">${item.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${item.id},1)" ${item.cantidad >= stock ? "disabled style='opacity:0.3;cursor:not-allowed'" : ""}>+</button>
          <button class="btn-remove" onclick="eliminarDelCarrito(${item.id})">Quitar</button>
        </div>
      </div>
      <div>
        <div class="cart-item-subtotal">$${sub.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      </div>
    </div>`;
  }).join("");

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const iva      = subtotal * 0.19;
  const total    = subtotal + iva;

  document.getElementById("subtotal").textContent   = "$" + subtotal.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById("iva").textContent        = "$" + iva.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById("total-caja").textContent = "$" + total.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2});
  checkout.disabled = false;
}

// ─── PROCESAR VENTA ────────────────────────────
function procesarVenta() {
  if (!carrito.length) return;

  // Validar stock
  for (const item of carrito) {
    if ((inventario[item.id] ?? 0) < item.cantidad) {
      mostrarToast(`Stock insuficiente: ${item.titulo}`, "error");
      return;
    }
  }

  const cliente  = document.getElementById("cliente-nombre").value.trim() || "Cliente Anónimo";
  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const iva      = subtotal * 0.19;
  const total    = subtotal + iva;
  const ahora    = new Date();

  // Generar ID de venta estilo boutique
  const ventaId = "AUR-" + ahora.getFullYear() +
    String(ahora.getMonth()+1).padStart(2,"0") +
    String(ahora.getDate()).padStart(2,"0") + "-" +
    String(ahora.getTime()).slice(-5);

  ventaActual = {
    id:        ventaId,
    fechaISO:  ahora.toISOString(),
    fecha:     ahora.toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" }),
    hora:      ahora.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" }),
    cliente,
    items:     carrito.map(i => ({ ...i })),
    subtotal,
    iva,
    total
  };

  // Descontar stock
  carrito.forEach(item => {
    inventario[item.id] = (inventario[item.id] ?? 0) - item.cantidad;
  });
  guardarInventarioLS();

  // Guardar en historial
  const hist = JSON.parse(localStorage.getItem("historial_aurum") || "[]");
  hist.unshift(ventaActual);
  localStorage.setItem("historial_aurum", JSON.stringify(hist));

  // Limpiar carrito
  carrito = [];
  document.getElementById("cliente-nombre").value = "";
  guardarCarritoLS();
  actualizarCarritoUI();
  filtrarInventario();
  actualizarStatVentas();

  // Mostrar comprobante
  mostrarComprobante(ventaActual);
}

// ─── COMPROBANTE ───────────────────────────────
function mostrarComprobante(venta) {
  const filas = venta.items.map(item => `
    <tr>
      <td>
        ${item.titulo}
        <span class="comp-td-ref">Ref. #${String(item.id).padStart(4,"0")} · ${coleccionNombre(item.category)}</span>
      </td>
      <td>${item.cantidad}</td>
      <td>$${item.precio.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td>$${(item.precio * item.cantidad).toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
    </tr>`).join("");

  document.getElementById("comp-contenido").innerHTML = `
    <div class="comp-header">
      <div class="comp-logo">AURUM</div>
      <div class="comp-tagline">Haute Horlogerie · Boutique de Relojes</div>
      <div class="comp-divider"></div>
      <div class="comp-meta">
        <div class="comp-meta-item">
          <div class="comp-meta-label">N° Comprobante</div>
          <div class="comp-meta-value gold">${venta.id}</div>
        </div>
        <div class="comp-meta-item" style="text-align:right;">
          <div class="comp-meta-label">Fecha</div>
          <div class="comp-meta-value">${venta.fecha}</div>
        </div>
        <div class="comp-meta-item">
          <div class="comp-meta-label">Cliente</div>
          <div class="comp-meta-value">${venta.cliente}</div>
        </div>
        <div class="comp-meta-item" style="text-align:right;">
          <div class="comp-meta-label">Hora</div>
          <div class="comp-meta-value">${venta.hora}</div>
        </div>
      </div>
    </div>
    <div class="comp-body">
      <table class="comp-table">
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Cant.</th>
            <th>P. Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="comp-totals">
        <div class="comp-total-row">
          <span>Subtotal</span>
          <span>$${venta.subtotal.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
        <div class="comp-total-row">
          <span>IVA (19%)</span>
          <span>$${venta.iva.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
        <div class="comp-total-row grand">
          <span>Total a pagar</span>
          <span>$${venta.total.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    </div>
    <div class="comp-footer">
      <div class="comp-thanks">Merci pour votre confiance</div>
      <div class="comp-note">Garantía internacional · Servicio post-venta · aurum.boutique</div>
    </div>
    <div class="comp-actions">
      <button class="btn btn-outline" onclick="imprimirComprobante()">Imprimir</button>
      <button class="btn btn-gold" onclick="cerrarModal()">Cerrar</button>
    </div>`;

  document.getElementById("modal-comprobante").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modal-comprobante").classList.remove("open");
}

function cerrarModalSiOverlay(e) {
  if (e.target === document.getElementById("modal-comprobante")) cerrarModal();
}

function imprimirComprobante() {
  window.print();
}

// ─── HISTORIAL ─────────────────────────────────
function renderHistorial() {
  const hist = JSON.parse(localStorage.getItem("historial_aurum") || "[]");
  const cont = document.getElementById("historial-lista");

  if (!hist.length) {
    cont.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">◈</div>
        <p>Sin ventas registradas</p>
      </div>`;
    return;
  }

  cont.innerHTML = `<div class="historial-grid">${hist.map((v, idx) => `
    <div class="venta-card" onclick="verComprobante(${idx})">
      <div class="venta-id">${v.id}</div>
      <div class="venta-fecha">${v.fecha} · ${v.hora || ""}</div>
      ${v.cliente !== "Cliente Anónimo" ? `<div class="venta-cliente-tag">👤 ${v.cliente}</div>` : ""}
      <div class="venta-items-preview">${v.items.slice(0,3).map(i => i.titulo).join(" · ")}${v.items.length > 3 ? ` +${v.items.length-3} más` : ""}</div>
      <div class="venta-footer">
        <div class="venta-total">$${v.total.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        <div class="venta-uds">${v.items.reduce((s,i)=>s+i.cantidad,0)} ud${v.items.reduce((s,i)=>s+i.cantidad,0)!==1?"s":""} vendida${v.items.reduce((s,i)=>s+i.cantidad,0)!==1?"s":""}</div>
      </div>
    </div>`).join("")}</div>`;
}

function verComprobante(idx) {
  const hist = JSON.parse(localStorage.getItem("historial_aurum") || "[]");
  if (hist[idx]) mostrarComprobante(hist[idx]);
}

function limpiarHistorial() {
  if (!confirm("¿Limpiar todo el historial de ventas?")) return;
  localStorage.removeItem("historial_aurum");
  renderHistorial();
  actualizarStatVentas();
  mostrarToast("Historial eliminado", "");
}

// ─── LOCAL STORAGE ─────────────────────────────
function guardarInventarioLS() {
  localStorage.setItem("inventario_aurum", JSON.stringify(inventario));
}
function guardarCarritoLS() {
  localStorage.setItem("carrito_aurum", JSON.stringify(carrito));
}
function cargarCarritoLS() {
  const c = localStorage.getItem("carrito_aurum");
  if (c) carrito = JSON.parse(c);
}

// ─── TOAST ─────────────────────────────────────
let toastTimer;
function mostrarToast(msg, tipo = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = "toast show" + (tipo ? " " + tipo : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
