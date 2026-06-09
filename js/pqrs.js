import { db } from "./firebase/firestore.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const form = document.getElementById("pqrs-form");
const inputFile = document.getElementById("evidencias");
const fileListContainer = document.getElementById("file-list");
const submitBtn = document.getElementById("submit-btn");

const IMGBB_API_KEY = "7ca695ddde491f82c8ce1d020d47feb1";

if (inputFile) {
  inputFile.addEventListener("change", () => {
    const archivos = inputFile.files;
    fileListContainer.innerHTML = "";

    if (archivos.length > 3) {
      alert("Solo se permite un máximo de 3 archivos como evidencia.");
      inputFile.value = "";
      return;
    }

    if (archivos.length > 0) {
      const listaNombres = Array.from(archivos).map(f => f.name).join(", ");
      fileListContainer.textContent = `Archivos seleccionados: ${listaNombres}`;
    }
  });
}

function convertirArchivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

async function subirImagenImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });

  if (!respuesta.ok) {
    throw new Error("Error en el servidor de ImgBB");
  }

  const resultado = await respuesta.json();
  return resultado.data.url;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const archivos = inputFile.files;
  const urlsEvidencias = [];

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando solicitud...";

  try {
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];

      if (archivo.type.startsWith("image/")) {
        const urlImagen = await subirImagenImgBB(archivo);
        urlsEvidencias.push({
          nombre: archivo.name,
          tipo: "imagen",
          url: urlImagen
        });
      } else {
        const base64Documento = await convertirArchivoBase64(archivo);
        urlsEvidencias.push({
          nombre: archivo.name,
          tipo: "documento",
          url: base64Documento
        });
      }
    }

    // Capturar y limpiar valores (Filtros de seguridad contra espacios en blanco y vacíos)
    const resDireccion = document.getElementById("direccion").value.trim();
    const hechoDireccion = document.getElementById("direccion-hecho").value.trim();

    // Guardado de la solicitud en Firestore con datos limpios
    await addDoc(collection(db, "pqrsf"), {
      tipo: document.getElementById("tipo").value,
      nombre: document.getElementById("nombre").value.trim(),
      tipoDocumento: document.getElementById("tipo-documento").value,
      documento: document.getElementById("documento").value.trim(),
      tipoPersona: document.getElementById("tipo-persona").value,
      correo: document.getElementById("correo").value.trim().toLowerCase(),
      direccion: resDireccion === "" ? "No aplica" : resDireccion,
      direccionHecho: hechoDireccion === "" ? "No aplica" : hechoDireccion,
      descripcion: document.getElementById("descripcion").value.trim(),
      evidencias: urlsEvidencias,
      estado: "Pendiente",
      fecha: new Date().toISOString()
    });

    alert("Solicitud enviada correctamente junto con sus evidencias.");
    form.reset();
    if (fileListContainer) fileListContainer.innerHTML = "";

  } catch (error) {
    console.error("Error al procesar el formulario de PQRSF:", error);
    alert("Hubo un error al enviar la solicitud. Por favor, intente nuevamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar solicitud";
  }
});