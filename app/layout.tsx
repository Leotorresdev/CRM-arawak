import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRM Galletas · Control de Calidad e Inocuidad",
    template: "%s · CRM Galletas",
  },
  description: "Sistema integral de gestión de calidad, HACCP, BPM, laboratorio, liberación de lotes y control de inocuidad en planta de producción de galletas.",
  icons: {
    icon: "/logo-arawak.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} font-sans antialiased selection:bg-primary/20 selection:text-primary min-h-screen`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
