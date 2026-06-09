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

// 1. INICIAR SESIÓN NORMAL
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

// 2. RECUPERAR CONTRASEÑA (ENVÍO DE CORREO AUTÓNOMO)
if (recuperarBtn) {
  recuperarBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById("email").value.trim();

    if (!emailInput) {
      if (errorAlert) {
        errorAlert.textContent = "Por favor, escribe primero tu correo electrónico para enviarte el enlace.";
        errorAlert.classList.remove("d-none");
      } else {
        alert("Por favor, escribe primero tu correo.");
      }
      return;
    }

    try {
      if (errorAlert) errorAlert.classList.add("d-none");
      recuperarBtn.disabled = true;
      recuperarBtn.textContent = "Enviando enlace...";

      // Función nativa de Firebase que gestiona el cambio de contraseñas de forma segura
      await sendPasswordResetEmail(auth, emailInput);

      if (successAlert) {
        successAlert.textContent = `¡Listo! Se envió un correo a ${emailInput} para restablecer la contraseña.`;
        successAlert.classList.remove("d-none");
      } else {
        alert("Correo de recuperación enviado.");
      }
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error.code);
      if (errorAlert) {
        errorAlert.textContent = "No se pudo enviar el correo. Verifica que el correo esté registrado.";
        errorAlert.classList.remove("d-none");
      }
    } finally {
      recuperarBtn.disabled = false;
      recuperarBtn.textContent = "¿Olvidaste la contraseña?";
    }
  });
}