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

// Función para obtener configuración (costoEnvio y pedidoMinimo)
async function obtenerConfiguracion() {
    try {
        const urlJSON = 'https://raw.githubusercontent.com/dietetica/datos/main/config.json';
        const respuesta = await fetch(urlJSON);
        const datos = await respuesta.json();
        
        return {
            costoEnvio: parseInt(datos.costoEnvio) || 0,
            pedidoMinimo: parseInt(datos.pedidoMinimo) || 0
        };
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
        return { costoEnvio: 0, pedidoMinimo: 0 };
    }
}

class Carrito {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('carrito')) || [];
        this.costoEnvio = 0;
        this.pedidoMinimo = 0;
        this.inicializarElementos();
        this.inicializarEventos();
        this.actualizarUI();
        this.cargarConfiguracion();
    }

    inicializarElementos() {
        this.panelCarrito = document.getElementById('panel-carrito');
        this.overlayCarrito = document.getElementById('overlay-carrito');
        this.listaCarrito = document.getElementById('lista-carrito');
        this.subtotalCarrito = document.getElementById('subtotal-carrito');
        this.envioCarrito = document.getElementById('envio-carrito');
        this.totalCarrito = document.getElementById('total-carrito');
        this.botonEnviar = document.getElementById('boton-enviar-pedido');
        this.botonCerrarCarrito = document.getElementById('cerrar-carrito');
        
        // Barra minimalista
        this.barraMinimalista = document.getElementById('barra-minimalista');
        this.botonCarritoMinimalista = document.getElementById('boton-carrito-minimalista');
        this.totalPedido = document.getElementById('total-pedido');
        this.detallesPedido = document.getElementById('detalles-pedido');
    }

    inicializarEventos() {
        this.overlayCarrito.addEventListener('click', () => this.cerrarCarrito());
        this.botonCerrarCarrito.addEventListener('click', () => this.cerrarCarrito());
        this.botonEnviar.addEventListener('click', () => this.enviarPedidoWhatsApp());
        
        // Evento para el botón de la barra minimalista
        this.botonCarritoMinimalista.addEventListener('click', () => this.abrirCarrito());
        
        this.listaCarrito.addEventListener('click', (e) => {
            // Detectar clics en los contenedores de botones
            const contenedorBoton = e.target.closest('.contenedor-boton');
            if (!contenedorBoton) return;
            
            const boton = contenedorBoton.querySelector('button');
            if (!boton) return;
            
            const id = e.target.closest('.item-carrito').dataset.id;
            
            if (boton.classList.contains('disminuir')) {
                this.disminuirCantidad(id);
            } else if (boton.classList.contains('aumentar')) {
                this.aumentarCantidad(id);
            } else if (boton.classList.contains('eliminar')) {
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
            //productoExistente.cantidad += 1;
        } else {
            this.items.push({
                id: producto.id,
                titulo: producto.titulo,
                precio: producto.precio,
                unidad: producto.unidad,
                cantidad: 1
            });
            
            // Mostrar confirmación de agregregado si se proporcionó un botón
            if (botonAgregar) {
                this.mostrarConfirmacionAgregado(producto.titulo, botonAgregar);
            }
        }
        
        this.guardarEnLocalStorage();
        this.actualizarUI();

        // Actualizar el estado de los botones
        this.actualizarBotonesAgregar();
    }

eliminarProducto(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.guardarEnLocalStorage();
    this.actualizarUI();
    
    // Actualizar específicamente el mensaje de pedido mínimo
    const subtotal = this.calcularSubtotal();
    this.actualizarBotonEnvio(subtotal);
    
    this.actualizarBotonesAgregar();
}

    aumentarCantidad(id) {
        const producto = this.items.find(item => item.id === id);
        if (producto) {
            producto.cantidad += 1;
            this.guardarEnLocalStorage();
            this.actualizarUI();
            
            // Actualizar específicamente el mensaje de pedido mínimo
            const subtotal = this.calcularSubtotal();
            this.actualizarBotonEnvio(subtotal);
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
            
            // Actualizar específicamente el mensaje de pedido mínimo
            const subtotal = this.calcularSubtotal();
            this.actualizarBotonEnvio(subtotal);
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

    async cargarConfiguracion() {
        const config = await obtenerConfiguracion();
        this.costoEnvio = config.costoEnvio;
        this.pedidoMinimo = config.pedidoMinimo;
        this.actualizarUI();
    }

    actualizarUI() {
        // Actualizar contadores
        const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
        const subtotal = this.calcularSubtotal();
        
        // Actualizar información de la barra minimalista
        this.totalPedido.textContent = formatearNumero(subtotal);
        this.detallesPedido.textContent = `${totalItems} producto${totalItems !== 1 ? 's' : ''}`;
        
        // Mostrar/ocultar barra minimalista según si hay productos
        const barraMinimalista = document.getElementById('barra-minimalista');
        if (totalItems > 0) {
            barraMinimalista.style.display = 'flex';
        } else {
            barraMinimalista.style.display = 'none';
        }
        
        // Resto de la actualización de UI (lista de carrito, etc.)
        this.listaCarrito.innerHTML = '';
        
        if (this.items.length === 0) {
            this.listaCarrito.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Tu pedido está vacío</p>';
            this.subtotalCarrito.textContent = '$0';
            this.envioCarrito.textContent = '-';
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
                if (producto.dataset.id === item.id) {
                    const img = producto.querySelector('.producto-thumbnail img');
                    if (img) {
                        // Obtener la imagen real (src o data-src para lazy loading)
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
                        <div class="contenedor-boton contenedor-eliminar">
                            <button class="eliminar">🗑️</button>
                        </div>
                        <div class="contenedor-boton contenedor-disminuir">
                            <button class="disminuir">-</button>
                        </div>
                        <div class="controles-unidad-item-carrito"> 
                            <span class="unidad-item-carrito">${item.unidad || ''}</span>
                        </div>
                        <div class="contenedor-boton contenedor-aumentar">
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
        this.envioCarrito.textContent = formatearNumero(this.costoEnvio);
        this.totalCarrito.textContent = formatearNumero(subtotal + this.costoEnvio);

        this.actualizarBotonEnvio(subtotal);

        // Actualizar botones al final
        this.actualizarBotonesAgregar();
    }

    actualizarBotonEnvio(subtotal) {
        const cumpleMinimo = subtotal >= this.pedidoMinimo;
        
        if (cumpleMinimo) {
            this.botonEnviar.disabled = false;
            this.botonEnviar.textContent = 'Enviar pedido por WhatsApp';
            this.botonEnviar.classList.remove('boton-deshabilitado');
            this.botonEnviar.classList.add('boton-habilitado');
            
            // Eliminar mensaje de pedido mínimo si existe
            const mensajeMinimo = document.getElementById('mensaje-pedido-minimo');
            if (mensajeMinimo) {
                mensajeMinimo.remove();
            }
        } else {
            this.botonEnviar.disabled = true;
            this.botonEnviar.textContent = `Pedido mínimo: ${formatearNumero(this.pedidoMinimo)}`;
            this.botonEnviar.classList.remove('boton-habilitado');
            this.botonEnviar.classList.add('boton-deshabilitado');
            
            // Calcular monto faltante
            const montoFaltante = this.pedidoMinimo - subtotal;
            
            // Agregar o actualizar mensaje informativo
            let mensaje = document.getElementById('mensaje-pedido-minimo');
            
            if (!mensaje) {
                mensaje = document.createElement('div');
                mensaje.id = 'mensaje-pedido-minimo';
                mensaje.className = 'mensaje-pedido-minimo';
                
                // Insertar después del botón de envío
                this.botonEnviar.parentNode.insertBefore(mensaje, this.botonEnviar.nextSibling);
            }
            
            mensaje.textContent = `Agregá productos por ${formatearNumero(montoFaltante)} para completar el pedido mínimo`;
        }
    }

    async cargarCostoEnvio() {
        this.costoEnvio = await obtenerCostoEnvio();
        this.actualizarUI();
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
        notificacion.textContent = 'Agregado!';
        notificacion.style.position = 'absolute';
        
        // Calcular posición centrada verticalmente respecto al botón
        const leftPosition = botonRect.left + scrollX - 10;
        const topPosition = botonRect.top + scrollY + (botonRect.height / 2) - (15); // 15px es la mitad de la altura estimada de la notificación
        
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
        }, 1000);
    }

    enviarPedidoWhatsApp() {
        if (this.items.length === 0) return;

        const subtotal = this.calcularSubtotal();

        // Verificar que cumpla con el pedido mínimo
        if (subtotal < this.pedidoMinimo) {
            return; // No hacer nada si no cumple el mínimo
        }
        
        const numeroWhatsApp = '5491133417868';
        let mensaje = '¡Hola! Quiero hacer el siguiente pedido:%0A%0A';
        
        this.items.forEach(item => {
            mensaje += `• ${item.titulo} - ${item.cantidad} x ${formatearNumero(item.precio)}${item.unidad ? ' ' + item.unidad : ''}%0A`;
        });
        
        mensaje += `%0ASubtotal: ${formatearNumero(subtotal)}%0A`;
        mensaje += `Envío: ${formatearNumero(this.costoEnvio)}%0A`;
        mensaje += `Total: ${formatearNumero(subtotal + this.costoEnvio)}%0A%0A`;
        mensaje += 'Mi nombre: [COMPLETAR]%0A';
        mensaje += 'Dirección de entrega: [COMPLETAR]%0A';
        
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