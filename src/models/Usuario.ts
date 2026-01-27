export class UsuarioModel {
    public id: string;
    public nombre: string;
    public email: string;
    protected rol: string;
    public avatarUrl?: string | null;
    private password: string;

    constructor(id: string, nombre: string, email: string, rol: string, password: string, avatarUrl?: string | null) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol;
        this.password = password;
        this.avatarUrl = avatarUrl;
    }

    // Método público para verificar si el usuario es administrador
    public esAdmin(): boolean {
        return this.rol === 'admin';
    }

    // Método para obtener el rol (lectura protegida)
    public getRol(): string {
        return this.rol;
    }
}
