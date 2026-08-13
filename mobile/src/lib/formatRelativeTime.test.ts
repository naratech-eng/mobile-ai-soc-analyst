import { formatRelativeTime } from './formatRelativeTime';

describe('formatRelativeTime', () => {
  it('formats a just-now timestamp', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now');
  });

  it('formats seconds ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 30_000).toISOString())).toBe('30s ago');
  });

  it('formats minutes ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago');
  });

  it('formats hours ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * 60 * 60_000).toISOString())).toBe('3h ago');
  });

  it('formats days ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString())).toBe('2d ago');
  });

  it('handles an invalid timestamp without throwing', () => {
    expect(formatRelativeTime('not-a-date')).toBe('unknown time');
  });
});
