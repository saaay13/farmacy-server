-- SQL Migration: Add id_sucursal to lote table
ALTER TABLE farmacy.lote
ADD COLUMN id_sucursal VARCHAR;

-- Add foreign key constraint
ALTER TABLE farmacy.lote
ADD CONSTRAINT fk_lote_sucursal
FOREIGN KEY (id_sucursal) REFERENCES farmacy.sucursal(id_sucursal);

-- Create index for performance
CREATE INDEX idx_lote_sucursal ON farmacy.lote(id_sucursal);

-- Update existing batches to Sucursal 1 (default) if exists
-- This is a safe assumption for current single-branch data
UPDATE farmacy.lote
SET id_sucursal = (SELECT id_sucursal FROM farmacy.sucursal LIMIT 1)
WHERE id_sucursal IS NULL;

COMMENT ON COLUMN farmacy.lote.id_sucursal IS 'ID de la sucursal donde se encuentra físicamente este lote';
