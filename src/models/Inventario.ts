export class InventarioModel {
    public idProducto: string;
    public idSucursal: string;
    public stockTotal: number;
    public fechaRevision: Date;

    constructor(idProducto: string, idSucursal: string, stockTotal: number, fechaRevision: Date) {
        this.idProducto = idProducto;
        this.idSucursal = idSucursal;
        this.stockTotal = stockTotal;
        this.fechaRevision = new Date(fechaRevision);
    }

    public tieneStock(cantidad: number): boolean {
        return this.stockTotal >= cantidad;
    }

    public esStockCritico(limite: number = 10): boolean {
        return this.stockTotal < limite;
    }
}
