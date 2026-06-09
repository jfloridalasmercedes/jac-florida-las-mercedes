// ==========================================
// 1. TODOS LOS IMPORTS (Siempre agrupados arriba)
// ==========================================
import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Función auxiliar para formatear la fecha de las PQRSF en el Admin
function formatearFechaAdmin(fechaString) {
  if (!fechaString) return "No registrada";
  try {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return "Fecha indeterminada";
  }
}

// ==========================================
// 2. CONTROL DE ACCESO (PROTECCIÓN DE RUTA)
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./login.html";
  }
});

// ==========================================
// 3. LOGOUT (CERRAR SESIÓN)
// ==========================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./login.html";
  });
}

// ==========================================
// 4. SECCIÓN: NOTICIAS (CRUD)
// ==========================================
const newsForm = document.getElementById("newsForm");
if (newsForm) {
  newsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "noticias"), {
        titulo: document.getElementById("titulo").value,
        imagen: document.getElementById("imagen").value,
        contenido: document.getElementById("contenido").value,
        fecha: new Date().toISOString()
      });
      alert("Noticia guardada");
      cargarNoticias();
      newsForm.reset();
    } catch (error) {
      console.error("Error al guardar noticia:", error);
      alert("Error al guardar la noticia");
    }
  });
}

const newsList = document.getElementById("newsList");
async function cargarNoticias() {
  if (!newsList) return;
  
  const q = query(collection(db, "noticias"), orderBy("fecha", "desc"));
  const querySnapshot = await getDocs(q);
  newsList.innerHTML = "";

  querySnapshot.forEach((documento) => {
    const noticia = documento.data();
    newsList.innerHTML += `
      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 10px; background: #fff;">
        <h3>${noticia.titulo}</h3>
        <button onclick="eliminarNoticia('${documento.id}')" style="background: #d72638; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
          Eliminar
        </button>
      </div>
    `;
  });
}

window.eliminarNoticia = async (id) => {
  const confirmar = confirm("¿Seguro que deseas eliminar esta noticia?");
  if (!confirmar) return;

  await deleteDoc(doc(db, "noticias", id));
  cargarNoticias();
};

// ==========================================
// 5. SECCIÓN: GALERÍA 
// ==========================================
const galeriaForm = document.getElementById("galeriaForm");
if (galeriaForm) {
  galeriaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const titulo = document.getElementById("galeriaTitulo").value;
      const descripcion = document.getElementById("galeriaDescripcion").value;
      const imagenURL = document.getElementById("galeriaImagen").value;

      await addDoc(collection(db, "galeria"), {
        titulo,
        descripcion,
        imagen: imagenURL,
        fecha: new Date().toISOString()
      });

      alert("¡Imagen añadida a la galería con éxito!");
      galeriaForm.reset();
      cargarGaleria();

    } catch (error) {
      console.error("Error al guardar en la galería:", error);
      alert("Hubo un fallo al subir la imagen");
    }
  });
}

const listaGaleria = document.getElementById("listaGaleria");
async function cargarGaleria() {
  if (!listaGaleria) return;

  listaGaleria.innerHTML = "";
  const q = query(collection(db, "galeria"), orderBy("fecha", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docu) => {
    const data = docu.data();
    listaGaleria.innerHTML += `
      <div style="border: 1px solid #ccc; padding: 10px; border-radius: 10px; text-align: center; width: 170px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <img src="${data.imagen}" style="width: 150px; height: 110px; object-fit: cover; border-radius: 5px;" onerror="this.src='https://placehold.co/150x110?text=Error+URL'">
        <p style="margin: 8px 0 2px 0; font-weight: 600; font-size: 0.9rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${data.titulo}</p>
        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #666; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${data.descripcion || ''}">${data.descripcion || 'Sin descripción'}</p>
        <button onclick="eliminarGaleria('${docu.id}')" style="background: #d72638; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
          Eliminar
        </button>
      </div>
    `;
  });
}

