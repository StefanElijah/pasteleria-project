export interface User {
    id: string;
    email: string;
    telefono?: string;
    avatar?: string;
    rol: 'ADMIN' | 'MODERADOR' | 'CLIENTE';
    estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    nombre: string;
    slug: string;
    descripcion?: string;
    precio: number;
    precioComparacion?: number;
    imagenPrincipal?: string;
    imagenes: string[];
    novedad: boolean;
    destacado: boolean;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
    categoriaId: string;
    categoria: Category;
}

export interface Category {
    id: string;
    nombre: string;
    slug: string;
    descripcion?: string;
    activo: boolean;
    ordenVisual?: number;
    padreId?: string;
    padre?: { id: string; nombre: string; slug?: string } | null;
    subcategorias?: Category[];
    productos?: Product[];
    _count?: { productos: number; subcategorias?: number };
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface Region {
    id: string;
    nombre: string;
    ciudades?: Ciudad[];
    comunas?: Comuna[];
}

export interface Ciudad {
    id: string;
    nombre: string;
    regionId: string;
    region?: Region;
}

export interface Comuna {
    id: string;
    nombre: string;
    regionId: string;
    ciudadId: string;
    region?: Region;
    ciudad?: Ciudad;
}

export interface Address {
    id: string;
    calle: string;
    numero: string;
    ciudadId?: string;
    ciudad?: Ciudad | null;
    codigoPostal?: string;
    telefono?: string;
    isDefault: boolean;
    tipoVivienda: 'CASA' | 'DEPARTAMENTO' | 'OFICINA' | 'LOCAL_COMERCIAL' | 'OTRO';
    comunaId: string;
    comuna: {
        id: string;
        nombre: string;
        region: {
            id: string;
            nombre: string;
        };
    };
    usuarioId?: string;
}

export interface OrderItem {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    total: number;
    productoId: string;
    producto: Product;
}

export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'FALLIDO' | 'CANCELADO' | 'REEMBOLSADO';

export interface Pago {
    id: string;
    proveedor: 'STRIPE' | 'MERCADO_PAGO' | 'FLOW' | 'WEBPAY';
    estado: EstadoPago;
    monto: number;
    moneda: string;
    metodoDetalle?: string | null;
    pagadoEn?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    id: string;
    numeroPedido: string;
    estado: 'PENDIENTE' | 'PREPARANDO' | 'ENVIADO' | 'EN_REPARTO' | 'ENTREGADO' | 'INTENTO_FALLIDO' | 'RETRASADO' | 'DEVUELTO' | 'CANCELADO';
    estadoPago: EstadoPago;
    pagadoEn?: string | null;
    transaccionId?: string | null;
    subtotal: number;
    costoEnvio: number;
    total: number;
    metodoPago: 'TARJETA' | 'TRANSFERENCIA' | 'EFECTIVO' | 'PAGO_ENTREGA';
    plataforma?: string;
    notas?: string;
    createdAt: string;
    updatedAt: string;
    primerNombreDestinatario: string;
    primerApellidoDestinatario: string;
    emailDestinatario: string;
    telefonoDestinatario: string;
    usuarioId?: string;
    direccionId: string;
    direccion: Address;
    items: OrderItem[];
    envio: Envio;
    pagos?: Pago[];
}

export interface Envio {
    id: string;
    numeroTracking?: string;
    metodoEnvio: string;
    empresaLogistica?: string;
    fechaEstimadaEntrega: string;
    fechaEntregada?: string;
    estadoEnvio: string;
    pedidoId: string;
    pedido?: Order;
    createdAt: string;
    updatedAt: string;
}

export interface Descuento {
    id: string;
    nombre: string;
    codigo?: string | null;
    tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'ENVIO_GRATIS';
    valor: number;
    objetivo: 'TODO' | 'PRODUCTOS_ESPECIFICOS' | 'CATEGORIAS_ESPECIFICAS';
    fechaInicio: string;
    fechaFin?: string | null;
    activo: boolean;
    valorMinimoPedido?: number | null;
    limiteUso?: number | null;
    limiteUsoPorUsuario?: number | null;
    contadorUso: number;
    usuarioId?: string | null;
    productos?: { id: string; nombre: string }[];
    categorias?: { id: string; nombre: string }[];
    createdAt: string;
}

export interface Promocion {
    id: string;
    nombre: string;
    bonoPorcentaje: number;
    objetivo: 'TODO' | 'PRODUCTOS' | 'CATEGORIAS';
    fechaInicio: string;
    fechaFin?: string | null;
    prioridad: number;
    activo: boolean;
    productos?: { id: string; nombre: string }[];
    categorias?: { id: string; nombre: string }[];
}

export interface MovimientoPuntos {
    id: string;
    tipo: 'BONO_BIENVENIDA' | 'COMPRA' | 'CANJE' | 'REVERSION' | 'EXPIRACION' | 'AJUSTE';
    puntos: number;
    saldoDespues: number;
    descripcion?: string | null;
    createdAt: string;
    expiraEn?: string | null;
}

export interface DevolucionItem {
    id: string;
    itemPedidoId: string;
    cantidad: number;
    subtotal: number;
    itemPedido?: { nombre: string; precio: number };
}

export interface Devolucion {
    id: string;
    pedidoId: string;
    estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA' | 'PROCESADA';
    motivo?: string | null;
    montoReembolsado: number;
    puntosRevertidos: number;
    puntosReintegrados: number;
    createdAt: string;
    items: DevolucionItem[];
    pedido?: { numeroPedido?: string; total?: number; estado?: string; emailDestinatario?: string };
}

export interface DashboardStats {
    kpis: {
        totalProducts: number;
        totalCategories: number;
        totalOrders: number;
        pendingOrders: number;
        totalEnvios: number;
        activeDiscounts: number;
        totalRevenue: number;
    };
    revenueByDay: { date: string; total: number }[];
    ordersByStatus: { estado: string; count: number }[];
    revenueByPlatform: { date: string; mobile: number; desktop: number }[];
    revenueByPaymentMethod: { date: string; tarjeta: number; transferencia: number; efectivo: number; pago_entrega: number }[];
    monthlyComparison: { label: string; añoActual: number; añoAnterior: number }[];
    topReservedProducts: { id: string; nombre: string; cantidad: number; imagenPrincipal?: string | null }[];
    revenueByCategory: { categoria: string; total: number }[];
    recentOrders: { id: string; numeroPedido: string; total: number; estado: string; createdAt: string }[];
}
