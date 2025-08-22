// ===== FUNCIONES DE INICIALIZACIÓN =====

// Se ejecuta una vez que el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarYMostrarProductos().then(() => {
        inicializarAutocomplete();
    });
    cargarEtiquetasDesdeCSV();
    inicializarSistemaDeFiltrado();
});

// Impide que aparezca el menú contextual (clic derecho) del navegador
document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
}, false);

// ===== FUNCIONES AUXILIARES/HELPERS =====

// Normaliza acentos, diéresis, tildes, eñes, etc. y hace trim
function normalizar(str) {
    return str
        .trim() // Elimina espacios al inicio y final
        .normalize('NFD') // Descompone los caracteres Unicode en sus componentes básicos
        .replace(/[\u0300-\u036f]/g, '') // Elimina signos diacríticos (acentos, tildes, etc.)
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]|🫘/g, '') // Elimina emojis, símbolos y caracteres especiales
        .toLowerCase();
}

// Formatear número como moneda argentina
function formatearNumero(valor) {
  const numero = parseInt(valor, 10);
  return '$' + numero.toLocaleString('es-AR');
}

// Asegurarse de que el input de búsqueda esté vacío al cargar la página
function resetInputValue(inputElement) {
    inputElement.value = '';
}

// Deseleccionar todos los tags
function deselectAllTags() {
    document.querySelectorAll('.tags-container .tag:not(.toggle-tag)').forEach(tag => {
        tag.classList.remove('selected');
    });
}

// ===== FUNCIONES PRINCIPALES =====

// Carga el archivo CSV desde GitHub, lo parsea y muestra los productos
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

