import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 3000,
    // allowedHosts: ["localhost", "exampro.avantlabstech.com"],
    // proxy: {
    //   "/api": {
    //     target: "https://api.aviation1in60.cloud",
    //     changeOrigin: true,
    //   },
    // },
  },
});
