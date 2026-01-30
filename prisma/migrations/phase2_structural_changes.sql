-- Phase 2: Structural changes for real multi-branch support

-- 1. Update Inventario Primary Key to handle multiple locations per product
-- First, drop the old primary key constraint
ALTER TABLE farmacy.inventario DROP CONSTRAINT IF EXISTS pk_inventario;

-- Add the new compound primary key
ALTER TABLE farmacy.inventario ADD CONSTRAINT pk_inventario_sucursal PRIMARY KEY (id_producto, id_sucursal);

-- 2. Update Usuario table to link staff to a specific branch
ALTER TABLE farmacy.usuario ADD COLUMN id_sucursal VARCHAR;

-- Add foreign key constraint to sucursal
ALTER TABLE farmacy.usuario 
ADD CONSTRAINT fk_usuario_sucursal 
FOREIGN KEY (id_sucursal) REFERENCES farmacy.sucursal(id_sucursal);

-- Assign existing users to the first available branch as a default
UPDATE farmacy.usuario 
SET id_sucursal = (SELECT id_sucursal FROM farmacy.sucursal LIMIT 1) 
WHERE id_sucursal IS NULL;

-- 3. Ensure Lote table indexing is optimized for branch-based sales
CREATE INDEX IF NOT EXISTS idx_lote_producto_sucursal ON farmacy.lote(id_producto, id_sucursal);

COMMENT ON COLUMN farmacy.usuario.id_sucursal IS 'ID de la sucursal asignada al usuario (vendedores/vendedores)';
