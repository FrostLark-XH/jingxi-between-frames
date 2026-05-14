import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/useTheme";

export const metadata: Metadata = {
  title: "镜隙之间",
  description: "让时间慢慢显影",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "镜隙之间",
  },
  icons: {
    icon: [
      { url: "/icons/jingxi-icon-192-20260515.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/jingxi-icon-512-20260515.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/jingxi-apple-touch-20260515.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "镜隙之间",
    description: "让时间慢慢显影",
    images: [
      {
        url: "/images/cover-v2.jpg",
        width: 1200,
        height: 630,
        alt: "镜隙之间",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "镜隙之间",
    description: "让时间慢慢显影",
    images: ["/images/cover-v2.jpg"],
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#13161A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var allowed = ["mist-darkroom", "dusk-bean", "morning-grey", "moon-cyan", "forest-film", "silver-halide"];
    var metaColors = {
      "mist-darkroom": "#13161A",
      "dusk-bean": "#1F191B",
      "morning-grey": "#ECE6DC",
      "moon-cyan": "#101822",
      "forest-film": "#111A16",
      "silver-halide": "#141414"
    };
    var migration = {darkroom:"mist-darkroom","warm-paper":"dusk-bean","morning-paper":"morning-grey","dusk-paper":"dusk-bean"};
    var theme = localStorage.getItem("jingxi_theme") || "mist-darkroom";

    if (theme in migration) {
      theme = migration[theme];
      localStorage.setItem("jingxi_theme", theme);
    }

    if (allowed.indexOf(theme) === -1) {
      theme = "mist-darkroom";
      localStorage.setItem("jingxi_theme", theme);
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.dataset.themeReady = "true";

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var color = metaColors[theme] || "#13161A";
      meta.setAttribute("content", color);
    }
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "mist-darkroom");
    document.documentElement.dataset.themeReady = "true";
  }
})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
