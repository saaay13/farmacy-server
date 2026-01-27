export class VentaModel {
    public id: string;
    public idCliente?: string | null;
    public idVendedor: string;
    public fecha: Date;
    private total: number;
    public ventaError: boolean;

    constructor(id: string, idVendedor: string, fecha: Date, total: number, idCliente?: string | null, ventaError: boolean = false) {
        this.id = id;
        this.idVendedor = idVendedor;
        this.fecha = new Date(fecha);
        this.total = total;
        this.idCliente = idCliente;
        this.ventaError = ventaError;
    }

    public getTotal(): number {
        return this.total;
    }

    public marcarComoError(): void {
        this.ventaError = true;
    }
}
