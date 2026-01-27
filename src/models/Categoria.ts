export class CategoriaModel {
    public id: string;
    public nombre: string;

    constructor(id: string, nombre: string) {
        this.id = id;
        this.nombre = nombre;
    }

    // Ejemplo de lógica futura: Validar si el nombre es apto para reportes
    public getNombreFormateado(): string {
        return this.nombre.toUpperCase();
    }
}
