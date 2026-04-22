export interface UserPayload {
    id: string;
    rol: 'ADMIN' | 'USER';
    iat?: number;
    exp?: number;
}