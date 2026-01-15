import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('joins string classes', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('handles single string', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('handles empty string', () => {
    expect(cn('')).toBe('');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', 'bar', 'baz', undefined)).toBe('foo bar baz');
  });

  it('handles number values', () => {
    expect(cn('foo', 1, 'bar', 2)).toBe('foo 1 bar 2');
  });

  it('filters out boolean values (not strings, numbers, or objects)', () => {
    expect(cn('foo', true, 'bar', false)).toBe('foo bar');
  });

  it('handles object with truthy values', () => {
    expect(cn('foo', { bar: true, baz: true, qux: false })).toBe('foo bar baz');
  });

  it('handles object with all falsy values', () => {
    expect(cn('foo', { bar: false, baz: false })).toBe('foo');
  });

  it('handles empty object', () => {
    expect(cn('foo', {})).toBe('foo');
  });

  it('handles multiple objects', () => {
    expect(cn('foo', { bar: true }, { baz: true, qux: false })).toBe(
      'foo bar baz',
    );
  });

  it('handles mixed types', () => {
    expect(cn('foo', 'bar', { baz: true }, 'qux', { quux: false })).toBe(
      'foo bar baz qux',
    );
  });

  it('handles nested arrays (spread)', () => {
    expect(cn('foo', ...['bar', 'baz'])).toBe('foo bar baz');
  });

  it('handles conditional classes with objects', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', { active: isActive, disabled: isDisabled })).toBe(
      'base active',
    );
  });

  it('returns empty string for all falsy values', () => {
    expect(cn(false, undefined, '', { foo: false })).toBe('');
  });

  it('handles undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('preserves whitespace in strings', () => {
    expect(cn('  foo  ', '  bar  ')).toBe('  foo     bar  ');
  });

  it('filters out zero (falsy value)', () => {
    expect(cn('foo', 0, 'bar')).toBe('foo bar');
  });

  it('handles object with string keys containing special characters', () => {
    expect(cn({ 'bg-blue-500': true, 'hover:bg-blue-600': true })).toBe(
      'bg-blue-500 hover:bg-blue-600',
    );
  });
});
