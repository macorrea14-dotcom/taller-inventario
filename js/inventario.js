let productos = [];

async function iniciarInventario() {
  productos = cargarInventarioLocal();
  if (!productos || productos.length === 0) {
    productos = await fetchProductos();
    productos = productos.map(p => ({
      id: p.id,
      nombre: p.title,
      precio: p.price,
      categoria: p.category,
      descripcion: p.description,
      imagen: p.thumbnail,
      stock: 10
    }));
    guardarInventarioLocal();
  }
  renderCategorias();
  mostrarProductos(productos);
}

function guardarInventarioLocal() {
  localStorage.setItem("inventario", JSON.stringify(productos));
}

function cargarInventarioLocal() {
  const data = localStorage.getItem("inventario");
  return data ? JSON.parse(data) : null;
}

function mostrarProductos(lista) {
  const contenedor = document.getElementById("resultado");
  if (!lista || lista.length === 0) {
    contenedor.innerHTML = `<p class="sin-resultados">No se encontraron productos.</p>`;
    return;
  }
  contenedor.innerHTML = lista.map(p => `
    <div class="producto-card">
      <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/200x160?text=Sin+imagen'">
      <div class="producto-info">
        <span class="producto-categoria">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p class="producto-descripcion">${p.descripcion ? p.descripcion.substring(0, 80) + '...' : ''}</p>
        <div class="producto-footer">
          <span class="producto-precio">$${p.precio.toFixed(2)}</span>
          <span class="producto-stock ${p.stock === 0 ? 'sin-stock' : ''}">
            ${p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
          </span>
        </div>
        <p class="producto-id">ID: ${p.id}</p>
      </div>
    </div>
  `).join('');
}

function buscarProductos() {
  const texto = document.getElementById("buscar").value.toLowerCase().trim();
  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
  mostrarProductos(filtrados);
}

function filtrarPorCategoria() {
  const categoria = document.getElementById("filtroCategoria").value;
  let lista = [...productos];
  if (categoria) lista = lista.filter(p => p.categoria === categoria);
  const texto = document.getElementById("buscar").value.toLowerCase().trim();
  if (texto) lista = lista.filter(p => p.nombre.toLowerCase().includes(texto));
  const orden = document.getElementById("ordenar").value;
  if (orden === "asc") lista.sort((a, b) => a.precio - b.precio);
  else if (orden === "desc") lista.sort((a, b) => b.precio - a.precio);
  mostrarProductos(lista);
}

function ordenarProductos() {
  filtrarPorCategoria();
}

function renderCategorias() {
  const select = document.getElementById("filtroCategoria");
  const categorias = [...new Set(productos.map(p => p.categoria))].sort();
  select.innerHTML = `<option value="">Todas las categorías</option>` +
    categorias.map(c => `<option value="${c}">${c}</option>`).join('');
}

function actualizarStockTrasVenta(carrito) {
  carrito.forEach(item => {
    const p = productos.find(prod => prod.id === item.id);
    if (p) p.stock = Math.max(0, p.stock - item.cantidad);
  });
  guardarInventarioLocal();
}

window.onload = iniciarInventario;
