import { ApiAuthError, ApiConfigError, ApiHttpError, ApiNetworkError } from '../../api/errors';
import { describeApiError, formatAttackId, formatRelativeTime } from './format';

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

describe('formatAttackId', () => {
  it('returns the id when present', () => {
    expect(formatAttackId('T1422')).toBe('T1422');
  });

  it('returns a fallback label when null', () => {
    expect(formatAttackId(null)).toBe('no technique matched');
  });
});

describe('describeApiError', () => {
  it('maps ApiAuthError', () => {
    expect(describeApiError(new ApiAuthError())).toMatch(/api key/i);
  });

  it('maps ApiConfigError', () => {
    expect(describeApiError(new ApiConfigError('missing'))).toMatch(/not configured/i);
  });

  it('maps ApiNetworkError', () => {
    expect(describeApiError(new ApiNetworkError(new Error('offline')))).toMatch(/reach the backend/i);
  });

  it('maps ApiHttpError, including the status', () => {
    expect(describeApiError(new ApiHttpError(500, 'boom'))).toBe('Backend error (500).');
  });

  it('falls back for an unrecognized error', () => {
    expect(describeApiError(new Error('mystery'))).toBe('Something went wrong.');
  });
});
