import { db } from "./firebase/firestore.js";
import { storage } from "./firebase/storage.js"; // Importamos el nuevo storage
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const IMGBB_API_KEY = "AQUÍ_PEGAS_LA_API_KEY_DE_LA_JAC"; 

let listaArchivosTemporales = [];

const inputFile = document.getElementById("evidencias");
const contenedorVistaPrevia = document.getElementById("vistaPreviaArchivos");
const pqrsForm = document.getElementById("pqrsForm");

if (inputFile) {
  inputFile.addEventListener("change", (e) => {
    const archivosSeleccionados = Array.from(e.target.files);
    
    archivosSeleccionados.forEach(archivo => {
      const yaExiste = listaArchivosTemporales.some(f => f.name === archivo.name && f.size === archivo.size);
      if (!yaExiste) {
        listaArchivosTemporales.push(archivo);
      }
    });

    inputFile.value = "";
    actualizarVistaPrevia();
  });
}

function actualizarVistaPrevia() {
  if (!contenedorVistaPrevia) return;
  contenedorVistaPrevia.innerHTML = "";

  if (listaArchivosTemporales.length === 0) {
    contenedorVistaPrevia.innerHTML = `<p class="text-muted small m-0" style="color: #666; font-style: italic;">Ningún archivo seleccionado aún.</p>`;
    return;
  }

  listaArchivosTemporales.forEach((archivo, indice) => {
    // Detectar tipo para poner un emoji descriptivo
    let icono = "📄"; 
    if (archivo.type.startsWith("image/")) icono = "🖼️";
    if (archivo.name.endsWith(".pdf")) icono = "📕";
    if (archivo.name.endsWith(".doc") || archivo.name.endsWith(".docx")) icono = "📘";

    const item = document.createElement("div");
    item.className = "d-flex align-items-center justify-content-between p-2 mb-2 bg-light border rounded small";
    item.style.cssText = "background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;";
    item.innerHTML = `
      <div style="display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <span style="margin-right: 8px;">${icono}</span>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${archivo.name}">${archivo.name}</span>
        <span style="color: #6c757d; margin-left: 8px; font-size: 0.75rem;">(${(archivo.size / 1024).toFixed(1)} KB)</span>
      </div>
      <button type="button" style="background: none; border: none; color: #dc3545; font-weight: bold; cursor: pointer; padding: 0 5px;" onclick="window.eliminarArchivoTemporal(${indice})">
        ✕
      </button>
    `;
    contenedorVistaPrevia.appendChild(item);
  });
}

window.eliminarArchivoTemporal = (indiceAEliminar) => {
  listaArchivosTemporales.splice(indiceAEliminar, 1);
  actualizarVistaPrevia();
};

if (pqrsForm) {
  pqrsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById("submit-btn");
    const textoOriginal = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subiendo archivos y enviando...";

      const evidenciasUrls = [];

      // Procesar la lista de archivos mixta (Imágenes y Documentos)
      for (const archivo of listaArchivosTemporales) {
        
        if (archivo.type.startsWith("image/")) {
          // RUTA A: Es una imagen -> Va para ImgBB
          const formData = new FormData();
          formData.append("image", archivo);

          const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
          });

          const resultadoJson = await respuesta.json();
          if (resultadoJson.success) {
            evidenciasUrls.push({
              nombre: archivo.name,
              tipo: "imagen",
              url: resultadoJson.data.url
            });
          }
        } else {
          // RUTA B: Es un documento (PDF/Word) -> Va para Firebase Storage
          // Creamos una ruta única usando la fecha para evitar que se sobrescriban archivos con el mismo nombre
          const nombreUnico = `${Date.now()}_${archivo.name}`;
          const storageRef = ref(storage, `pqrsf_documentos/${nombreUnico}`);
          
          // Subir el archivo en bytes
          await uploadBytes(storageRef, archivo);
          // Obtener la URL de descarga pública de Firebase
          const urlDescarga = await getDownloadURL(storageRef);

          evidenciasUrls.push({
            nombre: archivo.name,
            tipo: "documento",
            url: urlDescarga
          });
        }
      }

      // Guardar en Firestore con las URLs correctas de ambas fuentes
      await addDoc(collection(db, "pqrsf"), {
        nombre: document.getElementById("nombre").value.trim(),
        tipoDocumento: document.getElementById("tipoDocumento").value,
        documento: document.getElementById("documento").value.trim(),
        tipoPersona: document.getElementById("tipoPersona").value,
        correo: document.getElementById("correo").value.trim(),
        direccion: document.getElementById("direccion").value.trim() || "No aplica",
        direccionHecho: document.getElementById("direccionHecho").value.trim() || "No aplica",
        tipo: document.getElementById("tipoPqrs").value,
        descripcion: document.getElementById("descripcion").value.trim(),
        estado: "Pendiente",
        fecha: new Date().toISOString(),
        evidencias: evidenciasUrls
      });

      alert("¡Su PQRSF ha sido enviada con éxito a la JAC!");
      pqrsForm.reset();
      listaArchivosTemporales = [];
      actualizarVistaPrevia();

    } catch (error) {
      console.error("Error al procesar la PQRSF:", error);
      alert("Hubo un error al enviar la solicitud. Por favor intente de nuevo.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}