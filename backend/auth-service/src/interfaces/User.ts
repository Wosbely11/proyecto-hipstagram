export interface IUser {
    id?: string;
    username: string;
    email: string;
    password_hash: string;
    rol: 'ADMIN' | 'USER';
}