function inicializarAutocomplete() {
    const inputFiltro = document.getElementById('filter-input');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'autocomplete-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // Insertar después del input wrapper
    inputFiltro.parentNode.parentNode.appendChild(suggestionsContainer);

    inputFiltro.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase();
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';

        if (value.length < 2) return; // Mostrar sugerencias solo después de 2 caracteres

        const terminosBusqueda = ['Aceite de oliva', 'Aceite de coco', 'Aceite de lino', 'Aceite de nuéz pecán', 'Aceite de sésamo', 'Ají molido', 'Ajo granulado', 'Ajo en polvo', 'Almendras', 'Ambay', 'Anis estrellado', 'Arroz yamaní', 'Arroz integral largo fino', 'Arveja seca partida', 'Avellanas', 'Avellanas con chocolate', 'Avena instantánea', 'Avena instantánea sin TACC', 'Avena arrollada', 'Azúcar mascabo', 'Barrita de cereal', 'Bicarbonato de sodio', 'Boldo', 'Bolsita para hacer leches vegetales', 'Burrito', 'Cacao amargo', 'Café de algarroba', 'Caléndula', 'Canela en polvo', 'Galletitas', 'Carqueja', 'Castañas de cajú', 'Cedrón hojas', 'Chimichurri', 'Chocolate 60%', 'Chocolate 70%', 'Chocolate 80%', 'Chocolate sin azúcar agregada', 'Coco rallado', 'Cola de caballo', 'Comino', 'Creatina', 'Cúrcuma en polvo', 'Curry de la india', 'Dátiles', 'Espirulina', 'Extracto natural de vainilla', 'Fécula de mandioca', 'Fideos de arroz', 'Tallarines integrales', 'Fideos codito con harina de garbanzos', 'Galletas de arroz', 'Garbanzos', 'Ghee', 'Harina integral', 'Harina integral orgánica', 'Harina de centeno orgánica', 'Harina de garbanzo', 'Harina de garbanzo sin TACC', 'Harina para arepas', 'Harina de almendras', 'Harina de chía', 'Harina de lino', 'Harina de arroz', 'Harina de arroz sin TACC', 'Harina de algarroba', 'Harina de coco', 'Harina integral de trigo', 'Hibiscus', 'Higos blancos', 'Hongos de pino', 'Hongos adaptógenos', 'Melena de león doble extracto', 'Reishi doble extracto', 'Cordy doble extracto', 'Shiitake doble extracto', 'Cola de pavo doble extracto', 'Huevos de gallinas felices', 'Jengibre en polvo', 'Laurel hojas', 'Lavanda flores', 'Leche de nuez pecan sin azúcar', 'Leche de almendras protéica sin azúcar', 'Leche de almendras sin azúcar', 'Lentejas', 'Nutrileva | Levadura nutricional', 'Llantén', 'Maca', 'Maicena', 'Fécula de maíz', 'Fécula de maíz sin TACC', 'Maíz piscingallo', 'Maní tostado sin sal', 'Maní tostado con sal', 'Maní crudo', 'Maní con chocolate', 'Manzanilla', 'Marcela', 'Menta', 'Merkén', 'Mermelada de frutos rojos', 'Miel', 'Miel con jengibre', 'Miel con menta', 'Semillas de Mijo', 'Mix de frutos secos', 'Nuez moscada', 'Nuez mariposa', 'Nuez pecán', 'Orégano', 'Pasas de uva morochas', 'Pasas de uva rubias', 'Pasas de uva con chocolate', 'Pasta de maní', 'Tahini', 'Peperina hojas', 'Peras deshidratadas', 'Pimenton ahumado', 'Pimenton dulce', 'Pimienta negra molida', 'Pimienta blanca molida', 'Poleo', 'Polvo de hornear', 'Porotos Mung', 'Porotos Negros', 'Porotos Aduki', 'Porotos Alubia', 'Proteína vegetal', 'Provenzal', 'Quinoa', 'Romero', 'Sahumerios', 'Sal marina fina', 'Sal marina gruesa', 'Sal rosa del himalaya', 'Semillas de chía', 'Semillas de girasol', 'Semillas de lino marrón', 'Semillas de sésamo blanco', 'Semillas de sésamo integral', 'Semillas de sésamo negro', 'Semillas de zapallo', 'Semillas de lino dorado', 'Soja texturizada orgánica', 'Soja texturizada', 'Stevia en hojas', 'Pasta de dientes Sudanta', 'Té negro', 'Té rojo', 'Té verde', 'Tilo', 'Tofu', 'Tomates secos', 'Tomate triturado', 'Tomillo', 'Yerba', 'Barbacuá'];

        const suggestions = terminosBusqueda.filter(nombre =>
            normalizar(nombre).includes(normalizar(value))
        ).slice(0, 5); // Máximo 5 sugerencias

        if (suggestions.length > 0) {
            suggestionsContainer.style.display = 'block';
            suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    inputFiltro.value = suggestion;
                    filtrarProductos();
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(div);
            });
        }
    });

    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!suggestionsContainer.contains(e.target) && e.target !== inputFiltro) {
            suggestionsContainer.style.display = 'none';
        }
    });

    inputFiltro.addEventListener('blur', () => {
        // Pequeño delay para permitir el clic en las sugerencias
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 200);
    });
}

// Convierte el texto de un CSV en un array de objetos
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

// Filtra los productos por texto ingresado en el input
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

// Carga las imágenes cuando están por entrar en pantalla
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

// ===== FUNCIONES DE UI/INTERFAZ =====

