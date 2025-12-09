import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-deep`}>
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