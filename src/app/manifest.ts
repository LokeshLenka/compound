import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Compound",
    short_name: "Compound",
    description: "Habits, tasks, notes and diary in one private place.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f1e6",
    theme_color: "#f6f1e6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Log water",
        url: "/water",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "New task",
        url: "/tasks?create=1",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Diary",
        url: "/diary",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  }
}
