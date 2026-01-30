export class IntentoBloqueadoModel {
    public id: string;
    public idVendedor: string;
    public idCliente: string | null;
    public fecha: Date;
    public motivo: string;
    public idProducto: string;
    public idLote: string | null;
    public cantidadIntento: number;
    public mensaje: string;

    constructor(
        id: string,
        idVendedor: string,
        fecha: Date,
        motivo: string,
        idProducto: string,
        cantidadIntento: number,
        mensaje: string,
        idCliente: string | null = null,
        idLote: string | null = null
    ) {
        this.id = id;
        this.idVendedor = idVendedor;
        this.idCliente = idCliente;
        this.fecha = new Date(fecha);
        this.motivo = motivo;
        this.idProducto = idProducto;
        this.idLote = idLote;
        this.cantidadIntento = cantidadIntento;
        this.mensaje = mensaje;
    }

    // Método para obtener el tipo de motivo en formato legible
    public getMotivoLegible(): string {
        const motivos: Record<string, string> = {
            'PRODUCTO_VENCIDO': 'Producto Vencido',
            'REQUIERE_RECETA': 'Requiere Receta Médica',
            'STOCK_INSUFICIENTE': 'Stock Insuficiente',
            'PRODUCTO_INACTIVO': 'Producto Inactivo'
        };
        return motivos[this.motivo] || this.motivo;
    }

    // Método para verificar si el intento fue reciente (últimas 24 horas)
    public esReciente(): boolean {
        const ahora = new Date();
        const diferencia = ahora.getTime() - this.fecha.getTime();
        const horas = diferencia / (1000 * 60 * 60);
        return horas <= 24;
    }

    // Método para obtener información formateada
    public getResumen(): string {
        return `${this.getMotivoLegible()} - ${this.cantidadIntento} unidades - ${this.fecha.toLocaleDateString()}`;
    }
}
