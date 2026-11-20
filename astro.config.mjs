import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://voyvotando.bull-labs.com",
  output: "static",
  integrations: [react()],
  build: { inlineStylesheets: "auto" },
});
