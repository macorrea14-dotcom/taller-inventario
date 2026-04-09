// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = "https://dummyjson.com/products?limit=100";
const STOCK_INICIAL = 10; // unidades de stock por producto al cargar
const LS_STOCK = "dash_stock";
const LS_CARRITO = "dash_carrito";

// ─── ESTADO ────────────────────────────────────────────────────────────────
let productos = [];
let stock = {};       // { [id]: cantidad }
let carrito = {};     // { [id]: { producto, cantidad } }
let categoriaActiva = "todas";

// ─── INICIALIZACIÓN ─────────────────────────────────────────────────────────
window.onload = async () => {
  cargarDesdeLS();
  await listarProductos();
};

// ─── API ────────────────────────────────────────────────────────────────────
async function listarProductos() {
  try {
    const res = await fetch(API);
    const datos = await res.json();
    productos = datos.products;

    // Asignar stock inicial solo a productos que no tienen registro aún
    productos.forEach((p) => {
      if (stock[p.id] === undefined) {
        stock[p.id] = STOCK_INICIAL;
      }
    });

    guardarStockLS();
    renderCategorias();
    filtrarYMostrar();
  } catch (err) {
    document.getElementById("resultado").innerHTML = `
      <div class="loading" style="color:var(--danger)">
        Error al cargar productos. Revisa tu conexión.
      </div>`;
  }
}

// ─── RENDERIZADO ─────────────────────────────────────────────────────────────
function renderCategorias() {
  const cats = ["todas", ...new Set(productos.map((p) => p.category))];
  const wrap = document.getElementById("categorias");
  wrap.innerHTML = cats
    .map(
      (c) =>
        `<button class="cat-pill ${c === categoriaActiva ? "active" : ""}"
          onclick="setCategoria('${c}')">${c}</button>`
    )
    .join("");
}

function setCategoria(cat) {
  categoriaActiva = cat;
  document.querySelectorAll(".cat-pill").forEach((el) => {
    el.classList.toggle("active", el.textContent === cat);
  });
  filtrarYMostrar();
}

function filtrarYMostrar() {
  const texto = document.getElementById("buscar").value.toLowerCase().trim();
  const orden = document.getElementById("ordenar").value;

  let lista = productos.filter((p) => {
    const porNombre = p.title.toLowerCase().includes(texto);
    const porCat =
      categoriaActiva === "todas" || p.category === categoriaActiva;
    return porNombre && porCat;
  });

  if (orden === "asc") lista.sort((a, b) => a.price - b.price);
  else if (orden === "desc") lista.sort((a, b) => b.price - a.price);

  mostrarProductos(lista);
  actualizarStats(lista);
}

function mostrarProductos(lista) {
  const wrap = document.getElementById("resultado");

  if (lista.length === 0) {
    wrap.innerHTML = `<div class="loading">No se encontraron productos.</div>`;
    return;
  }

  wrap.innerHTML = lista
    .map((p, i) => {
      const s = stock[p.id] ?? 0;
      const stockClass = s === 0 ? "stock-zero" : s <= 3 ? "stock-low" : "stock-ok";
      const stockLabel = s === 0 ? "Sin stock" : s <= 3 ? `${s} restantes` : `${s} en stock`;
      const inCart = carrito[p.id]?.cantidad ?? 0;
      const canAdd = s > 0 && inCart < s;

      return `
<div class="producto" style="animation-delay:${i * 30}ms">
  <img class="producto-img" src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
  <div class="producto-body">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="producto-cat">${p.category}</span>
      <span class="producto-id">#${p.id}</span>
    </div>
    <div class="producto-title">${p.title}</div>
    <div class="producto-desc">${p.description}</div>
    <div class="producto-meta">
      <span class="producto-price">$${p.price.toFixed(2)}</span>
      <span class="stock-badge ${stockClass}">${stockLabel}</span>
    </div>
    <button class="add-btn" id="btn-${p.id}"
      onclick="agregarCarrito(${p.id})"
      ${canAdd ? "" : "disabled"}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      ${s === 0 ? "Sin stock" : "Agregar al carrito"}
    </button>
  </div>
</div>`;
    })
    .join("");
}

function actualizarStats(lista) {
  document.getElementById("statCount").textContent = lista.length;
  const totalStock = lista.reduce((acc, p) => acc + (stock[p.id] ?? 0), 0);
  document.getElementById("statStock").textContent = totalStock;
}

// ─── CARRITO ──────────────────────────────────────────────────────────────────
function agregarCarrito(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  const stockDisp = stock[id] ?? 0;
  const enCarrito = carrito[id]?.cantidad ?? 0;

  if (enCarrito >= stockDisp) {
    toast("⚠️ No hay más stock disponible");
    return;
  }

  if (carrito[id]) {
    carrito[id].cantidad += 1;
  } else {
    carrito[id] = { producto, cantidad: 1 };
  }

  guardarCarritoLS();
  actualizarCarritoUI();
  actualizarBtnProducto(id);
  animarBadge();
  toast(`✓ ${producto.title} agregado`);
}

