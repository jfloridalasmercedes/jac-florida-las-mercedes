import { db } from "./firebase/firestore.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Función para formatear fechas ISO de forma humana y limpia
function formatearFechaCompleta(fechaString) {
  if (!fechaString) return "Fecha no disponible";
  try {
    const fecha = new Date(fechaString);
    
    // Configuración para el idioma español
    const opciones = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return fecha.toLocaleDateString('es-ES', opciones);
  } catch (e) {
    return "Fecha reciente";
  }
}

async function cargarNoticia() {
  if (!id) return;

  try {
    const noticiaRef = doc(db, "noticias", id);
    const noticiaSnap = await getDoc(noticiaRef);

    if (!noticiaSnap.exists()) {
      document.getElementById("article-title").textContent = "Noticia no encontrada";
      return;
    }

    const noticia = noticiaSnap.data();

    document.getElementById("article-title").textContent = noticia.titulo;
    
    // !!! AQUÍ APLICAMOS EL FORMATO LIMPIO DE FECHA Y HORA !!!
    document.getElementById("article-date").textContent = formatearFechaCompleta(noticia.fecha);

    document.getElementById("article-image").src = noticia.imagen;
    document.getElementById("article-image").alt = noticia.titulo;

    document.getElementById("article-content").innerHTML = `<p>${noticia.contenido}</p>`;

  } catch(error) {
    console.error("Error al cargar el detalle de la noticia:", error);
  }
}

cargarNoticia();