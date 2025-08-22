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
        this.carritoFlotante = document.getElementById('carrito-flotante');
        this.contadorCarrito = document.getElementById('contador-carrito');
        this.panelCarrito = document.getElementById('panel-carrito');
        this.overlayCarrito = document.getElementById('overlay-carrito');
        this.listaCarrito = document.getElementById('lista-carrito');
        this.subtotalCarrito = document.getElementById('subtotal-carrito');
        this.totalCarrito = document.getElementById('total-carrito');
        this.botonEnviar = document.getElementById('boton-enviar-pedido');
        this.botonCerrarCarrito = document.getElementById('cerrar-carrito'); // Cambiado el nombre
    }

    inicializarEventos() {
        this.carritoFlotante.addEventListener('click', () => this.abrirCarrito());
        this.overlayCarrito.addEventListener('click', () => this.cerrarCarrito());
        this.botonCerrarCarrito.addEventListener('click', () => this.cerrarCarrito()); // Usar el nuevo nombre
        this.botonEnviar.addEventListener('click', () => this.enviarPedidoWhatsApp());
        
        // Delegación de eventos para los controles de cantidad
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

    agregarProducto(producto) {
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
        this.mostrarConfirmacionAgregado(producto.titulo);
    }

    eliminarProducto(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.guardarEnLocalStorage();
        this.actualizarUI();
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
    }

    calcularSubtotal() {
        return this.items.reduce((total, item) => total + (parseInt(item.precio) * item.cantidad), 0);
    }

    guardarEnLocalStorage() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
    }

    actualizarUI() {
        // Actualizar contador
        const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
        this.contadorCarrito.textContent = totalItems;
        
        // Mostrar/ocultar contador
        this.contadorCarrito.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Actualizar lista
        this.listaCarrito.innerHTML = '';
        
        if (this.items.length === 0) {
            this.listaCarrito.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Tu carrito está vacío</p>';
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
                <div class="info-item">
                    <h4>${item.titulo}</h4>
                    <p>${formatearNumero(item.precio)} ${item.unidad || ''}</p>
                </div>
                <div class="controles-item">
                    <button class="disminuir">-</button>
                    <span>${item.cantidad}</span>
                    <button class="aumentar">+</button>
                    <button class="eliminar">×</button>
                </div>
            `;
            
            this.listaCarrito.appendChild(elemento);
        });
        
        // Actualizar totales
        const subtotal = this.calcularSubtotal();
        this.subtotalCarrito.textContent = formatearNumero(subtotal);
        this.totalCarrito.textContent = formatearNumero(subtotal);
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

    mostrarConfirmacionAgregado(nombreProducto) {
        // Crear notificación temporal
        const notificacion = document.createElement('div');
        notificacion.style.cssText = `
            position: fixed;
            bottom: 180px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1002;
            max-width: 250px;
        `;
        notificacion.textContent = `✓ ${nombreProducto} agregado al carrito`;
        
        document.body.appendChild(notificacion);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 3000);
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
function agregarAlCarrito(producto) {
    if (window.carrito) {
        window.carrito.agregarProducto(producto);
    }
}