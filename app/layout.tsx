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
    var theme = localStorage.getItem("jingxi_theme") || "mist-darkroom";
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-loading", "");
    root.style.colorScheme = theme === "morning-grey" ? "light" : "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var colors = { "mist-darkroom": "#13161A", "dusk-bean": "#1F191B", "morning-grey": "#ECE6DC" };
      meta.setAttribute("content", colors[theme] || "#13161A");
    }
  } catch (e) {}
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
