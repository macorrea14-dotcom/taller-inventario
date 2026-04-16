// ─── USUARIOS — StoreOS ───────────────────────────────────────────────────
// CRUD completo de usuarios guardados en localStorage.
// Usado por registro.html. Los usuarios se guardan bajo la clave
// "usuarios_storeos" y son verificados por login.js al autenticar.

window.onload = function () {
  renderListaUsuarios();
};

// ─── GUARDAR (crear o actualizar) ─────────────────────────────────────────
function guardarUsuario() {
  const id       = document.getElementById("id").value.trim();
  const nombre   = document.getElementById("nombre").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validaciones
  if (!nombre || !email || !password) {
    mostrarMensaje("Todos los campos son obligatorios.", "error");
    return;
  }

  if (!validarEmail(email)) {
    mostrarMensaje("Ingresa un correo válido.", "error");
    return;
  }

  if (password.length < 6) {
    mostrarMensaje("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");

  if (id) {
    // ── Modo edición ──
    const idx = usuarios.findIndex(u => u.id === id);
    if (idx === -1) { mostrarMensaje("Usuario no encontrado.", "error"); return; }

    // Verificar email duplicado (otro usuario)
    const duplicado = usuarios.find(u => u.email === email && u.id !== id);
    if (duplicado) { mostrarMensaje("Ese correo ya está registrado.", "error"); return; }

    usuarios[idx] = { id, nombre, email, password };
    localStorage.setItem("usuarios_storeos", JSON.stringify(usuarios));
    mostrarMensaje("Usuario actualizado correctamente.", "success");

  } else {
    // ── Modo creación ──
    const duplicado = usuarios.find(u => u.email === email);
    if (duplicado) { mostrarMensaje("Ese correo ya está registrado.", "error"); return; }

    const nuevoId = "u_" + Date.now();
    usuarios.push({ id: nuevoId, nombre, email, password });
    localStorage.setItem("usuarios_storeos", JSON.stringify(usuarios));
    mostrarMensaje("Cuenta creada. Ya puedes iniciar sesión.", "success");
  }

  limpiarFormulario();
  renderListaUsuarios();
}

// ─── EDITAR ───────────────────────────────────────────────────────────────
function editarUsuario(id) {
  const usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");
  const u = usuarios.find(u => u.id === id);
  if (!u) return;

  document.getElementById("id").value       = u.id;
  document.getElementById("nombre").value   = u.nombre;
  document.getElementById("email").value    = u.email;
  document.getElementById("password").value = u.password;

  const titulo = document.getElementById("form-titulo");
  if (titulo) titulo.textContent = "Editar usuario";

  const btnCancelar = document.getElementById("btn-cancelar");
  if (btnCancelar) btnCancelar.style.display = "block";

  // Scroll suave al formulario
  document.querySelector(".auth-brand")?.scrollIntoView({ behavior: "smooth" });
}

// ─── ELIMINAR ─────────────────────────────────────────────────────────────
function eliminarUsuario(id) {
  if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;

  let usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");
  usuarios = usuarios.filter(u => u.id !== id);
  localStorage.setItem("usuarios_storeos", JSON.stringify(usuarios));
  renderListaUsuarios();
  mostrarMensaje("Usuario eliminado.", "");
}

// ─── CANCELAR EDICIÓN ─────────────────────────────────────────────────────
function cancelarEdicion() {
  limpiarFormulario();
  ocultarMensaje();
}

// ─── RENDER LISTA ─────────────────────────────────────────────────────────
function renderListaUsuarios() {
  const contenedor = document.getElementById("listaUsuarios");
  if (!contenedor) return;

  const usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");

  if (!usuarios.length) {
    contenedor.innerHTML = `<p class="sin-usuarios">Sin usuarios aún.</p>`;
    return;
  }

  contenedor.innerHTML = usuarios.map(u => `
    <div class="usuario-item">
      <div class="usuario-info">
        <div class="usuario-nombre">${escapeHtml(u.nombre)}</div>
        <div class="usuario-email">${escapeHtml(u.email)}</div>
      </div>
      <div class="usuario-acciones">
        <button class="btn-editar" onclick="editarUsuario('${u.id}')">Editar</button>
        <button class="btn-eliminar" onclick="eliminarUsuario('${u.id}')">Eliminar</button>
      </div>
    </div>
  `).join("");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
function limpiarFormulario() {
  document.getElementById("id").value       = "";
  document.getElementById("nombre").value   = "";
  document.getElementById("email").value    = "";
  document.getElementById("password").value = "";

  const titulo = document.getElementById("form-titulo");
  if (titulo) titulo.textContent = "Crear nueva cuenta";

  const btnCancelar = document.getElementById("btn-cancelar");
  if (btnCancelar) btnCancelar.style.display = "none";
}

function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById("mensaje");
  if (!msg) return;
  msg.textContent  = texto;
  msg.className    = "auth-mensaje" + (tipo ? " " + tipo : "");
  msg.style.display = texto ? "block" : "none";
}

function ocultarMensaje() {
  mostrarMensaje("", "");
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
