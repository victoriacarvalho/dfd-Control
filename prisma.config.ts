import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // O Prisma CLI (que roda o db push) precisa obrigatoriamente da
    // conexão direta para conseguir criar as tabelas no Neon.
    url: env("DIRECT_URL"),
  },
});
