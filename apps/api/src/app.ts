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

if (servesWeb) {
  // Asset filenames carry a content hash, so they can be cached hard. index.html
  // is excluded here and served by the fallback below, which must revalidate or
  // clients would pin themselves to a stale build.
  app.use(
    express.static(webDist, {
      index: false,
      maxAge: "1y",
      immutable: true,
    }),
  );
}

app.use("/api", router);

if (servesWeb) {
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    // /api is the API's own namespace: an unmatched route there is a 404, not a
    // client-side route to hand back to the SPA.
    if (req.path === "/api" || req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(webIndex);
  });
}

export { servesWeb, webDist };
export default app;
