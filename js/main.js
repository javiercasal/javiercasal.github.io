// Ejecutar una vez que el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarYMostrarProductos();
});

/**
 * Carga el archivo CSV desde GitHub, lo parsea y muestra los productos
 */
async function cargarYMostrarProductos() {
    try {
        const urlCSV = 'https://raw.githubusercontent.com/dieteticaaxelyjavi/productos/refs/heads/main/lista.csv';
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

        // Imagen del producto
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'producto-thumbnail';

        const imagen = document.createElement('img');
        imagen.setAttribute('data-src', producto.imagen);
        imagen.alt = 'Imagen del producto';
        imagen.className = 'lazy';

        thumbnailDiv.appendChild(imagen);

        const contenidoDiv = document.createElement('div');
        contenidoDiv.className = 'producto-contenido';

        // Cartel de oferta
        if (producto.oferta === 'sí') {
            const ofertaLabel = document.createElement('span');
            ofertaLabel.className = 'oferta-label';
            ofertaLabel.textContent = 'OFERTA';
            contenidoDiv.appendChild(ofertaLabel);
        }

        // Título
        const titulo = document.createElement('p');
        titulo.className = 'producto-titulo';
        titulo.textContent = producto.titulo;

        // Precio
        const precio = document.createElement('p');
        precio.className = 'producto-precio';
        precio.textContent = producto.precio;

        // Unidad de venta
        const unidad = document.createElement('span');
        unidad.className = 'producto-unidad';
        unidad.textContent = producto.unidad || '';
        precio.appendChild(unidad);

        // Descripción del producto
        const descripcion = document.createElement('p');
        descripcion.className = 'producto-descripcion';
        const textoDescripcion = document.createTextNode(producto.descripcion);
        descripcion.appendChild(textoDescripcion);
        if (textoDescripcion.textContent == '') {
            descripcion.style.display = 'none';
        }

        // Logo Sin TACC
        if (producto.tags.includes('sin TACC')) {
            const logo = document.createElement('img');
            logo.src = 'img/sin-tacc.png';
            logo.alt = 'Sin TACC';
            logo.title = 'Sin TACC';
            logo.className = 'logo-sin-tacc-inline';
            titulo.appendChild(logo);
        }

        // Logo orgánico
        if (producto.tags.includes('orgánico')) {
            const logo = document.createElement('img');
            logo.src = 'img/organico.png';
            logo.alt = 'Orgánico';
            logo.title = 'Orgánico';
            logo.className = 'logo-organico-inline';
            titulo.appendChild(logo);
        }

        // Tags (no visibles)
        const tags = document.createElement('p');
        tags.className = 'producto-tags';
        tags.textContent = producto.tags || '';

        if (producto.oferta === 'sí') {
            tags.textContent = tags.textContent + '|ofertas'
        }

        contenidoDiv.appendChild(titulo);
        contenidoDiv.appendChild(descripcion);
        contenidoDiv.appendChild(precio);
        contenidoDiv.appendChild(tags);

        // Ensamblar la imagen y el contenido
        item.appendChild(thumbnailDiv);
        item.appendChild(contenidoDiv);

        contenedor.appendChild(item);
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
        const tags = normalizar(item.querySelector('.producto-tags').textContent);

        const visible = titulo.includes(texto) || descripcion.includes(texto) || tags.includes(texto);
        item.style.display = visible ? '' : 'none';

        if (visible) hayCoincidencias = true;
    });

    mostrarMensajeSinResultados(!hayCoincidencias);

    const clearBtn = document.getElementById('clear-filter');
    clearBtn.style.display = document.getElementById('filter-input').value ? 'block' : 'none';
}

/**
 * Procesa los textos para hacer comparaciones más inclusivas,
 * especialmente cuando se trata de acentos, diéresis, tildes, eñes, etc.
 * @param {string} str
 */
function normalizar(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]|🫘/g, '')
    .toLowerCase();
}

/**
 * Muestra u oculta el mensaje de 'sin resultados'
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

            mensaje.innerHTML = `<p>Ningún elemento coincide con la búsqueda</p>`;

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

// Asignar eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const inputFiltro = document.getElementById('filter-input');

    // Crear botón de borrar dentro del input-wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.style.position = 'relative';
    inputWrapper.style.display = 'flex';
    inputWrapper.style.alignItems = 'center';

    inputFiltro.parentNode.insertBefore(inputWrapper, inputFiltro);
    inputWrapper.appendChild(inputFiltro);

    const clearBtn = document.createElement('span');
    clearBtn.id = 'clear-filter';
    clearBtn.innerHTML = '&times;';
    clearBtn.title = 'Borrar búsqueda';
    clearBtn.style.position = 'absolute';
    clearBtn.style.right = '10px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.fontSize = '1.2em';
    clearBtn.style.color = '#777';
    clearBtn.style.display = 'none';

    inputWrapper.appendChild(clearBtn);

    inputFiltro.addEventListener('input', () => {
        filtrarProductos();
        clearBtn.style.display = inputFiltro.value ? 'block' : 'none';
    });

    clearBtn.addEventListener('click', () => {
        inputFiltro.value = '';
        filtrarProductos();
        clearBtn.style.display = 'none';
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'tag toggle-tag';
    toggleBtn.textContent = '+';
    toggleBtn.id = 'toggle-tags';

    const tagsContainer = document.querySelector('.tags-container');
    const allTags = Array.from(tagsContainer.querySelectorAll('.tag'));

    if (!document.getElementById('toggle-tags')) {
        tagsContainer.appendChild(toggleBtn);
    }

    const visibles = allTags.slice(0, 7);
    const ocultos = allTags.slice(4);

    ocultos.forEach(tag => tag.style.display = 'none');

    toggleBtn.addEventListener('click', () => {
        const ocultosVisibles = ocultos[0].style.display === 'none';
        ocultos.forEach(tag => tag.style.display = ocultosVisibles ? 'inline-block' : 'none');
        toggleBtn.textContent = ocultosVisibles ? '-' : '+';
    });

    allTags.forEach(tag => {
        if (tag.id !== 'toggle-tags') {
            tag.addEventListener('click', () => {
                if (inputFiltro.value === tag.textContent) {
                    inputFiltro.value = ''
                } else {
                    inputFiltro.value = tag.textContent;
                }
                filtrarProductos();

                if (ocultos[0].style.display !== 'none') {
                    const ocultosVisibles = ocultos[0].style.display === 'none';
                    ocultos.forEach(tag => tag.style.display = ocultosVisibles ? 'inline-block' : 'none');
                    toggleBtn.textContent = ocultosVisibles ? '-' : '+';
                }

            });
        }
    });
});