// Muestra la lista de productos en el HTML
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

        // Botón para agregar al carrito
        if (producto.hay_stock && producto.hay_stock.toLowerCase() !== "no") {
            const botonAgregar = document.createElement('button');
            botonAgregar.className = 'boton-agregar';
            botonAgregar.innerHTML = '+';
            botonAgregar.title = 'Agregar al carrito';
            botonAgregar.addEventListener('click', (e) => {
                e.stopPropagation();
                agregarAlCarrito({
                    id: producto.titulo, // Usar título como ID único
                    titulo: producto.titulo,
                    precio: producto.precio,
                    unidad: producto.unidad
                });
            });
            thumbnailDiv.appendChild(botonAgregar);
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

// Muestra u oculta el mensaje de 'Sin resultados'
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

// ===== FUNCIONES DE CONFIGURACIÓN DEL SISTEMA DE FILTRADO =====

// Configura el filtro de búsqueda y el botón de borrado del input de búsqueda
async function inicializarSistemaDeFiltrado() {
    const inputFiltro = document.getElementById('filter-input');
    resetInputValue(inputFiltro);
    const { inputWrapper, clearBtn } = createInputWrapperWithClearButton(inputFiltro);
    setupInputEvents(inputFiltro, clearBtn);
    setupClearButtonEvents(inputFiltro, clearBtn);
    const toggleBtn = createToggleButton();
}

// Crear un wrapper para el input y un botón de limpieza dentro del wrapper
function createInputWrapperWithClearButton(inputElement) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'filter-input-wrapper';

    // Reemplazar el input con el wrapper que contiene el input
    inputElement.parentNode.insertBefore(inputWrapper, inputElement);
    inputWrapper.appendChild(inputElement);

    // Crear botón de limpieza
    const clearBtn = document.createElement('span');
    clearBtn.id = 'clear-filter';
    clearBtn.innerHTML = '&times;';
    clearBtn.title = 'Borrar búsqueda';
    clearBtn.style.display = 'none';

    inputWrapper.appendChild(clearBtn);

    return { inputWrapper, clearBtn };
}

// Configurar eventos del input de búsqueda
function setupInputEvents(inputElement, clearButton) {
    inputElement.addEventListener('input', () => {
        filtrarProductos();
        clearButton.style.display = inputElement.value ? 'block' : 'none';
    });
}

// Configurar eventos del botón de limpieza
function setupClearButtonEvents(inputElement, clearButton) {
    clearButton.addEventListener('click', () => {
        inputElement.value = '';
        deselectAllTags();
        filtrarProductos();
        clearButton.style.display = 'none';
    });
}

// Crear botón toggle
function createToggleButton() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'tag toggle-tag';
    toggleBtn.textContent = '+';
    toggleBtn.id = 'toggle-tags';
    return toggleBtn;
}

// ===== FUNCIONES DE GESTIÓN DE ETIQUETAS =====

async function cargarEtiquetasDesdeCSV() {
    const urlCSV = 'https://raw.githubusercontent.com/dietetica/productos/main/etiquetas';
    try {
        const respuesta = await fetch(urlCSV);
        const texto = await respuesta.text();

        const lineas = texto.trim().split('\n');
        const etiquetas = lineas.map(l => l.trim());

        const contenedor = document.getElementById('tags-container');
        contenedor.innerHTML = '';

        etiquetas.forEach(etiqueta => {
            const boton = document.createElement('button');
            boton.className = 'tag';
            boton.textContent = etiqueta;
            contenedor.appendChild(boton);
        });

        inicializarEventosTags();

    } catch (error) {
        console.error('Error al cargar las etiquetas:', error);
    }
}

