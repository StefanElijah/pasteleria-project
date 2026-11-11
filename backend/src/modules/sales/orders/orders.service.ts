import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { EstadoPedido } from '@prisma/client';
import { CartService } from '@modules/sales/cart/cart.service';
import { LoyaltyService } from '@modules/loyalty/loyalty.service';
import { toTitleCase } from '@/lib/normalize-name';

const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
    PENDIENTE: ['PREPARANDO', 'CANCELADO'],
    PREPARANDO: ['ENVIADO', 'CANCELADO'],
    ENVIADO: ['EN_REPARTO', 'RETRASADO', 'INTENTO_FALLIDO'],
    EN_REPARTO: ['ENTREGADO', 'INTENTO_FALLIDO', 'RETRASADO'],
    RETRASADO: ['EN_REPARTO', 'INTENTO_FALLIDO', 'ENTREGADO'],
    INTENTO_FALLIDO: ['EN_REPARTO', 'RETRASADO', 'DEVUELTO'],
    DEVUELTO: [],
    ENTREGADO: [],
    CANCELADO: [],
};

@Injectable()
export class OrdersService {
    constructor(
        @Inject('PrismaClient') private prisma: any,
        private cartService: CartService,
        private loyalty: LoyaltyService,
    ) { }

    async calculateShipping(comunaId: string, metodoEnvio: string): Promise<{ costo: number; fechaEstimada: Date }> {
        const comuna = await this.prisma.comuna.findUnique({
            where: { id: comunaId },
            include: { region: true },
        });
        if (!comuna) throw new NotFoundException('Comuna no encontrada');

        let costo = 0;
        let dias = 3;
        if (comuna.region.id === '13' || comuna.region.nombre.includes('Metropolitana')) {
            if (metodoEnvio === 'Chilexpress') costo = 3000;
            if (metodoEnvio === 'Starken') costo = 2500;
            dias = 1;
        } else {
            if (metodoEnvio === 'Chilexpress') costo = 5000;
            if (metodoEnvio === 'Starken') costo = 4500;
            dias = 3;
        }

        const fechaEstimada = new Date();
        fechaEstimada.setDate(fechaEstimada.getDate() + dias);
        return { costo, fechaEstimada };
    }

