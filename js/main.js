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

        // Miniatura
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'producto-thumbnail';

        const imagen = document.createElement('img');
        imagen.setAttribute('data-src', producto.imagen);
        imagen.alt = 'Miniatura';
        imagen.className = 'lazy';

        thumbnailDiv.appendChild(imagen);

        // Contenido
        const contenidoDiv = document.createElement('div');
        contenidoDiv.className = 'producto-contenido';

        // Cartel "¡Oferta!" si el precio incluye "$1500"
        if (producto.precio.includes('$1500')) {
            const ofertaLabel = document.createElement('span');
            ofertaLabel.className = 'oferta-label';
            ofertaLabel.textContent = '¡Oferta!';
            contenidoDiv.appendChild(ofertaLabel); // Aparece al principio
        }

        const titulo = document.createElement('p');
        titulo.className = 'producto-titulo';
        titulo.textContent = producto.titulo;

        const precio = document.createElement('p');
        precio.className = 'producto-precio';
        precio.textContent = producto.precio;

        const descripcion = document.createElement('p');
        descripcion.className = 'producto-descripcion';
        descripcion.textContent = producto.descripcion;

        contenidoDiv.appendChild(titulo);
        contenidoDiv.appendChild(precio);
        contenidoDiv.appendChild(descripcion);

        // Ensamblar todo
        item.appendChild(thumbnailDiv);
        item.appendChild(contenidoDiv);

        item.addEventListener('click', () => {
            item.classList.toggle('expandido');
        });

        contenedor.appendChild(item);

        requestAnimationFrame(() => {
            const contenido = item.querySelector('.producto-contenido');
            const thumbnail = item.querySelector('.producto-thumbnail');

            if (contenido.scrollHeight > thumbnail.offsetHeight) {
                item.classList.add('con-desborde');
            }
        });
    });
}

/**
 * Filtra los productos por texto ingresado en el input
 */
function filtrarProductos() {
    const texto = normalizar(document.getElementById('filter-input').value);
    const productos = document.querySelectorAll('.producto-item');
    let hayCoincidencias = false;

    productos.forEach(item => {
        const titulo = normalizar(item.querySelector('.producto-titulo').textContent);
        const descripcion = normalizar(item.querySelector('.producto-descripcion').textContent);

        const visible = titulo.includes(texto) || descripcion.includes(texto);
        item.style.display = visible ? '' : 'none';

        if (visible) hayCoincidencias = true;
    });

    mostrarMensajeSinResultados(!hayCoincidencias);
}

/**
 * Procesa los textos para hacer comparaciones más inclusivas,
 * especialmente cuando se trata de acentos, diéresis, tildes, eñes, etc.
 * @param {string} str
 */
function normalizar(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
