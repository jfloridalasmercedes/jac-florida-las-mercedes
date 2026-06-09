// 🔗 IMPORTACIONES DE TU CARPETA JS/FIREBASE
import { db } from "./firebase/firestore.js";
import { storage } from "./firebase/store.js"; // Si tu archivo se llama storaje.js cámbialo aquí a ./firebase/storaje.js
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

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
      
      // Tomamos exclusivamente los archivos que caben en la ranura libre
      const archivosPermitidos = archivosSeleccionados.slice(0, espaciosDisponibles);
      
      archivosPermitidos.forEach(archivo => {
        const yaExiste = listaArchivosTemporales.some(f => f.name === archivo.name && f.size === archivo.size);
        if (!yaExiste) {
          listaArchivosTemporales.push(archivo);
        }
      });
    } else {
      // Si la cantidad cargada cabe perfectamente sin sobrepasar los 3 cupos
      archivosSeleccionados.forEach(archivo => {
        const yaExiste = listaArchivosTemporales.some(f => f.name === archivo.name && f.size === archivo.size);
        if (!yaExiste) {
          listaArchivosTemporales.push(archivo);
        }
      });
    }

    // CONTROL: Vaciamos el input nativo del navegador inmediatamente.
    // Esto borra los molestos textos por defecto ("4 archivos") de la barra gris,
    // previniendo la sobreescritura nativa y permitiendo clics sucesivos.
    inputFile.value = "";
    
    // Ejecutamos la actualización de la lista en pantalla
    actualizarVistaPrevia();
  });
}

function actualizarVistaPrevia() {
  if (!contenedorVistaPrevia) return;
  contenedorVistaPrevia.innerHTML = "";

  // Si nuestro array de memoria está en cero, restauramos el texto plano inicial
  if (listaArchivosTemporales.length === 0) {
    contenedorVistaPrevia.innerHTML = `<p class="text-muted small m-0" style="color: #666; font-style: italic;">Ningún archivo seleccionado aún.</p>`;
    return;
  }

  // Iteramos sobre nuestro arreglo limpio para construir las filas interactivas
  listaArchivosTemporales.forEach((archivo, indice) => {
    let icono = "📄"; 
    if (archivo.type.startsWith("image/")) icono = "🖼️";
    if (archivo.name.toLowerCase().endsWith(".pdf")) icono = "📕";
    if (archivo.name.toLowerCase().endsWith(".doc") || archivo.name.toLowerCase().endsWith(".docx")) icono = "📘";

    const item = document.createElement("div");
    
    // Inyección de estilos directos inline para garantizar visualización en cualquier navegador
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

// DELEGACIÓN DE EVENTOS PARA EL BORRADO INDIVIDUAL (Funciona al 100% en módulos)
if (contenedorVistaPrevia) {
  contenedorVistaPrevia.addEventListener("click", (e) => {
    const boton = e.target.closest(".btn-borrar-evidencia");
    if (boton) {
      const indiceAEliminar = parseInt(boton.getAttribute("data-index"), 10);
      
      // Removemos el archivo exacto de la lista en memoria
      listaArchivosTemporales.splice(indiceAEliminar, 1);
      
      // Redibujamos la interfaz liberando el cupo correspondiente
      actualizarVistaPrevia();
    }
  });
}

// ACCIÓN DE ENVÍO Y ALMACENAMIENTO MULTI-DESTINO
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
          // Ruta de Carga A: Fotos van para ImgBB
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
          // Ruta de Carga B: Documentos (PDF, Word) van para Firebase Storage
          const nombreUnico = `${Date.now()}_${archivo.name}`;
          const storageRef = ref(storage, `pqrsf_documentos/${nombreUnico}`);
          
          await uploadBytes(storageRef, archivo); // Arreglado: pasamos 'archivo' como blob binario
          const urlDescarga = await getDownloadURL(storageRef);

          evidenciasUrls.push({
            nombre: archivo.name,
            tipo: "documento",
            url: urlDescarga
          });
        }
      }

      // Consolidación y subida final estructurada a Cloud Firestore
      await addDoc(collection(db, "pqrsf"), {
        nombre: document.getElementById("nombre").value.trim(),
        tipoDocumento: document.getElementById("tipo-documento").value, 
        documento: document.getElementById("documento").value.trim(),
        tipoPersona: document.getElementById("tipo-persona").value, 
        correo: document.getElementById("correo").value.trim(),
        direccion: document.getElementById("direccion").value.trim() || "No aplica",
        direccionHecho: document.getElementById("direccion-hecho").value.trim() || "No aplica", 
        tipo: document.getElementById("tipo").value, 
        descripcion: document.getElementById("descripcion").value.trim(),
        estado: "Pendiente",
        fecha: new Date().toISOString(),
        evidencias: evidenciasUrls
      });

      alert("¡Su PQRSF ha sido enviada con éxito a la JAC!");
      
      // Reseteo absoluto de la app
      pqrsForm.reset();
      listaArchivosTemporales = [];
      actualizarVistaPrevia();

    } catch (error) {
      console.error("Error crítico al procesar la PQRSF:", error);
      alert("Hubo un error al enviar la solicitud. Por favor intente de nuevo.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}