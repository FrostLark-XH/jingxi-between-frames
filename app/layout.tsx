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
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "镜隙之间",
    description: "让时间慢慢显影",
    images: [
      {
        url: "/images/cover.jpg",
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
    images: ["/images/cover.jpg"],
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
    var allowed = ["mist-darkroom", "dusk-bean", "morning-grey"];
    var theme = localStorage.getItem("jingxi_theme") || "mist-darkroom";

    if (allowed.indexOf(theme) === -1) {
      theme = "mist-darkroom";
      localStorage.setItem("jingxi_theme", theme);
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.dataset.themeReady = "true";

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var color = theme === "morning-grey" ? "#e8e1d3" : "#111318";
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
