import crypto from "node:crypto";
import http from "node:http";
import net from "node:net";

export function base64UrlDecode(value) {
  const normalized = String(value || "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

export function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function bearerToken(request) {
  const raw = request.headers.authorization;
  if (Array.isArray(raw)) return null;
  if (!raw) return null;
  const trimmed = raw.trim();
  const bearer = trimmed.match(/^Bearer\s+(.+)$/i);
  return bearer ? bearer[1].trim() : trimmed;
}

export function verifiedSecurityContext(token, apiSecret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || !apiSecret) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }
  if (header?.alg !== "HS256") return null;

  const signedBody = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto.createHmac("sha256", apiSecret).update(signedBody).digest("base64url");
  if (!timingSafeEqualString(signature, expectedSignature)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) return null;
  if (typeof payload.nbf === "number" && payload.nbf > now) return null;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
}

export function rejectCubeRequest(response, statusCode, detail) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify({ error: "cube_forbidden", detail }));
}

export function requiresTenantGuard(requestUrl) {
  const url = new URL(requestUrl || "/", "http://localhost");
  return url.pathname.startsWith("/cubejs-api/");
}

export function createTenantGuardProxy({ publicPort, targetPort, apiSecret = process.env.CUBEJS_API_SECRET }) {
  const connections = new Set();
  let closed = false;
  const server = http.createServer((request, response) => {
    if (requiresTenantGuard(request.url)) {
      const token = bearerToken(request);
      const securityContext = verifiedSecurityContext(token, apiSecret);
      if (!securityContext) {
        rejectCubeRequest(response, 403, "Cube authorization token is required.");
        return;
      }
      const tenantKey = securityContext.tenant_key;
      if (typeof tenantKey !== "string" || tenantKey.trim().length === 0) {
        rejectCubeRequest(response, 403, "tenant_key is required in Cube securityContext.");
        return;
      }
    }

    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: targetPort,
        method: request.method,
        path: request.url,
        headers: {
          ...request.headers,
          host: `127.0.0.1:${targetPort}`,
        },
      },
      (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
      },
    );

    upstream.on("error", (error) => {
      rejectCubeRequest(response, 502, `Cube upstream unavailable: ${error.message}`);
    });

    request.pipe(upstream);
  });

  server.on("connection", (connection) => {
    if (connection instanceof net.Socket) {
      connections.add(connection);
      connection.on("close", () => connections.delete(connection));
    }
  });

  return {
    listen() {
      server.listen(Number(publicPort), "0.0.0.0", () => {
        const address = server.address();
        const actualPort = typeof address === "object" && address ? address.port : publicPort;
        console.log(`Cube tenant guard proxy listening on ${actualPort}, forwarding to ${targetPort}`);
      });
      return server;
    },
    close() {
      if (closed) return;
      closed = true;
      server.close();
      for (const connection of connections) {
        connection.destroy();
      }
    },
  };
}
