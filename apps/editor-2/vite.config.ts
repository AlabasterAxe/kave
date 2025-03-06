import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: ["kave-common"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /kave-common/],
    },
  },
});
