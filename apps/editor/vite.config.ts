import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // TODO: figure out why this plug in changes the way VideoContext is imported o_O
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ["kave-common", "videocontext"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /kave-common/, /videocontext/],
    },
  },
});
