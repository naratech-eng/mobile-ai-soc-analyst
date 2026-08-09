// Typed failure modes so callers can branch on *what* went wrong, not on
// message strings. A 401 (ApiAuthError) is deliberately distinct from a
// generic ApiNetworkError — see RB-3 in BUILD-BRIEF.md.

export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigError';
  }
}

export class ApiAuthError extends Error {
  constructor(message = 'Request rejected: missing or invalid backend API key.') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export class ApiHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the backend — check connectivity and the configured backend URL.');
    this.name = 'ApiNetworkError';
    this.cause = cause;
  }
}
