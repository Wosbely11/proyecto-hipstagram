export const extractHashtags = (descripcion: string): string[] => {
  return (descripcion || '')
    .split(' ')
    .filter(word => word.startsWith('#'))
    .map(tag => tag.replace('#', '').toLowerCase());
};
