-- Crear secuencia para IDs de intentos bloqueados
CREATE SEQUENCE IF NOT EXISTS farmacy.sec_intento_bloqueado START 1;

-- Crear tabla intento_bloqueado
CREATE TABLE IF NOT EXISTS farmacy.intento_bloqueado (
    id VARCHAR PRIMARY KEY DEFAULT ('ib-' || nextval('farmacy.sec_intento_bloqueado'::regclass)),
    id_vendedor VARCHAR NOT NULL,
    id_cliente VARCHAR,
    fecha TIMESTAMP(6) NOT NULL DEFAULT NOW(),
    motivo VARCHAR NOT NULL,
    id_producto VARCHAR NOT NULL,
    id_lote VARCHAR,
    cantidad_intento INTEGER NOT NULL,
    mensaje TEXT NOT NULL,
    
    -- Foreign keys
    CONSTRAINT fk_intento_bloqueado_vendedor FOREIGN KEY (id_vendedor) REFERENCES farmacy.usuario(id),
    CONSTRAINT fk_intento_bloqueado_cliente FOREIGN KEY (id_cliente) REFERENCES farmacy.usuario(id),
    CONSTRAINT fk_intento_bloqueado_producto FOREIGN KEY (id_producto) REFERENCES farmacy.producto(id),
    CONSTRAINT fk_intento_bloqueado_lote FOREIGN KEY (id_lote) REFERENCES farmacy.lote(id)
);

-- Crear índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_intento_bloqueado_vendedor ON farmacy.intento_bloqueado(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_intento_bloqueado_producto ON farmacy.intento_bloqueado(id_producto);
CREATE INDEX IF NOT EXISTS idx_intento_bloqueado_motivo ON farmacy.intento_bloqueado(motivo);
CREATE INDEX IF NOT EXISTS idx_intento_bloqueado_fecha ON farmacy.intento_bloqueado(fecha DESC);

-- Comentarios para documentación
COMMENT ON TABLE farmacy.intento_bloqueado IS 'Registro de intentos de venta bloqueados por el sistema (productos vencidos, recetas, etc.)';
COMMENT ON COLUMN farmacy.intento_bloqueado.motivo IS 'Tipo de bloqueo: PRODUCTO_VENCIDO, REQUIERE_RECETA, STOCK_INSUFICIENTE, PRODUCTO_INACTIVO';
COMMENT ON COLUMN farmacy.intento_bloqueado.mensaje IS 'Mensaje detallado del motivo del bloqueo';
COMMENT ON COLUMN farmacy.intento_bloqueado.cantidad_intento IS 'Cantidad de unidades que se intentó vender';