    private resolvePlataforma(plataforma?: string, userAgent?: string): 'MOBILE' | 'DESKTOP' {
        const normalized = (plataforma || '').trim().toUpperCase();
        if (normalized === 'MOBILE' || normalized === 'DESKTOP') return normalized;

        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent || '')
            ? 'MOBILE'
            : 'DESKTOP';
    }

    async create(
        userId: string | null,
        createOrderDto: CreateOrderDto,
        cartId?: string,
        userAgent?: string,
    ) {
        const {
            items,
            direccionId,
            direccion,
            metodoPago,
            metodoEnvio,
            costoEnvio,
            descuentoId,
            notas,
            primerNombreDestinatario,
            primerApellidoDestinatario,
            emailDestinatario,
            telefonoDestinatario,
            transaccionId,
            comprobantePago,
            plataforma,
            guardarDireccion,
            direccionGuardadaId,
        } = createOrderDto;

        const plataformaFinal = this.resolvePlataforma(plataforma, userAgent);

        // Normalización de nombres del destinatario
        const nombreDestinatario = toTitleCase(primerNombreDestinatario) as string;
        const apellidoDestinatario = toTitleCase(primerApellidoDestinatario) as string;

        // 1. Determinar los items del pedido (desde el DTO o desde el carrito)
        let finalItems: Array<{ productId: string; quantity: number }> = [];

        if (items && items.length > 0) {
            finalItems = items;
        } else if (cartId) {
            const cart = await this.cartService.getCart(cartId);
            if (!cart.items.length) throw new BadRequestException('El carrito está vacío');
            finalItems = cart.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
            }));
        } else {
            throw new BadRequestException('No se proporcionaron items ni carrito');
        }

        // 2. Obtener o crear la dirección (sin regionId)
        let direccionFinal: any = null;

        if (direccionId) {
            direccionFinal = await this.prisma.direccion.findUnique({
                where: { id: direccionId },
                include: { comuna: true, ciudad: true },
            });
            if (!direccionFinal) throw new NotFoundException('Dirección no encontrada');
            if (userId && direccionFinal.usuarioId !== userId) {
                throw new BadRequestException('La dirección no pertenece al usuario');
            }
        } else if (direccion) {
            const { comunaId, ...dirData } = direccion;
            if (dirData.calle) dirData.calle = toTitleCase(dirData.calle) as string;
            const comuna = await this.prisma.comuna.findUnique({ where: { id: comunaId } });
            if (!comuna) throw new NotFoundException('Comuna no encontrada');

            // Snapshot inmutable del pedido: SIEMPRE usuarioId = null
            // (así no contamina la libreta de direcciones del usuario)
            direccionFinal = await this.prisma.direccion.create({
                data: {
                    ...dirData,
                    comunaId,
                    usuarioId: null,
                },
                include: { comuna: true, ciudad: true },
            });

            // Guardar/actualizar en la libreta del usuario si lo pidió
            if (guardarDireccion && userId) {
                const datosLibreta: any = { ...dirData, comunaId };
                delete datosLibreta.isDefault;
                if (direccionGuardadaId) {
                    const existente = await this.prisma.direccion.findFirst({
                        where: { id: direccionGuardadaId, usuarioId: userId },
                    });
                    if (existente) {
                        await this.prisma.direccion.update({
                            where: { id: direccionGuardadaId },
                            data: datosLibreta,
                        });
                    } else {
                        await this.prisma.direccion.create({
                            data: { ...datosLibreta, usuarioId: userId },
                        });
                    }
                } else {
                    await this.prisma.direccion.create({
                        data: { ...datosLibreta, usuarioId: userId },
                    });
                }
            }
        } else {
            throw new BadRequestException('Debe proporcionar direccionId o direccion temporal');
        }

        // 3. Calcular envío y fecha estimada (siempre desde el servidor)
        const envioCalc = await this.calculateShipping(direccionFinal.comunaId, metodoEnvio);
        let envioCosto = costoEnvio ?? envioCalc.costo;
        const fechaEstimadaEntrega = envioCalc.fechaEstimada;

        // 4. Validar productos y calcular subtotal
        let subtotal = 0;
        const orderItemsData: any[] = [];
        for (const item of finalItems) {
            const product = await this.prisma.producto.findUnique({
                where: { id: item.productId, activo: true },
            });
            if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
            const unitPrice = product.precio;
            const totalItem = unitPrice * item.quantity;
            subtotal += totalItem;
            orderItemsData.push({
                productoId: product.id,
                nombre: product.nombre,
                precio: unitPrice,
                cantidad: item.quantity,
                total: totalItem,
            });
        }

        // 5. Aplicar descuento (respetando objetivo, dueño del cupón y envío gratis)
        let discountAmount = 0;
        let descuentoValidoId: string | null = null;
        let envioGratis = false;
        if (descuentoId) {
            const descuento = await this.prisma.descuento.findUnique({
                where: { id: descuentoId, activo: true },
                include: { productos: true, categorias: true },
            });
            const vigente = descuento && (!descuento.fechaFin || descuento.fechaFin >= new Date());
            const autorizado = descuento && (!descuento.usuarioId || descuento.usuarioId === userId);
            if (vigente && autorizado) {
                let aplicable = subtotal;
                if (descuento.objetivo === 'PRODUCTOS_ESPECIFICOS') {
                    const ids = new Set(descuento.productos.map((p: any) => p.id));
                    aplicable = orderItemsData
                        .filter((i) => ids.has(i.productoId))
                        .reduce((s, i) => s + i.total, 0);
                } else if (descuento.objetivo === 'CATEGORIAS_ESPECIFICAS') {
                    const prodIds = new Set(descuento.productos.map((p: any) => p.id));
                    const catIds = new Set(descuento.categorias.map((c: any) => c.id));
                    const prods = await this.prisma.producto.findMany({
                        where: { id: { in: orderItemsData.map((i) => i.productoId) } },
                        select: { id: true, categoriaId: true },
                    });
                    const elegibles = new Set(
                        prods
                            .filter((p) => catIds.has(p.categoriaId) || prodIds.has(p.id))
                            .map((p) => p.id),
                    );
                    aplicable = orderItemsData
                        .filter((i) => elegibles.has(i.productoId))
                        .reduce((s, i) => s + i.total, 0);
                }

                if (descuento.tipo === 'PORCENTAJE') {
                    discountAmount = Math.round((aplicable * descuento.valor) / 100);
                } else if (descuento.tipo === 'MONTO_FIJO') {
                    discountAmount = Math.min(descuento.valor, aplicable);
                } else if (descuento.tipo === 'ENVIO_GRATIS') {
                    envioGratis = true;
                }
                descuentoValidoId = descuentoId;
                await this.prisma.descuento.update({
                    where: { id: descuentoId },
                    data: { contadorUso: { increment: 1 } },
                });
            }
        }

        if (envioGratis) envioCosto = 0;

        // 6. Canje de puntos (1 punto = $1, con validación de tope)
        let puntosUsados = 0;
        const puntosSolicitados = createOrderDto.puntosUsados || 0;
        if (puntosSolicitados > 0 && userId) {
            puntosUsados = await this.loyalty.canjearPuntos(userId, puntosSolicitados, subtotal);
        }

        const total = Math.max(0, subtotal - discountAmount - puntosUsados) + envioCosto;
        const orderNumber = `ORD-${Date.now()}`;
        // Generar trackingToken solo si es un pedido de invitado (sin userId)
        const trackingToken = userId ? null : require('crypto').randomUUID();

        // 6. Crear pedido y envío en transacción
        const result = await this.prisma.$transaction(async (tx: any) => {
            const newOrder = await tx.pedido.create({
                data: {
                    numeroPedido: orderNumber,
                    estado: EstadoPedido.PENDIENTE,
                    subtotal,
                    costoEnvio: envioCosto,
                    total,
                    metodoPago,
                    notas,
                    usuarioId: userId,
                    direccionId: direccionFinal.id,
                    descuentoId: descuentoValidoId,
                    primerNombreDestinatario: nombreDestinatario,
                    primerApellidoDestinatario: apellidoDestinatario,
                    emailDestinatario,
                    telefonoDestinatario,
                    transaccionId,
                    comprobantePago,
                    trackingToken,
                    plataforma: plataformaFinal,
                    puntosUsados,
                    items: { create: orderItemsData },
                },
                include: { items: true, direccion: { include: { comuna: { include: { region: true } }, ciudad: true } } },
            });

            const envio = await tx.envio.create({
                data: {
                    metodoEnvio,
                    empresaLogistica: metodoEnvio,
                    fechaEstimadaEntrega,
                    pedidoId: newOrder.id,
                    estadoEnvio: 'PENDIENTE',
                },
            });

            // Registrar uso de descuento
            if (descuentoValidoId && userId) {
                await tx.descuentoUso.create({
                    data: {
                        descuentoId: descuentoValidoId,
                        usuarioId: userId,
                        pedidoId: newOrder.id,
                    },
                });
            }

            // Descontar puntos canjeados (atomic, mismo tx)
            if (puntosUsados > 0 && userId) {
                const perfil = await tx.perfilCliente.findUnique({ where: { usuarioId: userId } });
                const nuevoSaldo = (perfil?.puntos || 0) - puntosUsados;
                await tx.perfilCliente.upsert({
                    where: { usuarioId: userId },
                    update: { puntos: nuevoSaldo },
                    create: { usuarioId: userId, puntos: nuevoSaldo },
                });
                await tx.movimientoPuntos.create({
                    data: {
                        usuarioId: userId,
                        pedidoId: newOrder.id,
                        tipo: 'CANJE',
                        puntos: -puntosUsados,
                        saldoDespues: nuevoSaldo,
                        descripcion: `Canje de puntos en pedido ${orderNumber}`,
                    },
                });
            }

            // Vaciar carrito
            if (cartId) {
                await this.cartService.clearCart(cartId);
            }

            return { ...newOrder, envio };
        });

        return result;
    }

    async findAll(user: { userId?: string; rol?: string }) {
        const where = user.rol === 'ADMIN' ? {} : { usuarioId: user.userId };
        return this.prisma.pedido.findMany({
            where,
            include: {
                items: { include: { producto: true } },
                direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
                envio: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private checkOwnership(order: any, userId: string, rol?: string) {
        if (rol === 'ADMIN') return;
        if (order.usuarioId !== userId) throw new BadRequestException('No tienes permiso');
    }

    async findOne(id: string, userId: string, rol?: string) {
        const order = await this.prisma.pedido.findUnique({
            where: { id },
            include: {
                items: { include: { producto: true } },
                direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
                envio: true,
            },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        this.checkOwnership(order, userId, rol);
        return order;
    }

    async findByNumero(numeroPedido: string, userId: string, rol?: string) {
        const order = await this.prisma.pedido.findUnique({
            where: { numeroPedido },
            include: {
                items: { include: { producto: true } },
                direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
                envio: true,
            },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        this.checkOwnership(order, userId, rol);
        return order;
    }

    async findByTrackingToken(token: string) {
        const order = await this.prisma.pedido.findUnique({
            where: { trackingToken: token },
            include: {
                items: { include: { producto: true } },
                direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
                envio: true,
            },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        return order;
    }

    async updateStatus(id: string, estado: EstadoPedido, userId: string, rol?: string) {
        const order = await this.findOne(id, userId, rol);

        // Defensa en profundidad: solo ADMIN o MODERADOR
        if (rol !== 'ADMIN' && rol !== 'MODERADOR') {
            throw new ForbiddenException('No tienes permisos para cambiar el estado del pedido');
        }

        // Validar transición permitida
        const permitidas = TRANSICIONES[order.estado] || [];
        if (!permitidas.includes(estado)) {
            throw new BadRequestException(
                `No se puede cambiar de ${order.estado} a ${estado}. Estados permitidos: ${permitidas.join(', ') || 'ninguno (estado final)'}`
            );
        }

        const updated = await this.prisma.pedido.update({
            where: { id },
            data: { estado },
            include: { envio: true },
        });

        // Efectos de fidelidad según el nuevo estado
        try {
            if (estado === 'ENTREGADO') {
                await this.loyalty.otorgarPuntos(id);
            } else if (estado === 'CANCELADO' || estado === 'DEVUELTO') {
                // Revertir puntos ganados (si estaban otorgados)
                await this.loyalty.revertirPuntos(id, order.subtotal, order.subtotal);
                // Devolver puntos usados en la compra
                if (order.puntosUsados > 0 && order.usuarioId) {
                    await this.loyalty.reintegrarPuntos(
                        order.usuarioId,
                        order.puntosUsados,
                        `Devolución de puntos por pedido ${order.numeroPedido} (${estado})`,
                        order.id,
                    );
                    await this.prisma.pedido.update({ where: { id }, data: { puntosUsados: 0 } });
                }
            }
        } catch {
            // No bloquear el cambio de estado si falla la lógica de fidelidad
        }

        return updated;
    }

    getStatusInfo() {
        return {
            labels: {
                PENDIENTE: 'Pendiente',
                PREPARANDO: 'Preparando',
                ENVIADO: 'Enviado',
                EN_REPARTO: 'En Reparto',
                ENTREGADO: 'Entregado',
                INTENTO_FALLIDO: 'Intento Fallido',
                RETRASADO: 'Retrasado',
                DEVUELTO: 'Devuelto',
                CANCELADO: 'Cancelado',
            },
            colors: {
                PENDIENTE: 'yellow',
                PREPARANDO: 'blue',
                ENVIADO: 'purple',
                EN_REPARTO: 'indigo',
                ENTREGADO: 'green',
                INTENTO_FALLIDO: 'red',
                RETRASADO: 'orange',
                DEVUELTO: 'gray',
                CANCELADO: 'red',
            },
            transitions: TRANSICIONES,
        };
    }
}