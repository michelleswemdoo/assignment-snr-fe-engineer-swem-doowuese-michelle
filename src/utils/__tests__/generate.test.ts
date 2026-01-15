import { describe, it, expect } from 'vitest';
import { generateId } from '../generateId';

describe('generateId', () => {
  it('generates an ID with default options', () => {
    const id = generateId();
    expect(id).toMatch(/^field-\d+-[a-zA-Z0-9]{11}$/);
  });

  it('generates IDs with custom length', () => {
    const id = generateId({ length: 5 });
    const match = id.match(/^field-\d+-([a-zA-Z0-9]+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(5);
    }
  });

  it('generates ID with only lowercase letters', () => {
    const id = generateId({
      lowercase: true,
      uppercase: false,
      numbers: false,
    });
    const match = id.match(/^field-\d+-([a-z]+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(11);
    }
  });

  it('generates ID with only uppercase letters', () => {
    const id = generateId({
      lowercase: false,
      uppercase: true,
      numbers: false,
    });
    const match = id.match(/^field-\d+-([A-Z]+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(11);
    }
  });

  it('generates ID with only numbers', () => {
    const id = generateId({
      lowercase: false,
      uppercase: false,
      numbers: true,
    });
    const match = id.match(/^field-\d+-([0-9]+)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toHaveLength(11);
  });

  it('generates ID with symbols when enabled', () => {
    const id = generateId({ symbols: true, length: 20 });
    const match = id.match(/^field-\d+-(.+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(20);
      expect(match[1]).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    }
  });

  it('generates unique IDs on consecutive calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('includes timestamp in ID', () => {
    const id = generateId();
    const timestamp = parseInt(id.split('-')[1]);
    expect(timestamp).toBeGreaterThan(0);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('prefixes ID with "field-"', () => {
    const id = generateId();
    expect(id).toMatch(/^field-/);
  });

  it('handles zero length', () => {
    const id = generateId({ length: 0 });
    expect(id).toMatch(/^field-\d+-$/);
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[parts.length - 1]).toBe('');
  });

  it('handles large length values', () => {
    const id = generateId({ length: 100 });
    const match = id.match(/^field-\d+-([a-zA-Z0-9]+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(100);
    }
  });

  it('throws error when all character sets are disabled', () => {
    expect(() => {
      generateId({
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
      });
    }).toThrow('createId: at least one character set must be enabled');
  });

  it('generates ID with mixed character sets', () => {
    const id = generateId({
      lowercase: true,
      uppercase: true,
      numbers: true,
      length: 50,
    });
    const match = id.match(/^field-\d+-([a-zA-Z0-9]+)$/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toHaveLength(50);
    }
  });

  it('generates ID with lowercase and symbols only', () => {
    const id = generateId({
      lowercase: true,
      uppercase: false,
      numbers: false,
      symbols: true,
      length: 20,
    });
    const match = id.match(/^field-\d+-(.+)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toHaveLength(20);
  });

  it('handles empty options object', () => {
    const id = generateId({});
    expect(id).toMatch(/^field-\d+-[a-zA-Z0-9]{11}$/);
  });

  it('generates different IDs even with same options', () => {
    const options = { length: 10 };
    const id1 = generateId(options);
    const id2 = generateId(options);
    expect(id1).not.toBe(id2);
  });
});
