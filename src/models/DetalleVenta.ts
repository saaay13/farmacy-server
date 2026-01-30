export class DetalleVentaModel {
    public id: string;
    public idVenta: string;
    public idProducto: string;
    public idLote: string | null;
    public cantidad: number;
    public precioUnitario: number;
    private subtotal: number;

    constructor(id: string, idVenta: string, idProducto: string, idLote: string | null, cantidad: number, precioUnitario: number) {
        this.id = id;
        this.idVenta = idVenta;
        this.idProducto = idProducto;
        this.idLote = idLote;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = cantidad * precioUnitario;
    }

    public getSubtotal(): number {
        return this.subtotal;
    }
}
