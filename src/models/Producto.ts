export class ProductoModel {
    public id: string;
    public nombre: string;
    public descripcion?: string | null;
    protected estado: string;
    public requiereReceta: boolean;
    public idCategoria: string;
    public imageUrl?: string | null;
    private precioBase: number;

    constructor(
        id: string,
        nombre: string,
        estado: string,
        precio: number,
        requiereReceta: boolean,
        idCategoria: string,
        descripcion?: string | null,
        imageUrl?: string | null
    ) {
        this.id = id;
        this.nombre = nombre;
        this.estado = estado;
        this.precioBase = precio;
        this.requiereReceta = requiereReceta;
        this.idCategoria = idCategoria;
        this.descripcion = descripcion;
        this.imageUrl = imageUrl;
    }

    // Método Público: Calcular precio con descuento
    public calcularPrecioFinal(descuentoPorcentaje: number = 0): number {
        const factor = 1 - (descuentoPorcentaje / 100);
        return Number((this.precioBase * factor).toFixed(2));
    }

    // Método Público para el Administrador: Activar promoción
    public activarPromocion(): void {
        this.estado = 'promocion';
    }

    // Método Público: Validar si un cliente puede comprarlo
    public puedeSerCompradoPor(rolUsuario: string): boolean {
        if (this.requiereReceta && rolUsuario === 'cliente') {
            return false;
        }
        return true;
    }

    // Lectura del estado actual
    public getEstado(): string {
        return this.estado;
    }
}
