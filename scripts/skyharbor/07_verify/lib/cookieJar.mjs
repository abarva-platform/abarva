export class CookieJar {
  constructor(cookies = []) {
    this.cookies = new Map();
    for (const cookie of cookies) {
      if (!cookie?.name) continue;
      this.cookies.set(cookie.name, cookie.value ?? '');
    }
  }

  header() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  applySetCookie(headers) {
    const setCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : splitSetCookieHeader(headers.get?.('set-cookie'));

    for (const setCookie of setCookies) {
      const [pair] = setCookie.split(';');
      const equalsIndex = pair.indexOf('=');
      if (equalsIndex <= 0) continue;

      const name = pair.slice(0, equalsIndex).trim();
      const value = pair.slice(equalsIndex + 1).trim();
      if (value) {
        this.cookies.set(name, value);
      } else {
        this.cookies.delete(name);
      }
    }
  }
}

export function splitSetCookieHeader(value) {
  if (!value) return [];
  return value
    .split(/,(?=\s*[^;,=\s]+=[^;,]+)/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
