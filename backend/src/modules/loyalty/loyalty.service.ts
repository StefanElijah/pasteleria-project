import { Injectable, Inject, BadRequestException } from '@nestjs/common';

// Configuración del programa de puntos
export const PUNTOS_POR_PESO = 100; // 1 punto por cada $100 pagados
export const CANJE_MINIMO = 500; // mínimo de puntos para canjear
export const CANJE_TOPE_PORCENTAJE = 50; // máximo % del subtotal cubierto con puntos
export const TOPE_MULTIPLICADOR = 3; // tope global de bonos (x3)
export const EXPIRACION_MESES = 12;

export const NIVELES = {
    BRONCE: { nombre: 'Bronce', umbral: 0, bono: 0 },
    PLATA: { nombre: 'Plata', umbral: 150000, bono: 50 },
    ORO: { nombre: 'Oro', umbral: 400000, bono: 100 },
};

@Injectable()
export class LoyaltyService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    // ---------------------------------------------------------------
    // Perfil / saldo
    // ---------------------------------------------------------------
    async getOrCreatePerfil(usuarioId: string) {
        const existing = await this.prisma.perfilCliente.findUnique({ where: { usuarioId } });
        if (existing) return existing;
        return this.prisma.perfilCliente.create({ data: { usuarioId } });
    }

    async getSaldo(usuarioId: string) {
        const perfil = await this.getOrCreatePerfil(usuarioId);
        const raw: number = perfil.puntos || 0;
        return {
            puntos: raw,
            saldo: Math.max(0, raw),
            deuda: Math.min(0, raw), // negativo si debe compensar
        };
    }

    // ---------------------------------------------------------------
    // Nivel (gasto ENTREGADO últimos 12 meses)
    // ---------------------------------------------------------------
    async getNivel(usuarioId: string) {
        const desde = new Date();
        desde.setMonth(desde.getMonth() - 12);

        const agg = await this.prisma.pedido.aggregate({
            _sum: { total: true },
            where: {
                usuarioId,
                estado: 'ENTREGADO',
                createdAt: { gte: desde },
            },
        });

        const gasto: number = agg._sum.total || 0;
        let nivel = NIVELES.BRONCE;
        if (gasto >= NIVELES.ORO.umbral) nivel = NIVELES.ORO;
        else if (gasto >= NIVELES.PLATA.umbral) nivel = NIVELES.PLATA;

        return { ...nivel, gasto };
    }

    // ---------------------------------------------------------------
    // Promociones
    // ---------------------------------------------------------------
    async getPromosVigentes() {
        const ahora = new Date();
        return this.prisma.promocionPuntos.findMany({
            where: {
                activo: true,
                fechaInicio: { lte: ahora },
                OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
            },
            include: { productos: { select: { id: true } }, categorias: { select: { id: true } } },
        });
    }

    /**
     * Regla C: la promo más específica gana (PRODUCTOS > CATEGORIAS > TODO).
     * Desempate: mayor bonoPorcentaje y luego mayor prioridad.
     * No acumulable (una sola por ítem).
     */
    private mejorPromoParaItem(
        item: { productoId: string; categoriaId?: string },
        promos: any[],
    ): any | null {
        const candidatas = promos.filter((promo) => {
            if (promo.objetivo === 'TODO') return true;
            if (promo.objetivo === 'PRODUCTOS') {
                return promo.productos.some((p: any) => p.id === item.productoId);
            }
            if (promo.objetivo === 'CATEGORIAS') {
                return item.categoriaId
                    ? promo.categorias.some((c: any) => c.id === item.categoriaId)
                    : false;
            }
            return false;
        });

        if (candidatas.length === 0) return null;

        const peso = (p: any) => (p.objetivo === 'PRODUCTOS' ? 3 : p.objetivo === 'CATEGORIAS' ? 2 : 1);

        candidatas.sort((a, b) => {
            if (peso(b) !== peso(a)) return peso(b) - peso(a);
            if (b.bonoPorcentaje !== a.bonoPorcentaje) return b.bonoPorcentaje - a.bonoPorcentaje;
            return (b.prioridad || 0) - (a.prioridad || 0);
        });

        return candidatas[0];
    }

    // ---------------------------------------------------------------
    // Cálculo de puntos de un pedido
    // ---------------------------------------------------------------
    async calcularPuntosPedido(pedido: any): Promise<{ puntos: number; detalle: any[] }> {
        const items = await this.prisma.itemPedido.findMany({
            where: { pedidoId: pedido.id },
            include: { producto: { select: { id: true, categoriaId: true } } },
        });

        const promos = await this.getPromosVigentes();

        // Bonos globales aditivos (porcentaje)
        let bonoGlobal = 0;
        const motivos: string[] = [];

        const entregadosPrevios = await this.prisma.pedido.count({
            where: { usuarioId: pedido.usuarioId, estado: 'ENTREGADO', id: { not: pedido.id } },
        });
        if (entregadosPrevios === 0) {
            bonoGlobal += 100;
            motivos.push('primera compra +100%');
        }

        const perfil = pedido.usuarioId ? await this.getOrCreatePerfil(pedido.usuarioId) : null;
        if (perfil?.fechaNacimiento) {
            const hoy = new Date();
            const cumple = new Date(perfil.fechaNacimiento);
            if (hoy.getMonth() === cumple.getMonth()) {
                bonoGlobal += 100;
                motivos.push('cumpleaños +100%');
            }
        }

        if (pedido.usuarioId) {
            const nivel = await this.getNivel(pedido.usuarioId);
            if (nivel.bono > 0) {
                bonoGlobal += nivel.bono;
                motivos.push(`nivel ${nivel.nombre} +${nivel.bono}%`);
            }
        }

        // Base: monto realmente pagado en productos (sin envío, sin puntos)
        const montoBase = Math.max(0, (pedido.subtotal || 0) - (pedido.descuentoMonto || 0));
        const subtotal = pedido.subtotal || 0;
        const factor = subtotal > 0 ? montoBase / subtotal : 0;

        let total = 0;
        const detalle: any[] = [];

        for (const item of items) {
            const promo = this.mejorPromoParaItem(
                { productoId: item.productoId, categoriaId: item.producto?.categoriaId },
                promos,
            );
            const bonoPromo = promo ? promo.bonoPorcentaje : 0;
            const multiplicador = Math.min(TOPE_MULTIPLICADOR, 1 + (bonoGlobal + bonoPromo) / 100);

            const baseItem = item.total * factor;
            const pts = Math.floor((baseItem / PUNTOS_POR_PESO) * multiplicador);
            total += pts;
            detalle.push({
                itemId: item.id,
                nombre: item.nombre,
                puntos: pts,
                promo: promo?.nombre || null,
            });
        }

        return { puntos: total, detalle };
    }

    async otorgarPuntos(pedidoId: string) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedido || !pedido.usuarioId) return null;
        if (pedido.puntosOtorgados > 0) return null; // ya otorgado

        const descuentoMonto = await this.calcularDescuentoMonto(pedido);
        const { puntos } = await this.calcularPuntosPedido({ ...pedido, descuentoMonto });
        if (puntos <= 0) return null;

        const expiraEn = new Date();
        expiraEn.setMonth(expiraEn.getMonth() + EXPIRACION_MESES);

        return this.aplicarMovimiento(pedido.usuarioId, puntos, 'COMPRA', {
            pedidoId,
            descripcion: `Puntos por pedido ${pedido.numeroPedido}`,
            expiraEn,
            actualizarPedido: true,
        });
    }

    async revertirPuntos(pedidoId: string, montoDevuelto: number, subtotal: number) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedido || !pedido.usuarioId || pedido.puntosOtorgados <= 0) return 0;
        if (subtotal <= 0) return 0;

        const proporcional = Math.floor(pedido.puntosOtorgados * (montoDevuelto / subtotal));
        if (proporcional <= 0) return 0;

        await this.aplicarMovimiento(pedido.usuarioId, -proporcional, 'REVERSION', {
            pedidoId,
            descripcion: `Reversión por devolución del pedido ${pedido.numeroPedido}`,
        });
        await this.prisma.pedido.update({
            where: { id: pedidoId },
            data: { puntosOtorgados: Math.max(0, pedido.puntosOtorgados - proporcional) },
        });
        return proporcional;
    }

    async reintegrarPuntos(usuarioId: string, puntos: number, descripcion: string, pedidoId?: string) {
        if (puntos <= 0) return 0;
        await this.aplicarMovimiento(usuarioId, puntos, 'AJUSTE', { pedidoId, descripcion });
        return puntos;
    }

    // Bono único de bienvenida al registrarse
    async bonificarBienvenida(usuarioId: string) {
        await this.getOrCreatePerfil(usuarioId);
        const existente = await this.prisma.movimientoPuntos.findFirst({
            where: { usuarioId, tipo: 'BONO_BIENVENIDA' },
        });
        if (existente) return 0;

        const expiraEn = new Date();
        expiraEn.setMonth(expiraEn.getMonth() + EXPIRACION_MESES);
        await this.aplicarMovimiento(usuarioId, 500, 'BONO_BIENVENIDA', {
            descripcion: 'Bono de bienvenida (500 puntos)',
            expiraEn,
        });
        return 500;
    }

    async canjearPuntos(usuarioId: string, puntos: number, subtotal: number) {
        if (puntos <= 0) return 0;
        const { saldo } = await this.getSaldo(usuarioId);
        if (puntos < CANJE_MINIMO) {
            throw new BadRequestException(`El mínimo para canjear es ${CANJE_MINIMO} puntos`);
        }
        if (puntos > saldo) {
            throw new BadRequestException('No tienes puntos suficientes');
        }
        const tope = Math.floor((subtotal * CANJE_TOPE_PORCENTAJE) / 100);
        if (puntos > tope) {
            throw new BadRequestException(`Los puntos pueden cubrir hasta el ${CANJE_TOPE_PORCENTAJE}% del subtotal (${tope} puntos)`);
        }
        return puntos;
    }

    async expirarPuntos() {
        const ahora = new Date();
        const vencidos: any[] = await this.prisma.movimientoPuntos.findMany({
            where: { expiraEn: { lte: ahora }, puntos: { gt: 0 }, tipo: 'COMPRA' },
        });
        for (const mov of vencidos) {
            // Evitar doble expiración
            const yaExpirado = await this.prisma.movimientoPuntos.findFirst({
                where: { usuarioId: mov.usuarioId, descripcion: `Expiración movimiento ${mov.id}` },
            });
            if (yaExpirado) continue;
            await this.aplicarMovimiento(mov.usuarioId, -mov.puntos, 'EXPIRACION', {
                descripcion: `Expiración movimiento ${mov.id}`,
            });
        }
    }

    async getMovimientos(usuarioId: string) {
        return this.prisma.movimientoPuntos.findMany({
            where: { usuarioId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private async calcularDescuentoMonto(pedido: any): Promise<number> {
        if (!pedido.descuentoId) return 0;
        const desc = await this.prisma.descuento.findUnique({ where: { id: pedido.descuentoId } });
        if (!desc) return 0;
        if (desc.tipo === 'PORCENTAJE') return Math.round((pedido.subtotal * desc.valor) / 100);
        if (desc.tipo === 'MONTO_FIJO') return Math.min(desc.valor, pedido.subtotal);
        return 0;
    }

    private async aplicarMovimiento(
        usuarioId: string,
        puntos: number,
        tipo: string,
        opts: { pedidoId?: string; descripcion?: string; expiraEn?: Date; actualizarPedido?: boolean } = {},
    ) {
        const perfil = await this.getOrCreatePerfil(usuarioId);
        const nuevoSaldo = (perfil.puntos || 0) + puntos;

        await this.prisma.perfilCliente.update({
            where: { usuarioId },
            data: { puntos: nuevoSaldo },
        });

        const movimiento = await this.prisma.movimientoPuntos.create({
            data: {
                usuarioId,
                pedidoId: opts.pedidoId || null,
                tipo,
                puntos,
                saldoDespues: nuevoSaldo,
                descripcion: opts.descripcion || null,
                expiraEn: opts.expiraEn || null,
            },
        });

        if (opts.actualizarPedido && opts.pedidoId && puntos > 0) {
            await this.prisma.pedido.update({
                where: { id: opts.pedidoId },
                data: { puntosOtorgados: puntos },
            });
        }

        return movimiento;
    }
}
