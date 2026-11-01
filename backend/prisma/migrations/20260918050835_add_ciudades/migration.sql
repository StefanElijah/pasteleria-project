/*
  Warnings:

  - You are about to drop the column `ciudad` on the `direcciones` table. All the data in the column will be lost.
  - Added the required column `ciudadId` to the `comunas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "comunas" ADD COLUMN     "ciudadId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "direcciones" DROP COLUMN "ciudad",
ADD COLUMN     "ciudadId" TEXT;

-- CreateTable
CREATE TABLE "ciudades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ciudades_regionId_idx" ON "ciudades"("regionId");

-- CreateIndex
CREATE INDEX "ciudades_nombre_idx" ON "ciudades"("nombre");

-- CreateIndex
CREATE INDEX "comunas_ciudadId_idx" ON "comunas"("ciudadId");

-- CreateIndex
CREATE INDEX "direcciones_ciudadId_idx" ON "direcciones"("ciudadId");

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunas" ADD CONSTRAINT "comunas_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
