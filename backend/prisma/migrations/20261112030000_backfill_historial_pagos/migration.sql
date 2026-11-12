-- Los pedidos con tarjeta creados antes de la integración de pagos
-- se consideran pagados (excepto los cancelados) para no perder
-- el historial en los reportes.
UPDATE "pedidos"
SET "estadoPago" = 'PAGADO',
    "pagadoEn" = "createdAt"
WHERE "metodoPago" = 'TARJETA'
  AND "estado" <> 'CANCELADO'
  AND "estadoPago" = 'PENDIENTE';
