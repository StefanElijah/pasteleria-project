-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'FALLIDO', 'CANCELADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "ProveedorPago" AS ENUM ('STRIPE', 'MERCADO_PAGO', 'FLOW', 'WEBPAY');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cartId" TEXT,
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "pagadoEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "proveedorRef" TEXT NOT NULL,
    "proveedorPagoId" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "metodoDetalle" TEXT,
    "payload" JSONB,
    "pagadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_eventos" (
    "id" TEXT NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "eventoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB,
    "procesadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagos_pedidoId_idx" ON "pagos"("pedidoId");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_proveedor_proveedorRef_key" ON "pagos"("proveedor", "proveedorRef");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_eventos_eventoId_key" ON "webhook_eventos"("eventoId");

-- CreateIndex
CREATE INDEX "webhook_eventos_proveedor_tipo_idx" ON "webhook_eventos"("proveedor", "tipo");

-- CreateIndex
CREATE INDEX "webhook_eventos_procesadoEn_idx" ON "webhook_eventos"("procesadoEn");

-- CreateIndex
CREATE INDEX "pedidos_estadoPago_idx" ON "pedidos"("estadoPago");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
