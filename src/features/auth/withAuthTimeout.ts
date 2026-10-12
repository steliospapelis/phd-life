export const AUTH_REQUEST_TIMEOUT_MS = 20_000;

export function withAuthTimeout<T>(request: Promise<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject({ code: "auth_timeout" }), timeoutMs);
    request.then((value) => { if (timer) clearTimeout(timer); resolve(value); }, (error: unknown) => { if (timer) clearTimeout(timer); reject(error); });
  });
}

