import { auth } from "../firebase/auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorAlert = document.getElementById("errorAlert");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Ocultamos alertas previas y deshabilitamos el botón
  if (errorAlert) errorAlert.classList.add("d-none");
  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando credenciales...";

  // Sanitizado básico eliminando espacios vacíos laterales (.trim())
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Fallo de autenticación:", error.code);
    
    // Mostramos la alerta de Bootstrap en vez del molesto alert() nativo
    if (errorAlert) {
      errorAlert.classList.remove("d-none");
    } else {
      alert("Correo o contraseña incorrectos");
    }
  } finally {
    // Si falla, el botón vuelve a la normalidad para permitir reintentar
    loginBtn.disabled = false;
    loginBtn.textContent = "Ingresar al panel";
  }
});