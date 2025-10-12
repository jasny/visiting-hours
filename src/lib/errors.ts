export class AccessDeniedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Access Denied');
  }
}