// ==========================================
// 6. SECCIÓN: PQRSF (ACTUALIZADA CON FECHA Y HORA)
// ==========================================
async function cargarPQRS() {
  const lista = document.getElementById("lista-pqrs");
  if (!lista) return;

  lista.innerHTML = "";
  
  // Modificado: Trae las PQRSF ordenadas por fecha si existe el índice
  const snapshot = await getDocs(collection(db, "pqrsf"));

  snapshot.forEach((item) => {
    const data = item.data();
    const id = item.id;
    const esResuelto = data.estado === "Resuelto";
    
    // !!! EXTRAE Y FORMATEA LA FECHA DE LA SOLICITUD !!!
    const fechaRecibido = formatearFechaAdmin(data.fecha);

    let bloqueEvidencias = "";
    if (data.evidencias && data.evidencias.length > 0) {
      bloqueEvidencias = `<div class="mt-3 border-top pt-2"><strong>Evidencias adjuntas:</strong><div class="d-flex flex-wrap gap-2 mt-2">`;
      
      data.evidencias.forEach((archivo, indice) => {
        if (archivo.tipo === "imagen") {
          bloqueEvidencias += `
            <a href="${archivo.url}" target="_blank" class="d-inline-block text-center border rounded p-1 text-decoration-none bg-light" style="width: 80px;">
              <img src="${archivo.url}" style="width: 100%; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://placehold.co/80x50?text=Error'">
              <span class="d-block text-truncate small text-muted px-1" style="font-size: 0.7rem;" title="${archivo.nombre}">${archivo.nombre}</span>
            </a>
          `;
        } else {
          const idBoton = `doc-${id}-${indice}`;
          bloqueEvidencias += `
            <button id="${idBoton}" class="btn btn-outline-secondary btn-sm d-flex flex-column align-items-center justify-content-center border rounded p-1 bg-light" style="width: 80px; height: 74px;">
              <span style="font-size: 1.5rem;">📄</span>
              <span class="d-block text-truncate w-100 px-1 text-muted" style="font-size: 0.7rem;" title="${archivo.nombre}">${archivo.nombre}</span>
            </button>
          `;

          setTimeout(() => {
            const boton = document.getElementById(idBoton);
            if (boton) {
              boton.addEventListener("click", () => {
                const nuevaVentana = window.open();
                if (nuevaVentana) {
                  nuevaVentana.document.write(`
                    <iframe src="${archivo.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>
                  `);
                  nuevaVentana.document.title = archivo.nombre;
                }
              });
            }
          }, 100);
        }
      });
      
      bloqueEvidencias += `</div></div>`;
    } else {
      bloqueEvidencias = `<div class="mt-3 border-top pt-2 text-muted small"><em>No se adjuntaron evidencias.</em></div>`;
    }

    const badgeColor = esResuelto ? "bg-success text-white" : "bg-warning text-dark";
    const borderCardColor = esResuelto ? "border-success" : "border-warning";

    const botonResolver = !esResuelto 
      ? `<button onclick="resolverPQRS('${id}')" class="btn btn-success btn-sm px-3 me-2">✔ Marcar como Resuelto</button>` 
      : ``;

    lista.innerHTML += `
      <div class="col-12 mb-3">
        <div class="card shadow-sm border-start ${borderCardColor} border-3">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span class="badge ${badgeColor} px-3 py-2 fw-semibold fs-6">${data.tipo || "Solicitud"}</span>
                <span class="ms-2 text-muted small">Estado: <strong class="text-uppercase">${data.estado || "Pendiente"}</strong></span>
              </div>
              <span class="text-secondary small bg-light p-2 rounded border border-light-subtle fw-medium">
                ⏱ Recibido: ${fechaRecibido}
              </span>
            </div>
            
            <div class="row g-2 text-dark" style="font-size: 0.95rem;">
              <div class="col-md-6"><strong>Nombre:</strong> ${data.nombre}</div>
              <div class="col-md-6"><strong>Documento:</strong> ${data.tipoDocumento || ""} - ${data.documento}</div>
              <div class="col-md-6"><strong>Persona:</strong> ${data.tipoPersona || "Natural"}</div>
              <div class="col-md-6"><strong>Correo:</strong> <a href="mailto:${data.correo}" class="text-decoration-none">${data.correo}</a></div>
              <div class="col-md-6"><strong>Dirección:</strong> ${data.direccion || "No aplica"}</div>
              <div class="col-md-6"><strong>Dirección hecho:</strong> ${data.direccionHecho || "No aplica"}</div>
              <div class="col-12 mt-3">
                <strong>Descripción de los hechos:</strong>
                <p class="text-muted bg-light p-3 rounded mt-1 border border-light-subtle" style="white-space: pre-wrap;">${data.descripcion}</p>
              </div>
            </div>

            ${bloqueEvidencias}
            
            <div class="text-end mt-3 border-top pt-3">
              ${botonResolver}
              <button onclick="eliminarPQRS('${item.id}')" class="btn btn-outline-danger btn-sm px-4">
                Eliminar registro
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

window.resolverPQRS = async (id) => {
  if (!confirm("¿Deseas marcar esta solicitud como RESUELTA?")) return;
  try {
    const docRef = doc(db, "pqrsf", id);
    await updateDoc(docRef, { estado: "Resuelto" });
    cargarPQRS();
  } catch (error) {
    console.error("Error al actualizar estado de la PQRSF:", error);
    alert("No se pudo actualizar el estado.");
  }
};

window.eliminarPQRS = async (id) => {
  const confirmar = confirm("¿Eliminar esta solicitud permanentemente?");
  if (!confirmar) return;

  await deleteDoc(doc(db, "pqrsf", id));
  cargarPQRS();
};

// ==========================================
// 7. INICIALIZACIÓN DE LA CARGA
// ==========================================
cargarNoticias();
cargarGaleria();
cargarPQRS();