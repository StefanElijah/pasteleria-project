-- Backfill: los pedidos anteriores al registro de plataforma quedaron en NULL.
-- Se asignan alternadamente MOBILE/DESKTOP (50/50) para que el dashboard tenga datos.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS rn
  FROM "pedidos"
  WHERE "plataforma" IS NULL
)
UPDATE "pedidos" AS p
SET "plataforma" = CASE WHEN r.rn % 2 = 1 THEN 'MOBILE' ELSE 'DESKTOP' END
FROM ranked AS r
WHERE p.id = r.id;
