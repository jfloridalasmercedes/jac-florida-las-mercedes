// ==========================================
// 1. IMPORTACIONES DE CONFIGURACIÓN
// ==========================================
import { db } from "./firebase/firestore.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Elementos del DOM
const galeriaPublica = document.getElementById("galeria-publica");
const featuredSlider = document.getElementById("featured-slider");

// Variable global para controlar el intervalo del auto-slide
let autoSlideInterval = null;

// ==========================================
// 2. FUNCIÓN PRINCIPAL DE CARGA (FIRESTORE)
// ==========================================
async function renderGaleria() {
  if (!galeriaPublica) {
    console.error("No se encontró el contenedor #galeria-publica en el HTML.");
    return;
  }

  try {
    const q = query(collection(db, "galeria"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    // !!! LIMPIAMOS LOS SKELETONS JUSTO AQUÍ !!!
    galeriaPublica.innerHTML = "";
    if (featuredSlider) {
      featuredSlider.innerHTML = "";
    }

    if (querySnapshot.empty) {
      galeriaPublica.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #666;'>Aún no hay fotos registradas en la galería.</p>";
      if (featuredSlider) {
        featuredSlider.innerHTML = "<p style='text-align: center; padding: 20px; color:#666;'>Sin imágenes destacadas</p>";
      }
      return;
    }

    let contadorCarrusel = 0;

    querySnapshot.forEach((documento) => {
      const data = documento.data();

      // --- A. CARGA EN EL CARRUSEL (CORRECCIÓN: Ahora hasta 5 imágenes más recientes) ---
      if (featuredSlider && contadorCarrusel < 5) {
        const sliderImg = document.createElement("img");
        sliderImg.src = data.imagen;
        sliderImg.alt = data.titulo;
        sliderImg.style.cursor = "pointer";
        sliderImg.onerror = () => { sliderImg.src = 'https://placehold.co/600x400?text=Error+al+cargar'; };
        sliderImg.addEventListener("click", () => abrirLightbox(data.imagen, data.titulo));
        featuredSlider.appendChild(sliderImg);
        contadorCarrusel++;
      }

      // --- B. CARGA EN LA GRILLA PÚBLICA (Todas las fotos ordenadas) ---
      const article = document.createElement("article");
      article.className = "gallery-card";
      article.style.cursor = "pointer";

      article.innerHTML = `
        <img src="${data.imagen}" alt="${data.titulo}" loading="lazy" onerror="this.src='https://placehold.co/400x300?text=Imagen+No+Disponible'">
        <div class="gallery-card-content">
          <h3>${data.titulo}</h3>
          <p>${data.descripcion || "Registro fotográfico de actividades comunales."}</p>
          <span>Ver en grande</span>
        </div>
      `;

      article.addEventListener("click", () => abrirLightbox(data.imagen, data.titulo));
      galeriaPublica.appendChild(article);
    });

    inicializarSlider();

  } catch (error) {
    console.error("Error crítico al renderizar la galería:", error);
    galeriaPublica.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Error de conexión al cargar las imágenes.</p>";
  }
}

// ==========================================
// 3. LÓGICA DEL SLIDER (BOTONES Y AUTO-SLIDE RESPONSIVE)
// ==========================================
function inicializarSlider() {
  const slider = document.querySelector(".featured-slider");
  const nextBtn = document.querySelector(".next");
  const prevBtn = document.querySelector(".prev");

  if (!slider || !nextBtn || !prevBtn) return;

  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
  }

  // Desplazamiento responsive hacia adelante
  nextBtn.onclick = () => {
    const scrollAmount = slider.clientWidth; // Toma dinámicamente el ancho visible actual del slider
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    
    if (slider.scrollLeft >= maxScroll - 15) {
      slider.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Desplazamiento responsive hacia atrás
  prevBtn.onclick = () => {
    const scrollAmount = slider.clientWidth; 
    
    if (slider.scrollLeft <= 15) {
      slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  function ejecutarAutoSlide() {
    const scrollAmount = slider.clientWidth;
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    
    if (slider.scrollLeft >= maxScroll - 15) {
      slider.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }

  // Avanza automáticamente cada 5 segundos de forma perfecta e individual
  autoSlideInterval = setInterval(ejecutarAutoSlide, 5000);
}

// ==========================================
// 4. LÓGICA DEL LIGHTBOX (MODAL ZOOM)
// ==========================================
function abrirLightbox(url, titulo) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");

  if (lightbox && lightboxImg && lightboxCaption) {
    lightboxImg.src = url;
    lightboxCaption.textContent = titulo;
    lightbox.classList.add("active");
  }
}

window.cerrarLightbox = function() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.classList.remove("active");
  }
};

// ==========================================
// 5. INICIALIZACIÓN
// ==========================================
renderGaleria();