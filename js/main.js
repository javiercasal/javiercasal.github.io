// Ejecutar una vez que el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarYMostrarProductos();
});

/**
 * Carga el archivo CSV desde GitHub, lo parsea y muestra los productos
 */
async function cargarYMostrarProductos() {
    try {
        const urlCSV = 'https://raw.githubusercontent.com/dieteticaaxelyjavi/productos/main/lista.csv';
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
    const csvSeparator = ',';
    const filas = csv.split('\n').filter(fila => fila.trim() !== '');
    const encabezados = filas[0].split(csvSeparator);

    return filas.slice(1).map(fila => {
        const valores = fila.split(csvSeparator);
        const producto = {};

        encabezados.forEach((columna, i) => {
            // En los datos originales, las comas son remplazads por punto y comas al subirse a github
            producto[columna.trim()] = valores[i]?.trim().replaceAll(';', ',') || '';
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

    // Crear overlay para imágenes a pantalla completa
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.innerHTML = `
        <img src="" alt="Imagen ampliada">
        <button class="close-button" aria-label="Cerrar imagen"></button>
    `;
    document.body.appendChild(overlay);

    const closeButton = overlay.querySelector('.close-button');

    // Función para cerrar el overlay
    const cerrarOverlay = () => {
        document.body.classList.remove('overlay-active');
        overlay.classList.remove('active');
    };

    // Función para abrir el overlay
    const abrirOverlay = () => {
        document.body.classList.add('overlay-active');
        overlay.classList.add('active');
    };

    // Eventos para cerrar
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        cerrarOverlay();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { // Solo cerrar si se hace clic fuera de la imagen
            overlay.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }
    });

    // Ordenar productos: primero los con stock, luego los sin stock
    const productosOrdenados = [...productos].sort((a, b) => {
        const aSinStock = a.hay_stock && a.hay_stock.toLowerCase() === "no";
        const bSinStock = b.hay_stock && b.hay_stock.toLowerCase() === "no";

        if (aSinStock && !bSinStock) return 1;    // a va después de b
        if (!aSinStock && bSinStock) return -1;   // a va antes de b
        return 0;                                 // mantener orden original
    });

    productosOrdenados.forEach(producto => {
        const item = document.createElement('li');
        item.className = 'producto-item';

        // Añadir clase sin-stock si no hay stock
        if (producto.hay_stock && producto.hay_stock.toLowerCase() === "no") {
            item.classList.add('sin-stock');
        }

        // Imagen del producto
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'producto-thumbnail';

        const imagen = document.createElement('img');
        if (producto.imagen) {
            imagen.setAttribute('data-src', producto.imagen);
            imagen.className = 'lazy';
        } else {
            imagen.src = 'img/sin-imagen.png';
        }
        imagen.alt = producto.titulo || 'Imagen del producto';

        // Agregar evento para mostrar imagen a pantalla completa
        thumbnailDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const imgSrc = producto.imagen || 'img/sin-imagen.png';
            const overlayImg = overlay.querySelector('img');
            overlayImg.src = imgSrc;
            overlayImg.alt = producto.titulo || 'Imagen ampliada';
            overlay.classList.add('active');
        });

        thumbnailDiv.appendChild(imagen);

        const contenidoDiv = document.createElement('div');
        contenidoDiv.className = 'producto-contenido';

        // Cartel de oferta
        if (producto.es_oferta && (producto.es_oferta.toLowerCase() === 'sí' || producto.es_oferta.toLowerCase() === 'si')) {
            const ofertaLabel = document.createElement('span');
            ofertaLabel.className = 'oferta-label';
            ofertaLabel.textContent = 'OFERTA';
            thumbnailDiv.appendChild(ofertaLabel);
        }

        // Título
        const titulo = document.createElement('p');
        titulo.className = 'producto-titulo';
        titulo.textContent = producto.titulo;

        // Precio
        const precio = document.createElement('p');
        precio.className = 'producto-precio';
        precio.textContent = formatearNumero(producto.precio);

        if (producto.unidad) {
            precio.textContent += ' ' + producto.unidad;
        }

        // Descripción del producto
        const descripcion = document.createElement('p');
        descripcion.className = 'producto-descripcion';
        const textoDescripcion = document.createTextNode(producto.descripcion);
        descripcion.appendChild(textoDescripcion);
        if (textoDescripcion.textContent == '') {
            descripcion.style.display = 'none';
        }

        // Logo Sin TACC
        if (producto.tags && producto.tags.includes('sin TACC')) {
            const logo = document.createElement('img');
            logo.src = 'img/sin-tacc.png';
            logo.alt = 'Sin TACC';
            logo.title = 'Sin TACC';
            logo.className = 'logo-sin-tacc-inline';
            titulo.appendChild(logo);
        }

        // Logo orgánico
        if (producto.tags && producto.tags.includes('orgánico')) {
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

        if (producto.oferta && producto.oferta === 'sí') {
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
    let imagen = document.getElementById('no-results-image');

    if (mostrar) {
        if (!mensaje) {
            mensaje = document.createElement('li');
            mensaje.id = 'no-results-message';
            mensaje.style.textAlign = 'center';
            mensaje.style.color = '#555';
            mensaje.style.padding = '10px';
            mensaje.style.paddingBottom = '0px';
            mensaje.innerHTML = `<p>Ningún elemento coincide con la búsqueda</p>`;
            contenedor.appendChild(mensaje);
        }
        if (!imagen) {
            imagen = document.createElement('img');
            imagen.id = 'no-results-image';
            imagen.src = 'img/pava.png';
            imagen.alt = 'Nada por aquí';
            imagen.style.display = 'block';
            imagen.style.margin = '0 auto';
            imagen.style.marginTop = '-30px';
            imagen.style.width = '50vw'; // 50% del ancho de la ventana
            imagen.style.height = 'auto';
            contenedor.appendChild(imagen);
        }
    } else {
        if (mensaje) {
            mensaje.remove();
        }
        if (imagen) {
            imagen.remove();
        }
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

    // Asegurarse de que el input esté vacío al cargar la página
    inputFiltro.value = '';

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
        // Deseleccionar todos los tags
        document.querySelectorAll('.tags-container .tag:not(.toggle-tag)').forEach(tag => {
            tag.classList.remove('selected');
        });
        filtrarProductos();
        clearBtn.style.display = 'none';
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'tag toggle-tag';
    toggleBtn.textContent = '+';
    toggleBtn.id = 'toggle-tags';

});

function formatearNumero(valor) {
  const numero = parseInt(valor, 10);
  return '$' + numero.toLocaleString('es-AR');
}
