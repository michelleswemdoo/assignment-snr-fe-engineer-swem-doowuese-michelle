export const cn = (
  ...classes: (string | number | boolean | object | undefined)[]
) => {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'string' || typeof cls === 'number') {
        return cls;
      }
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ') as string;
};