function inicializarEventosTags() {
    const tagsContainer = document.querySelector('.tags-container');
    const inputFiltro = document.getElementById('filter-input');

    // Eliminar botón toggle si existe
    const oldToggle = document.getElementById('toggle-tags');
    if (oldToggle) oldToggle.remove();

    // Crear botón toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'tag toggle-tag';
    toggleBtn.textContent = '+';
    toggleBtn.id = 'toggle-tags';
    tagsContainer.appendChild(toggleBtn);

    // Recolectar tags (excluye toggle por ahora)
    let tags = Array.from(tagsContainer.querySelectorAll('.tag')).filter(tag => tag.id !== 'toggle-tags');

    function calcularLineas() {
        // Resetear estado
        tagsContainer.classList.remove('expandido');
        tags.forEach(tag => tag.style.display = 'inline-block');
        toggleBtn.style.display = 'inline-block';

        // Forzar cálculo de layout
        void tagsContainer.offsetHeight;

        const containerWidth = tagsContainer.offsetWidth;
        const tagElements = tags.map(tag => ({
            element: tag,
            width: tag.offsetWidth + 6.5 + 1 // width + gap + changui
        }));

        const toggleWidth = toggleBtn.offsetWidth + 6.5;
        let lines = [[], []];
        let lineWidths = [0, 0];
        let remainingTags = [...tagElements];
        let allTagsVisible = true;

        // Llenar primera línea
        while (remainingTags.length > 0 && lineWidths[0] + remainingTags[0].width <= containerWidth) {
            lines[0].push(remainingTags[0]);
            lineWidths[0] += remainingTags[0].width;
            remainingTags.shift();
        }

        // Llenar segunda línea (incluyendo el botón si es necesario)
        if (remainingTags.length > 0) {
            // Intentar agregar el botón a la segunda línea
            const lastLineWithButton = lineWidths[1] + toggleWidth <= containerWidth;

            // Calcular espacio restante
            let remainingWidth = containerWidth - lineWidths[1];

            // Agregar tags que quepan
            while (remainingTags.length > 0 && lineWidths[1] + remainingTags[0].width <= containerWidth) {
                lines[1].push(remainingTags[0]);
                lineWidths[1] += remainingTags[0].width;
                remainingTags.shift();
            }

            // Si quedan tags, mostrar el botón
            if (remainingTags.length > 0 || !lastLineWithButton) {
                allTagsVisible = false;
                // Retroceder tags hasta que quepa el botón
                while (lineWidths[1] + toggleWidth > containerWidth && lines[1].length > 0) {
                    const removedTag = lines[1].pop();
                    lineWidths[1] -= removedTag.width;
                    remainingTags.unshift(removedTag);
                }
            }
        }

        // Aplicar visibilidad
        tags.forEach(tag => {
            const isVisible = lines.flat().some(item => item.element === tag);
            tag.style.display = isVisible ? 'inline-block' : 'none';
        });

        // Configurar botón toggle
        toggleBtn.textContent = allTagsVisible ? '' : '+';
        toggleBtn.style.display = allTagsVisible ? 'none' : 'inline-block';
    }

    function expandirTags() {
        tagsContainer.classList.add('expandido');
        tags.forEach(tag => tag.style.display = 'inline-block');
        toggleBtn.textContent = '-';
    }

    function colapsarTags() {
        tagsContainer.classList.remove('expandido');
        calcularLineas();
    }

    toggleBtn.onclick = () => {
        const expandido = toggleBtn.textContent === '+';
        if (expandido) expandirTags();
        else colapsarTags();
    };

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Remover clase selected de todos los tags primero
            tags.forEach(t => t.classList.remove('selected'));

            // Alternar selección solo si el tag coincide con el input
            if (inputFiltro.value === tag.textContent) {
                inputFiltro.value = '';
            } else {
                inputFiltro.value = tag.textContent;
                tag.classList.add('selected');
            }

            filtrarProductos();
        });
    });

    inputFiltro.addEventListener('input', () => {
        // Solo deseleccionar tags si el usuario está escribiendo (no cuando se establece por tag)
        if (!inputFiltro.dataset.porTag) {
            tags.forEach(t => t.classList.remove('selected'));
        }
        delete inputFiltro.dataset.porTag;

        filtrarProductos();
        document.getElementById('clear-filter').style.display = inputFiltro.value ? 'block' : 'none';
    });

    // Ejecutar al inicio y al redimensionar
    const recalcular = () => requestAnimationFrame(calcularLineas);
    recalcular();
    window.addEventListener('resize', recalcular);
}

// ===== FUNCIÓN GLOBAL PARA AGREGAR AL CARRITO =====
window.agregarAlCarrito = function(producto) {
    if (window.carrito) {
        window.carrito.agregarProducto(producto);
    } else {
        console.error('El carrito no está inicializado');
    }
};