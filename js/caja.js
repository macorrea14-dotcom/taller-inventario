let carrito = [];
let productosDisponibles = [];

function iniciarCaja() {
  productosDisponibles = cargarInventarioLocal();
  if (!productosDisponibles || productosDisponibles.length === 0) {
    document.getElementById("resultado-caja").innerHTML =
      `<p class="sin-resultados">No hay productos en el inventario. <a href="inventario.html">Ir al inventario</a></p>`;
    return;
  }
  renderCategoriasC();
  mostrarProductosCaja(productosDisponibles);
  actualizarCarritoUI();
}

function cargarInventarioLocal() {
  const data = localStorage.getItem("inventario");
  return data ? JSON.parse(data) : [];
}

function guardarInventarioLocal(inv) {
  localStorage.setItem("inventario", JSON.stringify(inv));
}

function mostrarProductosCaja(lista) {
  const contenedor = document.getElementById("resultado-caja");
  if (!lista || lista.length === 0) {
    contenedor.innerHTML = `<p class="sin-resultados">No se encontraron productos.</p>`;
    return;
  }
  contenedor.innerHTML = lista.map(p => `
    <div class="producto-card ${p.stock === 0 ? 'agotado' : ''}">
      <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/200x160?text=Sin+imagen'">
      <div class="producto-info">
        <span class="producto-categoria">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <div class="producto-footer">
          <span class="producto-precio">$${p.precio.toFixed(2)}</span>
          <span class="producto-stock ${p.stock === 0 ? 'sin-stock' : ''}">
            ${p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
          </span>
        </div>
        <button onclick="agregarAlCarrito(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
          ${p.stock === 0 ? 'Agotado' : '+ Agregar'}
        </button>
      </div>
    </div>
  `).join('');
}

function agregarAlCarrito(id) {
  const producto = productosDisponibles.find(p => p.id === id);
  if (!producto || producto.stock === 0) {
    alert("Producto sin stock disponible.");
    return;
  }
  const enCarrito = carrito.find(item => item.id === id);
  if (enCarrito) {
    if (enCarrito.cantidad >= producto.stock) {
      alert("No hay más stock disponible para este producto.");
      return;
    }
    enCarrito.cantidad++;
    enCarrito.subtotal = enCarrito.cantidad * enCarrito.precioUnitario;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: 1,
      subtotal: producto.precio
    });
  }
  actualizarCarritoUI();
}

function cambiarCantidad(id, nuevaCantidad) {
  const producto = productosDisponibles.find(p => p.id === id);
  const item = carrito.find(i => i.id === id);
  if (!item || !producto) return;
  nuevaCantidad = parseInt(nuevaCantidad);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
    eliminarDelCarrito(id);
    return;
  }
  if (nuevaCantidad > producto.stock) {
    alert(`Solo hay ${producto.stock} unidades disponibles.`);
    nuevaCantidad = producto.stock;
  }
  item.cantidad = nuevaCantidad;
  item.subtotal = item.cantidad * item.precioUnitario;
  actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const lista = document.getElementById("carrito-lista");
  const totalEl = document.getElementById("total");
  const btnConfirmar = document.getElementById("btn-confirmar");

  if (carrito.length === 0) {
    lista.innerHTML = `<p class="carrito-vacio">El carrito está vacío.</p>`;
    totalEl.textContent = "Total: $0.00";
    if (btnConfirmar) btnConfirmar.disabled = true;
    return;
  }

  if (btnConfirmar) btnConfirmar.disabled = false;

  lista.innerHTML = carrito.map(item => `
    <div class="carrito-item">
      <div class="carrito-item-info">
        <span class="carrito-nombre">${item.nombre}</span>
        <span class="carrito-precio-unit">$${item.precioUnitario.toFixed(2)} c/u</span>
      </div>
      <div class="carrito-item-controls">
        <input type="number" min="1" value="${item.cantidad}"
          onchange="cambiarCantidad(${item.id}, this.value)" class="input-cantidad">
        <span class="carrito-subtotal">$${item.subtotal.toFixed(2)}</span>
        <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">✕</button>
      </div>
    </div>
  `).join('');

  const total = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

function confirmarVenta() {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const inventario = cargarInventarioLocal();
  for (const item of carrito) {
    const prod = inventario.find(p => p.id === item.id);
    if (!prod || prod.stock < item.cantidad) {
      alert(`Stock insuficiente para: ${item.nombre}`);
      return;
    }
  }

  carrito.forEach(item => {
    const prod = inventario.find(p => p.id === item.id);
    if (prod) prod.stock -= item.cantidad;
  });
  guardarInventarioLocal(inventario);

  const venta = {
    idVenta: Date.now(),
    fecha: new Date().toLocaleString("es-CO"),
    productos: [...carrito],
    total: carrito.reduce((acc, i) => acc + i.subtotal, 0)
  };

  const historial = JSON.parse(localStorage.getItem("historialVentas") || "[]");
  historial.push(venta);
  localStorage.setItem("historialVentas", JSON.stringify(historial));

  generarComprobante(venta);
  carrito = [];
  productosDisponibles = cargarInventarioLocal();
  renderCategoriasC();
  mostrarProductosCaja(productosDisponibles);
  actualizarCarritoUI();
}

function generarComprobante(venta) {
  const modal = document.getElementById("modal-comprobante");
  const contenido = document.getElementById("comprobante-contenido");
  contenido.innerHTML = `
    <h3>🧾 Comprobante de Venta</h3>
    <p><strong>ID Venta:</strong> #${venta.idVenta}</p>
    <p><strong>Fecha:</strong> ${venta.fecha}</p>
    <hr>
    <table class="tabla-comprobante">
      <thead>
        <tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr>
      </thead>
      <tbody>
        ${venta.productos.map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>$${p.precioUnitario.toFixed(2)}</td>
            <td>$${p.subtotal.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <hr>
    <p class="total-comprobante"><strong>Total: $${venta.total.toFixed(2)}</strong></p>
  `;
  modal.classList.remove("oculto");
}

function cerrarComprobante() {
  document.getElementById("modal-comprobante").classList.add("oculto");
}

function buscarProductosCaja() {
  const texto = document.getElementById("buscar-caja").value.toLowerCase().trim();
  const categoria = document.getElementById("filtroCategoriaCaja").value;
  let lista = [...productosDisponibles];
  if (texto) lista = lista.filter(p => p.nombre.toLowerCase().includes(texto));
  if (categoria) lista = lista.filter(p => p.categoria === categoria);
  mostrarProductosCaja(lista);
}

function filtrarCategoriaCaja() {
  buscarProductosCaja();
}

function renderCategoriasC() {
  const select = document.getElementById("filtroCategoriaCaja");
  if (!select) return;
  const categorias = [...new Set(productosDisponibles.map(p => p.categoria))].sort();
  select.innerHTML = `<option value="">Todas las categorías</option>` +
    categorias.map(c => `<option value="${c}">${c}</option>`).join('');
}

window.onload = iniciarCaja;
