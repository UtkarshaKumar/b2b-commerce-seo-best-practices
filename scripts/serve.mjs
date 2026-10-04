import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const safePath = normalize(requestPath).replace(/^\.\.(\/|\\)/, "");
  const candidates = [
    join(root, safePath),
    join(root, safePath, "index.html"),
    join(root, safePath, "index.html"),
    join(root, "index.html")
  ];

  for (const candidate of candidates) {
    try {
      const details = await stat(candidate);
      if (!details.isFile()) continue;
      const content = await readFile(candidate);
      response.writeHead(200, { "Content-Type": types[extname(candidate)] || "application/octet-stream" });
      response.end(content);
      return;
    } catch {}
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, () => {
  console.log(`Northline Dental Supply demo running at http://localhost:${port}`);
});
