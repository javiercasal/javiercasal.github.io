// Visor de imágenes a pantalla completa - Versión definitiva
document.addEventListener('DOMContentLoaded', function() {
    // Crear el visor dinámicamente
    const visorHTML = `
        <div class="axj-visor-imagen" id="axj-visor-imagen">
            <button class="axj-cerrar-visor" id="axj-cerrar-visor">&times;</button>
            <img class="axj-imagen-ampliada" id="axj-imagen-ampliada">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', visorHTML);

    // Elementos del visor
    const visor = document.getElementById('axj-visor-imagen');
    const imagenAmpliada = document.getElementById('axj-imagen-ampliada');
    const cerrarVisor = document.getElementById('axj-cerrar-visor');

    // Función para mostrar imagen
    function mostrarImagen(src) {
        if (!src || src.includes('sin-imagen.png')) return;
        imagenAmpliada.src = src;
        visor.classList.add('mostrar');
        document.body.style.overflow = 'hidden';
    }

    // Función para ocultar imagen
    function ocultarImagen() {
        visor.classList.remove('mostrar');
        document.body.style.overflow = '';
    }

    // Manejador de clics en miniaturas
    function manejarClickThumbnail(e) {
        const thumbnail = e.target.closest('.producto-thumbnail');
        if (!thumbnail) return;

        const img = thumbnail.querySelector('img');
        if (!img) return;

        const src = img.classList.contains('lazy') ? img.dataset.src : img.src;
        mostrarImagen(src);
    }

    // Event listeners
    document.addEventListener('click', manejarClickThumbnail);
    cerrarVisor.addEventListener('click', ocultarImagen);
    visor.addEventListener('click', (e) => {
        if (e.target === visor) ocultarImagen();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && visor.classList.contains('mostrar')) {
            ocultarImagen();
        }
    });

    // Asegurar que las miniaturas sean clickeables
    document.querySelectorAll('.producto-thumbnail').forEach(thumbnail => {
        thumbnail.style.cursor = 'pointer';
    });
});