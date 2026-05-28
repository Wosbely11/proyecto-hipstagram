import { extractHashtags } from './hashtagParser';

describe('extractHashtags', () => {
  it('extrae hashtags de una descripción con texto mixto', () => {
    expect(extractHashtags('Foto bonita #viaje #playa hoy')).toEqual(['viaje', 'playa']);
  });

  it('convierte hashtags a minúsculas', () => {
    expect(extractHashtags('#FOTO #Verano')).toEqual(['foto', 'verano']);
  });

  it('retorna arreglo vacío si no hay hashtags', () => {
    expect(extractHashtags('Sin hashtags aquí')).toEqual([]);
  });

  it('retorna arreglo vacío para descripción vacía', () => {
    expect(extractHashtags('')).toEqual([]);
  });

  it('maneja undefined sin lanzar error', () => {
    expect(extractHashtags(undefined as any)).toEqual([]);
  });

  it('extrae un solo hashtag al inicio', () => {
    expect(extractHashtags('#naturaleza amanecer')).toEqual(['naturaleza']);
  });

  it('no confunde palabras internas con hashtags', () => {
    expect(extractHashtags('hola#mundo')).toEqual([]);
  });
});
