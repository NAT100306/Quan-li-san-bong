import { cn } from '@/lib/utils';

describe('cn() — className utility', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional class names (truthy)', () => {
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('should ignore falsy conditional class names', () => {
    expect(cn('base', false && 'hidden', null, undefined)).toBe('base');
  });

  it('should resolve Tailwind conflicts (last one wins)', () => {
    // tailwind-merge ensures conflicting utilities are resolved correctly
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('should merge text color conflicts correctly', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle object syntax from clsx', () => {
    const result = cn({ 'font-bold': true, 'text-sm': false });
    expect(result).toBe('font-bold');
  });

  it('should handle array syntax from clsx', () => {
    const result = cn(['flex', 'items-center']);
    expect(result).toBe('flex items-center');
  });

  it('should return empty string when no arguments given', () => {
    expect(cn()).toBe('');
  });

  it('should handle multiple Tailwind class overrides', () => {
    const result = cn('bg-red-500 text-white', 'bg-blue-500');
    expect(result).toBe('text-white bg-blue-500');
  });
});
