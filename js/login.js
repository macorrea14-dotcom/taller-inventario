// ─── LOGIN — StoreOS ───────────────────────────────────────────────────────
// Autentica al usuario contra la lista guardada en localStorage.
// Si las credenciales son correctas, redirige a panel.html.

function login() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg      = document.getElementById("mensaje");

  msg.className = "auth-mensaje";
  msg.style.display = "none";

  if (!email || !password) {
    mostrarMensaje("Por favor completa todos los campos.", "error");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios_storeos") || "[]");
  const usuario  = usuarios.find(u => u.email === email && u.password === password);

  if (!usuario) {
    mostrarMensaje("Correo o contraseña incorrectos.", "error");
    return;
  }

  // Guardar sesión activa
  localStorage.setItem("sesion_storeos", JSON.stringify({
    id:     usuario.id,
    nombre: usuario.nombre,
    email:  usuario.email
  }));

  mostrarMensaje("¡Bienvenido! Redirigiendo...", "success");
  setTimeout(() => { window.location.href = "panel.html"; }, 900);
}

function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById("mensaje");
  msg.textContent = texto;
  msg.className   = "auth-mensaje " + tipo;
  msg.style.display = "block";
}
