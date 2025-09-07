import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/healthz", async () => ({ ok: true }));
app.get("/", async () => ({ message: "StripeDisputeShield — API Hello World ✅" }));
app.get("/_envcheck", async () => ({
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasRedisUrl: Boolean(process.env.REDIS_URL),
  appBaseUrl: process.env.APP_BASE_URL,
  port: process.env.PORT || 4000
}));

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
