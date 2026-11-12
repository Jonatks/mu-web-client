export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const bad = (m: string) => new HttpError(400, m);
export const missing = (m: string) => new HttpError(404, m);
