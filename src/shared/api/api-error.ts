const apiErrorTranslationKeys = {
  CONFLICT: 'errors.conflict',
  EMAIL_ALREADY_REGISTERED: 'errors.emailAlreadyRegistered',
  FORBIDDEN: 'errors.forbidden',
  INTERNAL_SERVER_ERROR: 'errors.server',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  NETWORK_ERROR: 'errors.network',
  NOT_FOUND: 'errors.notFound',
  RATE_LIMITED: 'errors.rateLimited',
  UNAUTHORIZED: 'errors.unauthorized',
  UNKNOWN_ERROR: 'errors.unknown',
  VALIDATION_FAILED: 'errors.validation',
} as const;

export type ApiErrorCode = keyof typeof apiErrorTranslationKeys;

const apiErrorCodesByStatus: Partial<Record<number, ApiErrorCode>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
};

// Keeps the client compatible with older API deployments. Do not display a
// server-provided message directly; new responses use the stable `code` field.
const legacyApiErrorCodesByMessage: Record<string, ApiErrorCode> = {
  'Email is already registered': 'EMAIL_ALREADY_REGISTERED',
  'Invalid credentials': 'INVALID_CREDENTIALS',
};

type ApiErrorResponse = {
  code?: unknown;
  message?: unknown;
  statusCode?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(apiErrorTranslationKeys, value)
  );
}

function toApiErrorResponse(error: unknown): ApiErrorResponse | undefined {
  return isRecord(error) ? error : undefined;
}

/**
 * Normalizes errors thrown by the generated OpenAPI client to a stable code.
 * New backend endpoints should return `{ code, statusCode, message }`.
 */
export function getApiErrorCode(error: unknown): ApiErrorCode {
  if (error instanceof TypeError) {
    return 'NETWORK_ERROR';
  }

  const response = toApiErrorResponse(error);

  if (!response) {
    return 'UNKNOWN_ERROR';
  }

  if (isApiErrorCode(response.code)) {
    return response.code;
  }

  if (
    typeof response.message === 'string' &&
    legacyApiErrorCodesByMessage[response.message]
  ) {
    return legacyApiErrorCodesByMessage[response.message];
  }

  if (typeof response.statusCode === 'number') {
    return apiErrorCodesByStatus[response.statusCode] ?? 'UNKNOWN_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

export function getApiErrorTranslationKey(error: unknown) {
  return getApiErrorTranslationKeyForCode(getApiErrorCode(error));
}

export function getApiErrorTranslationKeyForCode(code: ApiErrorCode) {
  return apiErrorTranslationKeys[code];
}
