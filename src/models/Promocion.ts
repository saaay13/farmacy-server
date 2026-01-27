export class PromocionModel {
    public id: string;
    public idProducto: string;
    public porcentajeDescuento: number;
    public fechaInicio: Date;
    public fechaFin: Date;
    protected aprobada: boolean;

    constructor(id: string, idProducto: string, porcentajeDescuento: number, fechaInicio: Date, fechaFin: Date, aprobada: boolean) {
        this.id = id;
        this.idProducto = idProducto;
        this.porcentajeDescuento = porcentajeDescuento;
        this.fechaInicio = new Date(fechaInicio);
        this.fechaFin = new Date(fechaFin);
        this.aprobada = aprobada;
    }

    public estaVigente(): boolean {
        const today = new Date();
        return this.aprobada && today >= this.fechaInicio && today <= this.fechaFin;
    }

    public esAprobada(): boolean {
        return this.aprobada;
    }
}
