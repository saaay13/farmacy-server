export class LoteModel {
    public id: string;
    public idProducto: string;
    public fechaVencimiento: Date;
    public cantidad: number;
    public numeroLote: string;

    constructor(id: string, idProducto: string, fechaVencimiento: Date, cantidad: number, numeroLote: string) {
        this.id = id;
        this.idProducto = idProducto;
        this.fechaVencimiento = new Date(fechaVencimiento);
        this.cantidad = cantidad;
        this.numeroLote = numeroLote;
    }

    // Lógica de negocio encapsulada: Verificar si el lote está vencido
    public estaVencido(): boolean {
        const today = new Date();
        return this.fechaVencimiento < today;
    }

    // Verificar si vence en los próximos X días (ej. 60)
    public vencePronto(dias: number = 60): boolean {
        const today = new Date();
        const limitDate = new Date();
        limitDate.setDate(today.getDate() + dias);
        return this.fechaVencimiento <= limitDate && this.fechaVencimiento >= today;
    }
}
