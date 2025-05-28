// Ejecutar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarYMostrarProductos();
});

/**
 * Carga el archivo CSV desde GitHub, lo parsea y muestra los productos
 */
async function cargarYMostrarProductos() {
    try {
        const urlCSV = 'https://raw.githubusercontent.com/javiercasal/lista/refs/heads/main/libros';
        const respuesta = await fetch(urlCSV);
        const textoCSV = await respuesta.text();

        const productos = parsearCSV(textoCSV);
        mostrarProductos(productos);
        activarLazyLoad();
    } catch (error) {
        console.error('Error al cargar el archivo CSV:', error);
    }
}

/**
 * Convierte el contenido CSV en un array de objetos
 * @param {string} csv - Texto plano del archivo CSV
 * @returns {Array<Object>} - Lista de productos
 */
function parsearCSV(csv) {
    const filas = csv.split('\n').filter(fila => fila.trim() !== '');
    const encabezados = filas[0].split(',');

    return filas.slice(1).map(fila => {
        const valores = fila.split(',');
        const producto = {};

        encabezados.forEach((columna, i) => {
            producto[columna.trim()] = valores[i]?.trim() || '';
        });

        return producto;
    });
}

/**
 * Muestra la lista de productos en el HTML
 * @param {Array<Object>} productos
 */
function mostrarProductos(productos) {
    const contenedor = document.querySelector('.productos-lista');
    contenedor.innerHTML = ''; // Limpiar contenido anterior

    productos.forEach(producto => {
        const item = document.createElement('li');
        item.className = 'producto-item';

        item.innerHTML = `
            <div class="producto-thumbnail">
                <img data-src="${producto.imagen}" alt="Miniatura" class="lazy">
            </div>
            <div class="producto-contenido">
                <p class="producto-titulo">${producto.titulo}</p>
                <p class="producto-precio">${producto.precio}</p>
                <p class="producto-descripcion">${producto.descripcion}</p>
            </div>
        `;

        contenedor.appendChild(item);
    });
}

/**
 * Filtra los productos por texto ingresado en el input
 */
function filtrarProductos() {
    const texto = document.getElementById('filter-input').value.toLowerCase();
    const productos = document.querySelectorAll('.producto-item');
    let hayCoincidencias = false;

    productos.forEach(item => {
        const titulo = item.querySelector('.producto-titulo').textContent.toLowerCase();
        const descripcion = item.querySelector('.producto-descripcion').textContent.toLowerCase();

        const visible = titulo.includes(texto) || descripcion.includes(texto);
        item.style.display = visible ? '' : 'none';

        if (visible) hayCoincidencias = true;
    });

    mostrarMensajeSinResultados(!hayCoincidencias);
}

/**
 * Muestra u oculta el mensaje de "sin resultados"
 * @param {boolean} mostrar
 */
function mostrarMensajeSinResultados(mostrar) {
    const contenedor = document.querySelector('.productos-lista');
    let mensaje = document.getElementById('no-results-message');

    if (mostrar) {
        if (!mensaje) {
            mensaje = document.createElement('li');
            mensaje.id = 'no-results-message';
            mensaje.style.textAlign = 'center';
            mensaje.style.color = '#555';
            mensaje.style.padding = '10px';

            mensaje.innerHTML = `
                <p>Ningún elemento coincide con la búsqueda</p>
                <img src="img/sin-resultados.jpg" alt="Sin resultados"
                     style="margin-top:10px;max-width:200px;height:auto;">
            `;

            contenedor.appendChild(mensaje);
        }
    } else if (mensaje) {
        mensaje.remove();
    }
}

/**
 * Carga las imágenes cuando están por entrar en pantalla
 */
function activarLazyLoad() {
    const imagenes = document.querySelectorAll('img.lazy');

    const observer = new IntersectionObserver((entradas, observer) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                const img = entrada.target;
                img.src = img.getAttribute('data-src');
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    imagenes.forEach(img => observer.observe(img));
}

// Asignar la función de filtrado al input de búsqueda
document.addEventListener('DOMContentLoaded', () => {
    const inputFiltro = document.getElementById('filter-input');
    inputFiltro.addEventListener('input', filtrarProductos);
});
