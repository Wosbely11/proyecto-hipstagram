export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateComment = (texto: string): ValidationResult => {
  if (!texto || texto.trim().length === 0) {
    return { valid: false, error: 'El comentario no puede estar vacío' };
  }
  if (texto.length > 128) {
    return { valid: false, error: 'El comentario no puede superar los 128 caracteres' };
  }
  return { valid: true };
};
