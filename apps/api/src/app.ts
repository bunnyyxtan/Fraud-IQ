import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// When the built frontend sits next to this bundle, the API also serves it so
// the whole product is one origin and one service. WEB_DIST overrides the
// location; the default is where the web app's build lands in the deployed
// layout. If nothing is there, this is a plain API and the block is skipped.
const bundleDir = path.dirname(fileURLToPath(import.meta.url));
const webDist = process.env["WEB_DIST"]
  ? path.resolve(process.env["WEB_DIST"])
  : path.resolve(bundleDir, "../../web/dist/public");
const webIndex = path.join(webDist, "index.html");
const servesWeb = fs.existsSync(webIndex);

// Mounted before the static handler so a file in the web build can never shadow
// an API route.
app.use("/api", router);

// /api belongs to the API, so an unmatched route there is a 404 rather than a
// client-side route to hand back to the SPA. The check runs on the decoded path
// so an encoded separator like /api%2Fthing cannot slip past it, and a path that
// will not decode is treated as reserved: malformed input is not a real route
// either, and 404 is the honest answer.
function isApiPath(rawPath: string): boolean {
  let decoded: string;

  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return true;
  }

  return decoded === "/api" || decoded.startsWith("/api/");
}

if (servesWeb) {
  app.use(
    express.static(webDist, {
      index: false,
      setHeaders(res, filePath) {
        // Asset filenames carry a content hash, so they can be cached forever.
        // index.html is the one name that is stable across builds, so it has to
        // revalidate or a client pins itself to a stale build. `index: false`
        // alone does not cover this: it only stops directory-index resolution,
        // and a direct GET /index.html still lands here.
        res.setHeader(
          "Cache-Control",
          filePath === webIndex
            ? "no-cache"
            : "public, max-age=31536000, immutable",
        );
      },
    }),
  );

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (isApiPath(req.path)) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(webIndex);
  });
}

export { servesWeb, webDist };
export default app;
