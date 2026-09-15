import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Fantasy Formação",
    short_name: "FFFormação",
    description: "O Fantasy Football privado dos pais.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#163b6d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
