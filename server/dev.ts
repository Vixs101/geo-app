import { createServer } from "node:http";
import { handleAuth } from "../api/auth.ts";

createServer(async (incoming, outgoing) => {
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
  const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
    method: incoming.method,
    headers: incoming.headers as HeadersInit,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const response = await handleAuth(request);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(3001, "127.0.0.1", () => console.log("Auth API on http://127.0.0.1:3001"));
