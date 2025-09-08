// ===== GESTIÓN DEL CARRITO =====

// Función helper para buscar elementos por texto (similar a :contains de jQuery)
function encontrarElementoPorTexto(selector, texto) {
    const elementos = document.querySelectorAll(selector);
    return Array.from(elementos).find(el => 
        el.textContent.trim().toLowerCase() === texto.toLowerCase()
    );
}

// Extender NodeList para incluir método find (para compatibilidad)
if (!NodeList.prototype.find) {
    NodeList.prototype.find = function(callback) {
        return Array.from(this).find(callback);
    };
}

class Carrito {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('carrito')) || [];
        this.inicializarElementos();
        this.inicializarEventos();
        this.actualizarUI();
    }

    inicializarElementos() {
        this.panelCarrito = document.getElementById('panel-carrito');
        this.overlayCarrito = document.getElementById('overlay-carrito');
        this.listaCarrito = document.getElementById('lista-carrito');
        this.subtotalCarrito = document.getElementById('subtotal-carrito');
        this.totalCarrito = document.getElementById('total-carrito');
        this.botonEnviar = document.getElementById('boton-enviar-pedido');
        this.botonCerrarCarrito = document.getElementById('cerrar-carrito');
        
        // Nuevos elementos para la barra circular central
        this.barraCircularCentral = document.getElementById('barra-circular-central');
        this.botonCarritoCentral = document.getElementById('boton-carrito-central');
        this.totalPedido = document.getElementById('total-pedido');
        this.detallesPedido = document.getElementById('detalles-pedido');
    }

    inicializarEventos() {
        this.overlayCarrito.addEventListener('click', () => this.cerrarCarrito());
        this.botonCerrarCarrito.addEventListener('click', () => this.cerrarCarrito());
        this.botonEnviar.addEventListener('click', () => this.enviarPedidoWhatsApp());
        
        this.botonCarritoCentral.addEventListener('click', () => this.abrirCarrito());
        
        this.listaCarrito.addEventListener('click', (e) => {
            if (e.target.classList.contains('disminuir')) {
                const id = e.target.closest('.item-carrito').dataset.id;
                this.disminuirCantidad(id);
            } else if (e.target.classList.contains('aumentar')) {
                const id = e.target.closest('.item-carrito').dataset.id;
                this.aumentarCantidad(id);
            } else if (e.target.classList.contains('eliminar')) {
                const id = e.target.closest('.item-carrito').dataset.id;
                this.eliminarProducto(id);
            }
        });
    }

    actualizarBotonesAgregar() {
        const botones = document.querySelectorAll('.boton-agregar');
        botones.forEach(boton => {
            const productoId = boton.dataset.id;
            const enCarrito = this.items.find(item => item.id === productoId);
            
            if (enCarrito) {
                boton.classList.add('en-carrito');
            } else {
                boton.classList.remove('en-carrito');
            }
        });
    }

    agregarProducto(producto, botonAgregar = null) {
        const productoExistente = this.items.find(item => item.id === producto.id);
        
        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            this.items.push({
                id: producto.id,
                titulo: producto.titulo,
                precio: producto.precio,
                unidad: producto.unidad,
                cantidad: 1
            });
        }
        
        this.guardarEnLocalStorage();
        this.actualizarUI();
        
        // Mostrar confirmación si se proporcionó un botón
        if (botonAgregar) {
            this.mostrarConfirmacionAgregado(producto.titulo, botonAgregar);
        }
        
        // Actualizar el estado de los botones
        this.actualizarBotonesAgregar();
    }

    eliminarProducto(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.guardarEnLocalStorage();
        this.actualizarUI();
        this.actualizarBotonesAgregar();
    }

    aumentarCantidad(id) {
        const producto = this.items.find(item => item.id === id);
        if (producto) {
            producto.cantidad += 1;
            this.guardarEnLocalStorage();
            this.actualizarUI();
        }
    }

    disminuirCantidad(id) {
        const producto = this.items.find(item => item.id === id);
        if (producto) {
            producto.cantidad -= 1;
            if (producto.cantidad <= 0) {
                this.eliminarProducto(id);
            } else {
                this.guardarEnLocalStorage();
                this.actualizarUI();
            }
        }
        this.actualizarBotonesAgregar();
    }

    calcularSubtotal() {
        return this.items.reduce((total, item) => total + (parseInt(item.precio) * item.cantidad), 0);
    }

    guardarEnLocalStorage() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
    }

    actualizarUI() {
        // Actualizar contadores
        const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
        const subtotal = this.calcularSubtotal();
        
        // Actualizar información de la barra central
        this.totalPedido.textContent = formatearNumero(subtotal);
        this.detallesPedido.textContent = `${totalItems} producto${totalItems !== 1 ? 's' : ''}`;
        
        // Mostrar/ocultar barra central según si hay productos
        if (totalItems > 0) {
            this.barraCircularCentral.style.display = 'flex';
        } else {
            this.barraCircularCentral.style.display = 'none';
        }
        
        // Resto de la actualización de UI (lista de carrito, etc.)
        this.listaCarrito.innerHTML = '';
        
        if (this.items.length === 0) {
            this.listaCarrito.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Tu pedido está vacío</p>';
            this.subtotalCarrito.textContent = '$0';
            this.totalCarrito.textContent = '$0';
            return;
        }
        
        this.items.forEach(item => {
            const elemento = document.createElement('div');
            elemento.className = 'item-carrito';
            elemento.dataset.id = item.id;
            
            // Buscar la imagen del producto
            let imagenSrc = 'img/sin-imagen.png';
            const productos = document.querySelectorAll('.producto-item');
            
            for (const producto of productos) {
                const titulo = producto.querySelector('.producto-titulo');
                if (titulo && titulo.textContent.trim() === item.titulo) {
                    const img = producto.querySelector('.producto-thumbnail img');
                    if (img) {
                        imagenSrc = img.src || img.getAttribute('data-src') || 'img/sin-imagen.png';
                        break;
                    }
                }
            }
            
            elemento.innerHTML = `
                <div class="imagen-item-carrito">
                    <img src="${imagenSrc}" alt="${item.titulo}" onerror="this.src='img/sin-imagen.png'">
                </div>
                <div class="contenido-item-carrito">
                    <div class="titulo-item-carrito">
                        <p>${item.titulo}</p>
                    </div>
                    <div class="controles-precio-item-carrito">
                        <div class="controles-unidad-item-carrito"> 
                            <button class="disminuir">-</button>
                            <span class="unidad-item-carrito">${item.unidad || ''}</span>
                            <button class="aumentar">+</button>
                        </div>
                    </div>
                    <div class="precio-item-carrito">
                        ${formatearNumero(item.precio * item.cantidad)}
                    </div>
                </div>
            `;
            
            this.listaCarrito.appendChild(elemento);
        });
        
        // Actualizar totales del panel
        this.subtotalCarrito.textContent = formatearNumero(subtotal);
        this.totalCarrito.textContent = formatearNumero(subtotal);

        // Actualizar botones al final
        this.actualizarBotonesAgregar();
    }

    abrirCarrito() {
        this.panelCarrito.classList.add('abierto');
        this.overlayCarrito.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }

    cerrarCarrito() {
        this.panelCarrito.classList.remove('abierto');
        this.overlayCarrito.classList.remove('activo');
        document.body.style.overflow = '';
    }

    mostrarConfirmacionAgregado(nombreProducto, botonAgregar) {
        const botonRect = botonAgregar.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-agregado';
        notificacion.textContent = '¡Agregado!';
        notificacion.style.position = 'absolute';
        
        // Calcular posición centrada verticalmente respecto al botón
        const leftPosition = botonRect.left + scrollX - 10;
        const topPosition = botonRect.top + scrollY + (botonRect.height / 2) - (12); // 12px es la mitad de la altura estimada de la notificación
        
        notificacion.style.left = `${leftPosition}px`;
        notificacion.style.top = `${topPosition}px`;
        notificacion.style.opacity = '0';
        notificacion.style.zIndex = '500';
        notificacion.style.transform = 'translateX(-95%)';
        
        document.body.appendChild(notificacion);
        
        // Asegurar que la notificación no se salga de la pantalla
        const notifRect = notificacion.getBoundingClientRect();
        
        // Ajustar si se sale por la izquierda
        if (notifRect.left < 10) {
            notificacion.style.left = '10px';
            notificacion.style.transform = 'none';
        }
        
        // Ajustar si se sale por arriba
        if (notifRect.top < 10) {
            notificacion.style.top = `${scrollY + 10}px`;
        }
        
        // Ajustar si se sale por abajo
        if (notifRect.bottom > window.innerHeight - 10) {
            notificacion.style.top = `${window.innerHeight - notifRect.height - 10 + scrollY}px`;
        }
        
        // Animación de entrada
        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transition = 'opacity 0.3s ease';
        }, 10);
        
        // Animación de salida después de 1.5 segundos
        setTimeout(() => {
            notificacion.style.opacity = '0';
            
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 2000);
    }

    enviarPedidoWhatsApp() {
        if (this.items.length === 0) return;
        
        const numeroWhatsApp = '5491133417868';
        let mensaje = '¡Hola! Quiero hacer el siguiente pedido:%0A%0A';
        
        this.items.forEach(item => {
            mensaje += `• ${item.titulo} - ${item.cantidad} x ${formatearNumero(item.precio)}${item.unidad ? ' ' + item.unidad : ''}%0A`;
        });
        
        mensaje += `%0ATotal: ${formatearNumero(this.calcularSubtotal())}%0A%0A`;
        mensaje += 'Mi nombre: [COMPLETAR]%0A';
        mensaje += 'Dirección de entrega: [COMPLETAR]%0A';
        mensaje += 'Teléfono de contacto: [COMPLETAR]';
        
        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensaje}`;
        window.open(urlWhatsApp, '_blank');
    }
}

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.carrito = new Carrito();
});

// Función para agregar productos al carrito desde cualquier parte del código
function agregarAlCarrito(producto, botonAgregar = null) {
    if (window.carrito) {
        window.carrito.agregarProducto(producto, botonAgregar);
    }
}