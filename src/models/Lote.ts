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

    // Lógica de negocio    // Método Público: Verificar si está vencido
    public estaVencido(): boolean {
        const hoy = new Date();
        return this.fechaVencimiento < hoy;
    }

    // Método Público: Verificar si está próximo a vencer
    public estaProximoAVencer(dias: number = 60): boolean {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + dias);
        return this.fechaVencimiento <= limite && !this.estaVencido();
    }

    // Verificar si vence en los próximos X días (ej. 60)
    public vencePronto(dias: number = 60): boolean {
        const today = new Date();
        const limitDate = new Date();
        limitDate.setDate(today.getDate() + dias);
        return this.fechaVencimiento <= limitDate && this.fechaVencimiento >= today;
    }
}
