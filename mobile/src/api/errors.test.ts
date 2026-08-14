import { ApiAuthError, ApiConfigError, ApiHttpError, ApiNetworkError, describeApiError } from './errors';

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
