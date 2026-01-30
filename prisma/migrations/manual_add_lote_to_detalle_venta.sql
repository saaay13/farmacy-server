-- Migración: Agregar trazabilidad de lotes en detalles de venta
-- Fecha: 2026-01-29
-- Descripción: Agrega columna id_lote a detalle_venta para registrar qué lote específico se vendió

-- Agregar columna id_lote a detalle_venta
ALTER TABLE farmacy.detalle_venta 
ADD COLUMN id_lote VARCHAR;

-- Agregar foreign key constraint
ALTER TABLE farmacy.detalle_venta
ADD CONSTRAINT fk_detalle_venta_lote 
FOREIGN KEY (id_lote) REFERENCES farmacy.lote(id);

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX idx_detalle_venta_lote 
ON farmacy.detalle_venta(id_lote);

-- Comentario para documentación
COMMENT ON COLUMN farmacy.detalle_venta.id_lote 
IS 'ID del lote específico vendido en este detalle (trazabilidad FIFO)';
