import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CartService {
    private readonly CART_TTL = 60 * 60 * 24 * 30; // 30 días

    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        @Inject('PrismaClient') private readonly prisma: any,
    ) { }

    private getCartKey(cartId: string): string {
        return `cart:${cartId}`;
    }

    async getCart(cartId: string) {
        const key = this.getCartKey(cartId);
        const data = await this.redis.get(key);
        if (!data) return { items: [], total: 0 };
        return JSON.parse(data);
    }

    async addItem(cartId: string, productId: string, quantity: number) {
        if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');
        const cart = await this.getCart(cartId);
        const product = await this.prisma.producto.findUnique({
            where: { id: productId, activo: true },
        });
        if (!product) throw new NotFoundException('Producto no disponible');

        const existingIndex = cart.items.findIndex(item => item.productId === productId);
        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: product.id,
                name: product.nombre,
                price: product.precio,
                quantity,
                image: product.imagenPrincipal || product.imagenes?.[0] || null,
            });
        }
        cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await this.redis.setex(this.getCartKey(cartId), this.CART_TTL, JSON.stringify(cart));
        return cart;
    }

    async removeItem(cartId: string, productId: string) {
        const cart = await this.getCart(cartId);
        const newItems = cart.items.filter(item => item.productId !== productId);
        if (newItems.length === cart.items.length) throw new NotFoundException('Producto no encontrado en el carrito');
        cart.items = newItems;
        cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await this.redis.setex(this.getCartKey(cartId), this.CART_TTL, JSON.stringify(cart));
        return cart;
    }

    async updateQuantity(cartId: string, productId: string, quantity: number) {
        if (quantity < 0) throw new BadRequestException('La cantidad no puede ser negativa');
        if (quantity === 0) return this.removeItem(cartId, productId);
        const cart = await this.getCart(cartId);
        const item = cart.items.find(item => item.productId === productId);
        if (!item) throw new NotFoundException('Producto no encontrado en el carrito');
        item.quantity = quantity;
        cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await this.redis.setex(this.getCartKey(cartId), this.CART_TTL, JSON.stringify(cart));
        return cart;
    }

    async clearCart(cartId: string) {
        await this.redis.del(this.getCartKey(cartId));
    }

    async applyDiscount(cartId: string, codigo: string, userId?: string) {
        const cart = await this.getCart(cartId);
        if (!cart.items.length) throw new BadRequestException('El carrito está vacío');
        if (cart.discount) throw new BadRequestException('Ya hay un descuento aplicado');

        const descuento = await this.prisma.descuento.findUnique({
            where: { codigo, activo: true },
            include: { productos: true, categorias: true },
        });
        if (!descuento) throw new NotFoundException('Cupón no válido o expirado');
        // Cupón personal: solo su dueño puede usarlo
        if (descuento.usuarioId && descuento.usuarioId !== userId) {
            throw new BadRequestException('Este cupón no está disponible para tu cuenta');
        }
        if (descuento.fechaFin && descuento.fechaFin < new Date()) throw new BadRequestException('El cupón ha expirado');
        if (descuento.valorMinimoPedido && cart.total < descuento.valorMinimoPedido) {
            throw new BadRequestException(`El pedido mínimo para este cupón es $${descuento.valorMinimoPedido.toLocaleString()}`);
        }
        if (descuento.limiteUso && descuento.contadorUso >= descuento.limiteUso) {
            throw new BadRequestException('El cupón ha alcanzado su límite de uso');
        }
        if (descuento.limiteUsoPorUsuario && userId) {
            const usosPorUsuario = await this.prisma.descuentoUso.count({
                where: { descuentoId: descuento.id, usuarioId: userId },
            });
            if (usosPorUsuario >= descuento.limiteUsoPorUsuario) {
                throw new BadRequestException('Ya has alcanzado el límite de usos de este cupón');
            }
        }

        let applicableSubtotal = 0;
        if (descuento.objetivo === 'TODO') {
            applicableSubtotal = cart.total;
        } else if (descuento.objetivo === 'PRODUCTOS_ESPECIFICOS') {
            const productIds = new Set(descuento.productos.map(p => p.id));
            applicableSubtotal = cart.items
                .filter(item => productIds.has(item.productId))
                .reduce((sum, item) => sum + item.price * item.quantity, 0);
        } else if (descuento.objetivo === 'CATEGORIAS_ESPECIFICAS') {
            const productIds = new Set(descuento.productos.map(p => p.id));
            const categoriaIds = new Set(descuento.categorias.map(c => c.id));
            const productsWithCategories = await this.prisma.producto.findMany({
                where: {
                    id: { in: cart.items.map(i => i.productId) },
                },
                select: { id: true, categoriaId: true },
            });
            const eligibleProductIds = new Set(
                productsWithCategories
                    .filter(p => categoriaIds.has(p.categoriaId) || productIds.has(p.id))
                    .map(p => p.id)
            );
            applicableSubtotal = cart.items
                .filter(item => eligibleProductIds.has(item.productId))
                .reduce((sum, item) => sum + item.price * item.quantity, 0);
        }

        if (applicableSubtotal <= 0) throw new BadRequestException('Este cupón no aplica a los productos en tu carrito');

        let discountAmount = 0;
        if (descuento.tipo === 'PORCENTAJE') {
            discountAmount = Math.round((applicableSubtotal * descuento.valor) / 100);
        } else if (descuento.tipo === 'MONTO_FIJO') {
            discountAmount = Math.min(descuento.valor, applicableSubtotal);
        } else if (descuento.tipo === 'ENVIO_GRATIS') {
            discountAmount = 0;
        }

        const subtotal = cart.total;
        const total = subtotal - discountAmount;

        cart.subtotal = subtotal;
        cart.discount = {
            id: descuento.id,
            codigo: descuento.codigo,
            nombre: descuento.nombre,
            tipo: descuento.tipo,
            valor: descuento.valor,
            amount: discountAmount,
            envioGratis: descuento.tipo === 'ENVIO_GRATIS',
        };
        cart.total = total;

        await this.redis.setex(this.getCartKey(cartId), this.CART_TTL, JSON.stringify(cart));
        return cart;
    }

    async removeDiscount(cartId: string) {
        const cart = await this.getCart(cartId);
        if (!cart.discount) throw new BadRequestException('No hay descuento aplicado');
        cart.total = cart.subtotal || cart.total;
        delete cart.subtotal;
        delete cart.discount;
        await this.redis.setex(this.getCartKey(cartId), this.CART_TTL, JSON.stringify(cart));
        return cart;
    }

    async mergeCarts(anonCartId: string, userId: string) {
        const anonCart = await this.getCart(anonCartId);
        if (!anonCart.items.length) return;
        const userCartKey = `cart:user:${userId}`;
        let userCart = await this.getCart(userCartKey);
        // Fusionar items (sumar cantidades)
        for (const anonItem of anonCart.items) {
            const existing = userCart.items.find(i => i.productId === anonItem.productId);
            if (existing) existing.quantity += anonItem.quantity;
            else userCart.items.push(anonItem);
        }
        userCart.total = userCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await this.redis.setex(userCartKey, this.CART_TTL, JSON.stringify(userCart));
        await this.redis.del(this.getCartKey(anonCartId));
    }
}