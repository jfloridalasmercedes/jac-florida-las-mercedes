// 🔗 IMPORTACIONES ÚNICAS DE CLOUD FIRESTORE
import { db } from "./firebase/firestore.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const IMGBB_API_KEY = "7ca695ddde491f82c8ce1d020d47feb1"; 

// Arreglo maestro en memoria que acumula los archivos reales de forma dinámica
let listaArchivosTemporales = [];

const inputFile = document.getElementById("evidencias");
const contenedorVistaPrevia = document.getElementById("vistaPreviaArchivos");
const pqrsForm = document.getElementById("pqrs-form"); 

if (inputFile) {
  inputFile.addEventListener("change", (e) => {
    const archivosSeleccionados = Array.from(e.target.files);
    
    // Calculamos los espacios disponibles del tope estricto de 3
    const espaciosDisponibles = 3 - listaArchivosTemporales.length;

    if (archivosSeleccionados.length > espaciosDisponibles) {
      alert("⚠️ Solo se permiten un máximo de 3 archivos de evidencia por solicitud.");
      
      const archivosPermitidos = archivosSeleccionados.slice(0, espaciosDisponibles);
      archivosPermitidos.forEach(archivo => {
        const yaExiste = listaArchivosTemporales.some(f => f.name === archivo.name && f.size === archivo.size);
        if (!yaExiste) {
          listaArchivosTemporales.push(archivo);
        }
      });
    } else {
      archivosSeleccionados.forEach(archivo => {
        const yaExiste = listaArchivosTemporales.some(f => f.name === archivo.name && f.size === archivo.size);
        if (!yaExiste) {
          listaArchivosTemporales.push(archivo);
        }
      });
    }

    // CONTROL: Vaciamos el input nativo del navegador inmediatamente para evitar repeticiones.
    inputFile.value = "";
    
    // Actualizamos la interfaz
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
    let icono = "📄"; 
    if (archivo.type.startsWith("image/")) icono = "🖼️";
    if (archivo.name.toLowerCase().endsWith(".pdf")) icono = "📕";
    if (archivo.name.toLowerCase().endsWith(".doc") || archivo.name.toLowerCase().endsWith(".docx")) icono = "📘";

    const item = document.createElement("div");
    item.style.cssText = "background: #f8f9fa; border: 1px solid #dee2e6; padding: 10px 14px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;";
    
    item.innerHTML = `
      <div style="display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
        <span style="margin-right: 10px; font-size: 1.2rem; flex-shrink: 0;">${icono}</span>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: #333;" title="${archivo.name}">${archivo.name}</span>
        <span style="color: #6c757d; margin-left: 8px; font-size: 0.75rem; flex-shrink: 0;">(${(archivo.size / 1024).toFixed(1)} KB)</span>
      </div>
      <button type="button" class="btn-borrar-evidencia" data-index="${indice}" style="background: #dc3545; border: none; color: white; font-weight: bold; cursor: pointer; padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; line-height: 1; display: flex; align-items: center; justify-content: center; min-width: 30px; height: 28px;">
        ✕
      </button>
    `;
    contenedorVistaPrevia.appendChild(item);
  });
}

// DELEGACIÓN DE EVENTOS PARA EL BORRADO INDIVIDUAL
if (contenedorVistaPrevia) {
  contenedorVistaPrevia.addEventListener("click", (e) => {
    const boton = e.target.closest(".btn-borrar-evidencia");
    if (boton) {
      const indiceAEliminar = parseInt(boton.getAttribute("data-index"), 10);
      listaArchivosTemporales.splice(indiceAEliminar, 1);
      actualizarVistaPrevia();
    }
  });
}

// 🛠️ FUNCIÓN AUXILIAR PARA CONVERTIR DOCUMENTOS A BASE64 (Mete el archivo en Firestore gratis)
const transformarABase64 = (archivo) => new Promise((resolve, reject) => {
  const lector = new FileReader();
  lector.readAsDataURL(archivo);
  lector.onload = () => resolve(lector.result);
  lector.onerror = (error) => reject(error);
});

// ACCIÓN DE ENVÍO Y ALMACENAMIENTO (IMGBB + BASE64 FIRESTORE)
if (pqrsForm) {
  pqrsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById("submit-btn");
    const textoOriginal = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subiendo archivos y enviando...";

      const evidenciasUrls = [];

      for (const archivo of listaArchivosTemporales) {
        if (archivo.type.startsWith("image/")) {
          // Si es foto, va para ImgBB de una
          const formData = new FormData();
          formData.append("image", archivo);

          const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
          });

          if (!respuesta.ok) {
            throw new Error(`Error en ImgBB (${respuesta.status})`);
          }

          const resultadoJson = await respuesta.json();
          if (resultadoJson.success) {
            evidenciasUrls.push({
              nombre: archivo.name,
              tipo: "imagen",
              url: resultadoJson.data.url
            });
          }
        } else {
          // Si es PDF o Word, se convierte a texto Base64 y se guarda directo en Firestore sin pagar nada
          const stringBase64 = await transformarABase64(archivo);
          evidenciasUrls.push({
            nombre: archivo.name,
            tipo: "documento_base64",
            url: stringBase64 // El texto largo que representa tu PDF
          });
        }
      }

      // Obtención segura de campos
      const nombreVal = document.getElementById("nombre")?.value.trim() || "";
      const tipoDocVal = document.getElementById("tipo-documento")?.value || "";
      const docVal = document.getElementById("documento")?.value.trim() || "";
      const tipoPersVal = document.getElementById("tipo-persona")?.value || "";
      const correoVal = document.getElementById("correo")?.value.trim() || "";
      const direccionVal = document.getElementById("direccion")?.value.trim() || "No aplica";
      const direccionHechoVal = document.getElementById("direccion-hecho")?.value.trim() || "No aplica";
      const tipoVal = document.getElementById("tipo")?.value || "";
      const descVal = document.getElementById("descripcion")?.value.trim() || "";

      // Consolidación final en Firestore Database
      await addDoc(collection(db, "pqrsf"), {
        nombre: nombreVal,
        tipoDocumento: tipoDocVal, 
        documento: docVal,
        tipoPersona: tipoPersVal, 
        correo: correoVal,
        direccion: direccionVal,
        direccionHecho: direccionHechoVal, 
        tipo: tipoVal, 
        descripcion: descVal,
        estado: "Pendiente",
        fecha: new Date().toISOString(),
        evidencias: evidenciasUrls
      });

      alert("¡Su PQRSF ha sido enviada con éxito a la JAC!");
      
      pqrsForm.reset();
      listaArchivosTemporales = [];
      actualizarVistaPrevia();

    } catch (error) {
      console.error("Error crítico al procesar la PQRSF:", error);
      alert(`No se pudo enviar la solicitud: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}