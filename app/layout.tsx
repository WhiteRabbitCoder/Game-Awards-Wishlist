import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wishlist Game Awards 2025",
  description: "Predice los ganadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* IMPORTAR FUENTES AQUÍ */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik+Wet+Paint&family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-deep text-white`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#151B26",
                color: "#fff",
                border: "1px solid #333",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}