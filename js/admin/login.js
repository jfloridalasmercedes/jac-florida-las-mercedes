import { auth } from "../firebase/auth.js";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorAlert = document.getElementById("errorAlert");
const successAlert = document.getElementById("successAlert");
const recuperarBtn = document.getElementById("recuperarBtn");

// CORREO OFICIAL DE LA ADMINISTRACIÓN - ÚNICO AUTORIZADO
const CORREO_ADMIN_OFICIAL = "jfloridalasmercedes@gmail.com";

// ==========================================
// 1. INICIAR SESIÓN NORMAL
// ==========================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (errorAlert) errorAlert.classList.add("d-none");
  if (successAlert) successAlert.classList.add("d-none");
  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando credenciales...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Fallo de autenticación:", error.code);
    if (errorAlert) {
      errorAlert.textContent = "Correo o contraseña incorrectos";
      errorAlert.classList.remove("d-none");
    } else {
      alert("Correo o contraseña incorrectos");
    }
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Ingresar al panel";
  }
});

// ==========================================
// 2. RECUPERAR CONTRASEÑA (SÚPER BLINDADO)
// ==========================================
if (recuperarBtn) {
  recuperarBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById("email").value.trim().toLowerCase();

    if (errorAlert) errorAlert.classList.add("d-none");
    if (successAlert) successAlert.classList.add("d-none");

    // FILTRO 1: Validar que el campo no esté vacío
    if (!emailInput) {
      if (errorAlert) {
        errorAlert.textContent = "Por favor, escribe primero tu correo electrónico para enviarte el enlace.";
        errorAlert.classList.remove("d-none");
      } else {
        alert("Por favor, escribe primero tu correo.");
      }
      return;
    }

    // FILTRO 2: ¡EL FILTRO DE SEGURIDAD MÁXIMA!
    // Si el correo ingresado NO es el de la JAC, bloqueamos el proceso de inmediato
    if (emailInput !== CORREO_ADMIN_OFICIAL) {
      if (errorAlert) {
        errorAlert.textContent = "Acceso denegado. Este correo no tiene permisos de administrador en este sistema.";
        errorAlert.classList.remove("d-none");
      }
      return;
    }

    // Si pasa el filtro, procedemos con Firebase de manera segura
    try {
      recuperarBtn.disabled = true;
      recuperarBtn.textContent = "Enviando enlace...";

      await sendPasswordResetEmail(auth, emailInput);

      if (successAlert) {
        successAlert.textContent = `¡Listo! Se envió un correo oficial a ${emailInput} para restablecer la contraseña de forma segura.`;
        successAlert.classList.remove("d-none");
      } else {
        alert("Correo de recuperación enviado.");
      }
    } catch (error) {
      console.error("Error en Firebase al recuperar:", error.code);
      if (errorAlert) {
        errorAlert.textContent = "Ocurrió un error al procesar la solicitud. Inténtalo más tarde.";
        errorAlert.classList.remove("d-none");
      }
    } finally {
      recuperarBtn.disabled = false;
      recuperarBtn.textContent = "¿Olvidaste la contraseña?";
    }
  });
}