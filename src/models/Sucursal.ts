export class SucursalModel {
    public idSucursal: string;
    public nombre: string;
    public direccion: string;

    constructor(id: string, nombre: string, direccion: string) {
        this.idSucursal = id;
        this.nombre = nombre;
        this.direccion = direccion;
    }

    public getDetalles(): string {
        return `Sucursal: ${this.nombre} - Dirección: ${this.direccion}`;
    }
}
