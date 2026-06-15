import http from "http";
import { startBot } from "./lib/discord-bot.js";
import { logger } from "./lib/logger.js";

// Minimal HTTP server so Railway considere o serviço saudável
const port = process.env.PORT ?? 3000;
http.createServer((_, res) => { res.writeHead(200); res.end("OK"); }).listen(port, () => {
  logger.info(`Health check server running on port ${port}`);
});

startBot().catch((err) => {
  logger.error({ err }, "Failed to start bot");
  process.exit(1);
});
