# 🏆 Wishlist Awards - Predicciones de The Game Awards

**Wishlist Awards** es una aplicación web interactiva que permite a los usuarios crear ligas, competir con amigos y predecir los ganadores de *The Game Awards*. Diseñada con una interfaz moderna, oscura y vibrante ("Gamer Aesthetic"), ofrece una experiencia fluida tanto en escritorio como en móviles.

## ✨ Características Principales

### 🎮 Votación y Predicciones
*   **Sistema de Votación Intuitivo**: Interfaz visual para seleccionar nominados en todas las categorías oficiales (GOTY, Dirección, Narrativa, etc.).
*   **Modales de Votación**: Selección de 1º, 2º y 3º lugar para categorías principales, con ponderación de puntos.
*   **Navegación Fluida**: Pestañas y shortcuts para navegar rápidamente entre decenas de categorías.

### 👥 Grupos y Ligas
*   **Creación de Grupos**: Los usuarios pueden crear ligas privadas.
*   **Sistema de Invitación**: Enlaces únicos para invitar amigos a tu grupo.
*   **Tablas de Clasificación**: Ranking en tiempo real dentro de cada grupo comparando las predicciones.
*   **Ranking Global**: Comparativa con todos los usuarios de la plataforma.

### 🔎 Información de Juegos (IGDB Integration)
*   **Fichas de Detalle**: Cada juego nominado tiene su propia página con:
    *   Sinopsis y Trama.
    *   Trailer (YouTube Integrado).
    *   Galería de Screenshots (con **Lightbox** interactivo y navegación por teclado).
    *   Datos técnicos (Desarrollador, Fecha, Rating).
    *   Lista de categorías en las que participa.
*   **Búsqueda Inteligente**: Algoritmo personalizado para encontrar juegos exactos (evitando DLCs erróneos como en *Silksong* o *Fortnite*).
*   **Caching Inteligente**: Sistema de caché en Firestore para minimizar llamadas a la API de IGDB y mejorar velocidad.

### 👤 Perfiles y Social
*   **Perfiles Públicos**: Ver las predicciones de otros usuarios.
*   **Comparación de Votos**: Al visitar un perfil, ves en qué coincidiste ("Match") y la afinidad porcentual.
*   **Búsqueda Global de Usuarios**: Buscador en tiempo real (Client-side Fuzzy Search) accesible desde el Navbar para encontrar amigos.
*   **Medallas y Puntos**: Visualización clara de aciertos (Oro/Plata/Bronce) y puntajes finales.

### ⚙️ Tecnología y UX
*   **Diseño Responsivo**: Optimizado para móviles con barra de navegación inferior adaptativa.
*   **Modo Post-Evento**: La interfaz cambia automáticamente cuando el evento termina para mostrar Ganadores Oficiales y Resultados.
*   **Animaciones**: Uso de `framer-motion` y CSS transitions para una experiencia "premium".

---

## 🛠️ Stack Tecnológico

Este proyecto está construido con las últimas tecnologías web (2025):

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
*   **Lenguaje**: TypeScript.
*   **UI/Estilos**: 
    *   [Tailwind CSS v4](https://tailwindcss.com/).
    *   Fuentes: *Geist*, *Rubik Wet Paint* (Grunge headers), *Orbitron* (Digital accents).
    *   Iconos: `lucide-react`.
*   **Backend / BaaS**: 
    *   **Firebase Authentication**: Manejo de usuarios (Email/Google).
    *   **Firebase Firestore**: Base de datos NoSQL en tiempo real.
*   **API Externa**: [IGDB API](https://api-docs.igdb.com/) (Twitch) para datos de juegos.
*   **Utilidades**: `axios`, `cheerio` (para scraping auxiliar si necesario), `react-hot-toast` (notificaciones).

---

## 🚀 Instalación y Configuración

### Prerrequisitos
*   Node.js 20+
*   Cuenta en Firebase Console
*   Credenciales de desarrollador de Twitch (para IGDB)

### Pasos
1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/wishlist-awards.git
    cd wishlist-awards
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Crea un archivo `.env.local` en la raíz con las siguientes variables:
    ```env
    # Firebase Client SDK
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...

    # IGDB / Twitch Credentials (Servidor)
    IGDB_CLIENT_ID=...
    IGDB_CLIENT_SECRET=...
    ```

4.  **Ejecutar Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000`.

### Scripts Útiles
*   `npm run update-images`: Script personalizado en `scripts/update-game-images.js` para actualizar masivamente las portadas de los nominados desde IGDB.
*   `npm run migrate:members`: Script de utilidad para migraciones de estructura de grupos.

---

## 📂 Estructura del Proyecto

```
/app
  /api/igdb       # Proxy server-side para proteger keys de IGDB
  /game/[query]   # Página dinámica de detalle de juego
  /group/[id]     # Página de detalle de grupo/liga
  /profile/[user] # Perfil público de usuario
  /vote           # Interfaz principal de votación
  /winners        # Página de ganadores oficiales (Post-evento)
  /my-results     # Página de cálculo de puntajes personales
  layout.tsx      # Root Layout (Fuentes, Metadata, AuthProvider)
  page.tsx        # Landing Page (Hero Section)

/components
  Navbar.tsx          # Barra de navegación receptiva
  UserSearchModal.tsx # Buscador global de usuarios
  GameGallery.tsx     # Lightbox para screenshots
  CategorySection.tsx # Tarjeta de categoría y nominados
  HeroSection.tsx     # Sección principal con Logo animado

/lib
  firebase.ts     # Inicialización de Firebase
  igdb.ts         # Lógica de fetching y caching de IGDB

/scripts        # Scripts de mantenimiento (Node.js)
/types          # Definiciones TypeScript (Nominee, Category, User)
```

## 🧠 Lógica Destacada: IGDB Caching

Para evitar exceder los límites de la API de IGDB y mejorar la velocidad de carga, implementamos un sistema de caché "Lazy":

1.  El usuario solicita `/game/Elden Ring`.
2.  El servidor verifica si existe el documento `games/elden-ring` en Firestore.
3.  **Si existe**: Devuelve los datos de Firestore (1 lectura, 0 llamadas API).
4.  **Si NO existe**: 
    *   Llama a la API de IGDB.
    *   Realiza una búsqueda inteligente (filtrando por categoría "Main Game" y presencia de Cover).
    *   Guarda el resultado en Firestore.
    *   Devuelve los datos al usuario.

---

Creado con 💜 por un jugador muy malo en Donkey Kong Country 2.
