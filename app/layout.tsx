import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar"; // Importamos el Navbar
import "./globals.css"; // Asegúrate de que la ruta a tus estilos sea correcta

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wishlist Awards",
  description: "Predice los ganadores de los premios de videojuegos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-950 text-white min-h-screen flex flex-col`}
      >
        <AuthProvider>
          {/* El Navbar se mostrará en todas las páginas */}
          <Navbar />

          {/* Contenido cambiante de cada página */}
          <main className="flex-1">{children}</main>

          {/* Footer Global */}
          <footer className="p-6 border-t border-gray-900 text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Wishlist Awards.
          </footer>

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}