import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Wet_Paint, Orbitron } from "next/font/google"; // 1. Importar nuevas fuentes
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

// Fuentes base existentes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Nueva fuente Brush/Grunge
const rubikWetPaint = Rubik_Wet_Paint({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush", // Variable CSS para Tailwind
});

// 3. Nueva fuente Digital
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-digital", // Variable CSS para Tailwind
});



export const metadata: Metadata = {
  title: "Wishlist Awards - Predice los ganadores",
  description: "Compite con tus amigos prediciendo los ganadores de los premios de videojuegos",
  icons: {
    icon: [
      {
        url: "https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png",
        type: "image/png",
      }
    ],
    apple: "https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png" type="image/png" />
      </head>
      {/* 4. Inyectar las variables nuevas en el body */}
      <body className={`${geistSans.variable} ${geistMono.variable} ${rubikWetPaint.variable} ${orbitron.variable} antialiased bg-deep`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#151B26',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}