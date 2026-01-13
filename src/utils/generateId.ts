type CreateIdOptions = {
  length?: number;
  lowercase?: boolean;
  uppercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
};

export const generateId = (options: CreateIdOptions = {}): string => {
  const {
    length = 11,
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = false,
  } = options;

  const alphabet = [
    lowercase && 'abcdefghijklmnopqrstuvwxyz',
    uppercase && 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers && '0123456789',
    symbols && '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ]
    .filter(Boolean)
    .join('');

  if (!alphabet.length) {
    throw new Error('createId: at least one character set must be enabled');
  }

  let id = '';

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * alphabet.length);
    id += alphabet[index];
  }

  return `field-${Date.now()}-${id}`;
};
