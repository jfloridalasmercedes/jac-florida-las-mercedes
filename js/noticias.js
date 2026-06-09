import { db } from "./firebase/firestore.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const newsContainer = document.getElementById("newsContainer");

// Función para transformar el string de fecha ISO en una versión legible
function formatearFecha(fechaString) {
  if (!fechaString) return "Reciente";
  try {
    const fecha = new Date(fechaString);
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
  } catch (e) {
    return "Reciente";
  }
}

async function cargarNoticias() {
  if (!newsContainer) return;

  try {
    const q = query(
      collection(db, "noticias"),
      orderBy("fecha", "desc")
    );

    const snapshot = await getDocs(q);

    // !!! BORRA LOS SKELETONS AL LLEGAR LOS DATOS !!!
    newsContainer.innerHTML = "";

    if (snapshot.empty) {
      newsContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #666;'>No hay noticias publicadas en este momento.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const noticia = doc.data();
      const fechaFormateada = formatearFecha(noticia.fecha);
      const extractoContenido = noticia.contenido ? noticia.contenido.substring(0, 120) : "Sin descripción";

      newsContainer.innerHTML += `
        <article class="news-card">
          <img
            src="${noticia.imagen || 'https://placehold.co/600x400?text=Noticia+Sin+Imagen'}"
            alt="${noticia.titulo}"
            onerror="this.src='https://placehold.co/600x400?text=Error+al+cargar+imagen'"
          />
          <div class="news-content">
            <span class="news-date">
              ${fechaFormateada}
            </span>
            <h3>
              ${noticia.titulo}
            </h3>
            <p>
              ${extractoContenido}...
            </p>
            <a href="./noticia-detalle.html?id=${doc.id}">
              Leer más
            </a>
          </div>
        </article>
      `;
    });

  } catch(error) {
    console.error("Error al cargar noticias de la BD:", error);
    newsContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Ocurrió un error al cargar la información.</p>";
  }
}

// Ejecución automática
cargarNoticias();