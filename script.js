const formulario = document.getElementById("formulario")
const divResultado = document.getElementById("resultado")
const listaHistorial = document.getElementById("historial")

const URL_API = "https://dolarapi.com/v1/dolares/oficial"
const IMPUESTO_PAIS = 0.30
const COTIZACION_LOCAL = {
  venta: 1000,
  fuente: "Local"
}

async function obtenerCotizacion() {
  try {
    const respuesta = await fetch(URL_API)
    if (!respuesta.ok) throw new Error("Respuesta inválida de la API")
    const datos = await respuesta.json()

    localStorage.setItem("ultimaCotizacion", JSON.stringify({
      venta: datos.venta,
      timestamp: new Date().toISOString()
    }))

    return datos
  } catch (error) {
    console.warn("Error al obtener API, usando fallback:", error.message)

    const ultimaGuardada = JSON.parse(localStorage.getItem("ultimaCotizacion"))
    if (ultimaGuardada) {
      Swal.fire("Aviso", "Usando la última cotización guardada.", "info")
      return ultimaGuardada
    }

    Swal.fire("Aviso", "Usando cotización local por defecto.", "info")
    return COTIZACION_LOCAL
  }
}

function convertir(monto, tipoConversion, cotizacion) {
  let textoResultado = ""

  if (tipoConversion === "ars-usd") {
    let dolares = monto / cotizacion.venta
    textoResultado = `${monto} ARS = ${dolares.toFixed(2)} USD`
  } else if (tipoConversion === "usd-ars") {
    let pesos = monto * cotizacion.venta
    let totalConImpuesto = pesos + pesos * IMPUESTO_PAIS
    textoResultado = `${monto} USD = ${totalConImpuesto.toFixed(2)} ARS (con 30% Impuesto PAÍS)`
  }

  return textoResultado
}

function guardarEnHistorial(textoConversion) {
  let historial = JSON.parse(localStorage.getItem("historialConversiones")) || []
 
  const fecha = dayjs().format('DD/MM/YYYY HH:mm:ss');
  const registro = `${fecha} - ${textoConversion}`;

  historial.push(registro)
  localStorage.setItem("historialConversiones", JSON.stringify(historial))

  Toastify({
    text: "Conversión guardada en historial",
    duration: 2500,
    gravity: "top",
    position: "right",
    close: true
  }).showToast();
}


function mostrarHistorial() {
  let historial = JSON.parse(localStorage.getItem("historialConversiones")) || []
  listaHistorial.innerHTML = ""

  historial.slice(-5).reverse().forEach(item => {
    const elemento = document.createElement("li");
    elemento.textContent = item;
    listaHistorial.appendChild(elemento);
  });
}

formulario.addEventListener("submit", async (e) => {
  e.preventDefault()

  const monto = parseFloat(document.getElementById("monto").value)
  const tipoConversion = document.getElementById("tipo-conversion").value

  if (isNaN(monto) || monto <= 0) {
    Swal.fire("Atención", "Ingrese un monto válido.", "warning")
    return;
  }

  const cotizacion = await obtenerCotizacion();
  if (!cotizacion) return;

  const textoConversion = convertir(monto, tipoConversion, cotizacion)

  divResultado.textContent = textoConversion;
  guardarEnHistorial(textoConversion);
  mostrarHistorial();

  Swal.fire("Conversión realizada", textoConversion, "success");
})

document.addEventListener("DOMContentLoaded", mostrarHistorial);
