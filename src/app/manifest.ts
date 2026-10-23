import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "forma. — Your leaner era",
    short_name: "forma",
    description: "Lean recomposition tracker: desi meals, training, progress and recovery.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9f6",
    theme_color: "#193e34",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
