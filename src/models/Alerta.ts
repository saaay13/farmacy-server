export class AlertaModel {
    public id: string;
    public tipo: string; // 'expirado', 'stock_bajo', etc.
    public mensaje: string;
    public fecha: Date;
    public idProducto?: string | null;
    public idUsuario: string;

    constructor(id: string, tipo: string, mensaje: string, fecha: Date, idUsuario: string, idProducto?: string | null) {
        this.id = id;
        this.tipo = tipo;
        this.mensaje = mensaje;
        this.fecha = new Date(fecha);
        this.idUsuario = idUsuario;
        this.idProducto = idProducto;
    }

    public esPrioritaria(): boolean {
        return this.tipo === 'expirado';
    }
}
