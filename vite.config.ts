import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "PharmaSpark",
      formats: ["es", "cjs"],
      fileName: (format) => `pharmaspark.${format === "es" ? "module" : "cjs"}.js`,
    },
    rollupOptions: {
      external: ["three", "@sparkjsdev/spark"],
      output: {
        globals: {
          three: "THREE",
          "@sparkjsdev/spark": "Spark",
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8097,
  },
});
