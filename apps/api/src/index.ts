import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/healthz", async () => ({ ok: true }));
app.get("/", async () => ({ message: "StripeDisputeShield — API Hello World ✅" }));

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
