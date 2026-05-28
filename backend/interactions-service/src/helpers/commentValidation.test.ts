import { validateComment } from './commentValidation';

describe('validateComment', () => {
  it('acepta un comentario válido', () => {
    const result = validateComment('Muy buena foto!');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rechaza comentario vacío', () => {
    const result = validateComment('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('El comentario no puede estar vacío');
  });

  it('rechaza comentario con solo espacios', () => {
    const result = validateComment('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('El comentario no puede estar vacío');
  });

  it('rechaza comentario mayor a 128 caracteres', () => {
    const result = validateComment('a'.repeat(129));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('El comentario no puede superar los 128 caracteres');
  });

  it('acepta comentario con exactamente 128 caracteres', () => {
    const result = validateComment('a'.repeat(128));
    expect(result.valid).toBe(true);
  });

  it('acepta comentario con emojis y caracteres especiales', () => {
    const result = validateComment('Gran foto! 🔥 #viaje');
    expect(result.valid).toBe(true);
  });
});
