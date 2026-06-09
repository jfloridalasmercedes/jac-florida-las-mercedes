import { db } from "./firebase/firestore.js";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const newsContainer = document.getElementById("news-container");

// Función accesoria para transformar formatos ISO de fecha string a formato legible local
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

async function cargarNoticiasHome() {
  if (!newsContainer) return;

  try {
    // Consulta optimizada: Ordena por fecha descendente y limita la transferencia a 3 documentos
    const q = query(collection(db, "noticias"), orderBy("fecha", "desc"), limit(3));
    const querySnapshot = await getDocs(q);

    newsContainer.innerHTML = "";

    if (querySnapshot.empty) {
      newsContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #777;'>Próximamente se publicarán las primeras noticias del sector.</p>";
      return;
    }

    querySnapshot.forEach((documento) => {
      const noticia = documento.data();
      const idNoticia = documento.id;
      const fechaFormateada = formatearFecha(noticia.fecha);

      // Inyección de la estructura utilizando la sintaxis de clases de tu archivo CSS existente
      newsContainer.innerHTML += `
        <article class="news-card">
          <img 
            src="${noticia.imagen || 'https://placehold.co/600x400?text=Noticia+Sin+Imagen'}" 
            alt="${noticia.titulo}"
            onerror="this.src='https://placehold.co/600x400?text=Error+al+cargar+imagen'"
          />
          <div class="news-content">
            <span class="news-date">${fechaFormateada}</span>
            <h3>${noticia.titulo}</h3>
            <p>${noticia.contenido || 'Sin descripción disponible.'}</p>
            <a href="./pages/noticia-detalle.html?id=${idNoticia}">
              <button>Leer más</button>
            </a>
          </div>
        </article>
      `;
    });

  } catch (error) {
    console.error("Error al obtener las noticias de la página de inicio:", error);
    newsContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Ocurrió un error al sincronizar las novedades comunales.</p>";
  }
}

// Inicialización automática al cargar el módulo
cargarNoticiasHome();