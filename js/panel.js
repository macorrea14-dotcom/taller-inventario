// ─── PANEL — StoreOS ──────────────────────────────────────────────────────
// Verifica sesión activa. Si no hay sesión redirige a login.
// Muestra bienvenida personalizada y lista de usuarios registrados.

window.onload = function () {
  const sesion = JSON.parse(localStorage.getItem("sesion_storeos") || "null");

  if (!sesion) {
    window.location.href = "login.html";
    return;
  }

  // Bienvenida
  const nombreEl  = document.getElementById("bienvenida");
  const avatarEl  = document.getElementById("avatar-inicial");

  if (nombreEl)  nombreEl.textContent  = "Hola, " + sesion.nombre;
  if (avatarEl)  avatarEl.textContent  = sesion.nombre.charAt(0).toUpperCase();

  renderTablaUsuarios();
};

function cerrarSesion() {
  localStorage.removeItem("sesion_storeos");
  window.location.href = "login.html";
}

function renderTablaUsuarios() {
  const contenedor = document.getElementById("tabla-usuarios");
  if (!contenedor) return;

  const usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");

  if (!usuarios.length) {
    contenedor.innerHTML = `<p class="sin-usuarios">No hay usuarios registrados aún. <a href="registro.html" style="color:var(--accent)">Crear uno</a>.</p>`;
    return;
  }

  const filas = usuarios.map(u => `
    <tr>
      <td>${u.nombre}</td>
      <td class="tag-email">${u.email}</td>
      <td>
        <button class="btn-danger-sm" onclick="eliminarUsuarioPanel('${u.id}')">Eliminar</button>
      </td>
    </tr>
  `).join("");

  contenedor.innerHTML = `
    <table class="usuarios-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function eliminarUsuarioPanel(id) {
  if (!confirm("¿Eliminar este usuario?")) return;

  const sesion   = JSON.parse(localStorage.getItem("sesion_storeos") || "null");
  let usuarios   = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");
  const objetivo = usuarios.find(u => u.id === id);

  // No permitir eliminar la sesión activa
  if (sesion && objetivo && objetivo.email === sesion.email) {
    alert("No puedes eliminar tu propia cuenta desde aquí. Cierra sesión primero.");
    return;
  }

  usuarios = usuarios.filter(u => u.id !== id);
  localStorage.setItem("usuarios_storeos", JSON.stringify(usuarios));
  renderTablaUsuarios();
}
