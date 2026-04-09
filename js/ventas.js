function cargarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialVentas") || "[]");
  const contenedor = document.getElementById("historial-ventas");

  if (historial.length === 0) {
    contenedor.innerHTML = `<p class="sin-resultados">No hay ventas registradas aún.</p>`;
    return;
  }

  const ventasOrdenadas = [...historial].reverse();

  contenedor.innerHTML = ventasOrdenadas.map(venta => `
    <div class="venta-card">
      <div class="venta-header">
        <span class="venta-id">Venta #${venta.idVenta}</span>
        <span class="venta-fecha">${venta.fecha}</span>
        <span class="venta-total">$${venta.total.toFixed(2)}</span>
      </div>
      <table class="tabla-venta">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Subtotal</th>
          </tr>
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
    </div>
  `).join('');

  actualizarResumen(historial);
}

function actualizarResumen(historial) {
  const totalVentas = historial.length;
  const totalIngresos = historial.reduce((acc, v) => acc + v.total, 0);
  const totalProductos = historial.reduce((acc, v) =>
    acc + v.productos.reduce((a, p) => a + p.cantidad, 0), 0);

  document.getElementById("resumen-ventas").innerHTML = `
    <div class="resumen-card">
      <span class="resumen-label">Total Ventas</span>
      <span class="resumen-valor">${totalVentas}</span>
    </div>
    <div class="resumen-card">
      <span class="resumen-label">Ingresos Totales</span>
      <span class="resumen-valor">$${totalIngresos.toFixed(2)}</span>
    </div>
    <div class="resumen-card">
      <span class="resumen-label">Productos Vendidos</span>
      <span class="resumen-valor">${totalProductos}</span>
    </div>
  `;
}

function limpiarHistorial() {
  if (confirm("¿Estás seguro de que quieres eliminar todo el historial de ventas?")) {
    localStorage.removeItem("historialVentas");
    cargarHistorial();
  }
}

window.onload = cargarHistorial;
