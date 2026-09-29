// Configuración web de Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyBrXWo276aRBXewRm90_H07_cpTa7Rldn0",
  authDomain: "panel-ejecutivo-b2cfb.firebaseapp.com",
  databaseURL: "https://panel-ejecutivo-b2cfb-default-rtdb.firebaseio.com",
  projectId: "panel-ejecutivo-b2cfb",
  storageBucket: "panel-ejecutivo-b2cfb.firebasestorage.app",
  messagingSenderId: "684178249972",
  appId: "1:684178249972:web:b907a71f0bba2b358ba6a1"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Referencia a la Base de Datos
const db = firebase.database();

/**
 * Escucha cambios en tiempo real desde la nube
 */
function escucharPolizasEnTiempoReal() {
  db.ref("polizas").on("value", (snapshot) => {
    const datos = snapshot.val();
    if (typeof polizas !== "undefined") {
      polizas = []; // Limpia el arreglo global en memoria si existe
    }

    if (datos && typeof polizas !== "undefined") {
      // Mapea los objetos guardados en Firebase hacia el arreglo local
      Object.keys(datos).forEach((id) => {
        polizas.push({ firebaseId: id, ...datos[id] });
      });
    }

    // Actualiza el panel y gráficos si las funciones existen
    if (typeof renderizarResumenGeneral === "function") {
      renderizarResumenGeneral();
    }
    if (typeof renderizarGraficoMovimiento === "function") {
      renderizarGraficoMovimiento();
    }
  }, (error) => {
    console.error("Error al sincronizar con Firebase:", error);
  });
}

// Variable global o referencia al modal de login
const loginModal = document.getElementById('loginModal');
const loginError = document.getElementById('loginError');

// Configurar Firebase para que NO recuerde la sesión tras recargar la página
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
  .then(() => {
    // Escuchar el estado de autenticación
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("Acceso concedido para:", user.email);

        // Ocultamos el modal y mostramos el contenido del dashboard
        if (loginModal) loginModal.style.display = 'none';

        // Inicio delectura en tiempo real (ya se esta autenticado)
        escucharPolizasEnTiempoReal();

        // Cargar pólizas desde la base de datos
        if (typeof cargarPolizasGuardadas === 'function') {
          try {
            cargarPolizasGuardadas();
          } catch (e) {
            console.warn("Aviso al ejecutar cargarPolizasGuardadas:", e);
          }
        }
      } else {
        console.log("Esperando inicio de sesión...");

        // Detener escuchadores si el usuario cierra sesión
        db.ref("polizas").off();

        // Aseguramos que el modal esté visible
        if (loginModal) loginModal.style.display = 'flex';
      }
    });
  })
  .catch((error) => {
    console.error("Error al configurar la persistencia:", error.message);
  });

// Función para ejecutar el Login desde el formulario
function ejecutarLogin() {
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    if (loginError) {
      loginError.textContent = "Por favor, ingresa tu correo y contraseña.";
      loginError.style.display = 'block';
    }
    return;
  }

  const btn = document.getElementById('btnLoginSubmit');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Verificando...";
  }
  if (loginError) loginError.style.display = 'none';

  // Autenticar con Firebase
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Ingresar";
      }
      // Limpiar los campos del formulario
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    })

    .catch((error) => {
      console.error("Error al iniciar sesión:", error);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Ingresar";
      }
      if (loginError) {
        loginError.textContent = "Correo o contraseña incorrectos.";
        loginError.style.display = 'block';
      }
    });
  }
  
