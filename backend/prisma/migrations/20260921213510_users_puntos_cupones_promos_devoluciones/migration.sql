-- CreateEnum
CREATE TYPE "TipoMovimientoPuntos" AS ENUM ('BONO_BIENVENIDA', 'COMPRA', 'CANJE', 'REVERSION', 'EXPIRACION', 'AJUSTE');

-- CreateEnum
CREATE TYPE "ObjetivoPromocion" AS ENUM ('TODO', 'PRODUCTOS', 'CATEGORIAS');

-- CreateEnum
CREATE TYPE "EstadoDevolucion" AS ENUM ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'PROCESADA');

-- AlterTable
ALTER TABLE "descuentos" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "puntosOtorgados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "puntosUsados" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "movimientos_puntos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "tipo" "TipoMovimientoPuntos" NOT NULL,
    "puntos" INTEGER NOT NULL,
    "saldoDespues" INTEGER NOT NULL,
    "descripcion" TEXT,
    "expiraEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones_puntos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "bonoPorcentaje" INTEGER NOT NULL,
    "objetivo" "ObjetivoPromocion" NOT NULL DEFAULT 'TODO',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promociones_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estado" "EstadoDevolucion" NOT NULL DEFAULT 'SOLICITADA',
    "motivo" TEXT,
    "montoReembolsado" INTEGER NOT NULL DEFAULT 0,
    "puntosRevertidos" INTEGER NOT NULL DEFAULT 0,
    "puntosReintegrados" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_items" (
    "id" TEXT NOT NULL,
    "devolucionId" TEXT NOT NULL,
    "itemPedidoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "devolucion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoriaToPromocionPuntos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoriaToPromocionPuntos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductoToPromocionPuntos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductoToPromocionPuntos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "movimientos_puntos_usuarioId_idx" ON "movimientos_puntos"("usuarioId");

-- CreateIndex
CREATE INDEX "movimientos_puntos_expiraEn_idx" ON "movimientos_puntos"("expiraEn");

-- CreateIndex
CREATE INDEX "promociones_puntos_activo_fechaInicio_fechaFin_idx" ON "promociones_puntos"("activo", "fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "devoluciones_pedidoId_idx" ON "devoluciones"("pedidoId");

-- CreateIndex
CREATE INDEX "devoluciones_estado_idx" ON "devoluciones"("estado");

-- CreateIndex
CREATE INDEX "devolucion_items_devolucionId_idx" ON "devolucion_items"("devolucionId");

-- CreateIndex
CREATE INDEX "_CategoriaToPromocionPuntos_B_index" ON "_CategoriaToPromocionPuntos"("B");

-- CreateIndex
CREATE INDEX "_ProductoToPromocionPuntos_B_index" ON "_ProductoToPromocionPuntos"("B");

-- CreateIndex
CREATE INDEX "descuentos_usuarioId_idx" ON "descuentos"("usuarioId");

-- AddForeignKey
ALTER TABLE "descuentos" ADD CONSTRAINT "descuentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_items" ADD CONSTRAINT "devolucion_items_devolucionId_fkey" FOREIGN KEY ("devolucionId") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_items" ADD CONSTRAINT "devolucion_items_itemPedidoId_fkey" FOREIGN KEY ("itemPedidoId") REFERENCES "items_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaToPromocionPuntos" ADD CONSTRAINT "_CategoriaToPromocionPuntos_A_fkey" FOREIGN KEY ("A") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaToPromocionPuntos" ADD CONSTRAINT "_CategoriaToPromocionPuntos_B_fkey" FOREIGN KEY ("B") REFERENCES "promociones_puntos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductoToPromocionPuntos" ADD CONSTRAINT "_ProductoToPromocionPuntos_A_fkey" FOREIGN KEY ("A") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductoToPromocionPuntos" ADD CONSTRAINT "_ProductoToPromocionPuntos_B_fkey" FOREIGN KEY ("B") REFERENCES "promociones_puntos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