function cambiarCantidad(id, delta) {
  if (!carrito[id]) return;
  const nueva = carrito[id].cantidad + delta;

  if (nueva <= 0) {
    eliminarDelCarrito(id);
    return;
  }

  const stockDisp = stock[id] ?? 0;
  if (nueva > stockDisp) {
    toast("⚠️ Sin stock suficiente");
    return;
  }

  carrito[id].cantidad = nueva;
  guardarCarritoLS();
  actualizarCarritoUI();
  actualizarBtnProducto(id);
}

function eliminarDelCarrito(id) {
  delete carrito[id];
  guardarCarritoLS();
  actualizarCarritoUI();
  actualizarBtnProducto(id);
}

function limpiarCarrito() {
  carrito = {};
  guardarCarritoLS();
  actualizarCarritoUI();
  // Re-habilitar todos los botones
  document.querySelectorAll(".add-btn").forEach((btn) => {
    const id = parseInt(btn.id.replace("btn-", ""));
    if (id && (stock[id] ?? 0) > 0) btn.disabled = false;
  });
  toast("Carrito vaciado");
}

function actualizarCarritoUI() {
  const lista = document.getElementById("carrito");
  const total = document.getElementById("total");
  const badge = document.getElementById("cartCount");
  const checkout = document.getElementById("checkoutBtn");

  const items = Object.values(carrito);

  if (items.length === 0) {
    lista.innerHTML = `<li class="cart-empty">Tu carrito está vacío.<br/>Agrega productos para comenzar.</li>`;
    total.textContent = "$0.00";
    badge.textContent = "0";
    checkout.disabled = true;
    return;
  }

  let totalPrecio = 0;
  let totalItems = 0;

  lista.innerHTML = items
    .map(({ producto: p, cantidad }) => {
      const subtotal = (p.price * cantidad).toFixed(2);
      totalPrecio += p.price * cantidad;
      totalItems += cantidad;
      return `
<li class="cart-item">
  <div class="cart-item-title">${p.title}</div>
  <div class="cart-item-row">
    <div class="qty-ctrl">
      <button class="qty-btn" onclick="cambiarCantidad(${p.id}, -1)">−</button>
      <span class="qty-num">${cantidad}</span>
      <button class="qty-btn" onclick="cambiarCantidad(${p.id}, 1)">+</button>
    </div>
    <span class="cart-item-price">$${subtotal}</span>
    <button class="remove-btn" onclick="eliminarDelCarrito(${p.id})" title="Eliminar">✕</button>
  </div>
</li>`;
    })
    .join("");

  total.textContent = `$${totalPrecio.toFixed(2)}`;
  badge.textContent = totalItems;
  checkout.disabled = false;
}

function actualizarBtnProducto(id) {
  const btn = document.getElementById(`btn-${id}`);
  if (!btn) return;
  const s = stock[id] ?? 0;
  const enCarrito = carrito[id]?.cantidad ?? 0;
  const canAdd = s > 0 && enCarrito < s;
  btn.disabled = !canAdd;
  btn.querySelector
    ? null
    : (btn.innerHTML = s === 0 ? "Sin stock" : "Agregar al carrito");
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
function checkout() {
  if (Object.keys(carrito).length === 0) return;

  // Descontar stock por cada ítem vendido
  Object.entries(carrito).forEach(([id, { cantidad }]) => {
    stock[id] = Math.max(0, (stock[id] ?? 0) - cantidad);
  });

  guardarStockLS();
  carrito = {};
  guardarCarritoLS();

  actualizarCarritoUI();
  filtrarYMostrar(); // re-render para reflejar nuevo stock
  toast("🎉 ¡Compra confirmada! Stock actualizado.");
}

// ─── CART TOGGLE (móvil) ──────────────────────────────────────────────────────
function toggleCart() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ─── LOCALSTORAGE ─────────────────────────────────────────────────────────────
function guardarStockLS() {
  localStorage.setItem(LS_STOCK, JSON.stringify(stock));
}

function guardarCarritoLS() {
  localStorage.setItem(LS_CARRITO, JSON.stringify(carrito));
}

function cargarDesdeLS() {
  try {
    const s = localStorage.getItem(LS_STOCK);
    if (s) stock = JSON.parse(s);
  } catch { stock = {}; }

  try {
    const c = localStorage.getItem(LS_CARRITO);
    if (c) carrito = JSON.parse(c);
  } catch { carrito = {}; }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

// ─── ANIMACIÓN BADGE ─────────────────────────────────────────────────────────
function animarBadge() {
  const badge = document.getElementById("cartCount");
  badge.classList.remove("bump");
  requestAnimationFrame(() => badge.classList.add("bump"));
  setTimeout(() => badge.classList.remove("bump"), 300);
}
