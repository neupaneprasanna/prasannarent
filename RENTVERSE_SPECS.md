# 🌌 RENTVERSE — Project Specifications

Welcome to the comprehensive documentation for **RentVerse**, the ultra-premium marketplace for renting anything. This document outlines the core features, UI/UX design tokens, and the "physical" requirements needed to bring the project to a 100% completion.

---

## 🚀 Core Features

### 1. Unified Unified Landing Page
- **Hero Scene**: Immersive 3D environment using Three.js and Fiber.
- **Dynamic Categories**: Interactive grid with hover-triggered glassmorphism effects.
- **Trending Carousel**: Scroll-synced GSAP/Framer Motion carousel showing popular rentals.
- **Live Stats**: Real-time counters for active rentals, happy users, and total categories.
- **Interactive World Map**: Visual representation of global rental availability.
- **Testimonials**: Premium glassmorphic cards with user feedback.

### 2. Marketplace & Discovery
- **Explore Page**: Advanced filtering system (Category, Price Range, Location).
- **Infinite Search**: Full-text search capability with real-time results (Planned).
- **3D Product Cards**: "Tilt-to-perspective" cards for high-end visual appeal.

### 3. User Ecosystem
- **Authentication**: Secure Login and Registration flows with ultra-modern UI.
- **Dashboard**: Central hub for users to manage their bookings (Rentals) and their own listings (Earnings).
- **Real-time Chat**: Socket.io powered messaging system for renters and owners (Planned UI wiring).

### 4. Backend & API
- **Unified Server**: Express.js server integrated with Next.js.
- **Real-time Engine**: Socket.io for live booking status changes and messaging.
- **Data Layer**: Prisma ORM with PostgreSQL (Ready for DB connection).

---

## 🎨 UI/UX Design System

### 💎 Aesthetics: "Ultra-Premium Glassmorphism"
The design follows a "Cyber-Tech" aesthetic with deep blacks, neon accents, and heavy use of frosted glass.

#### Color Palette
| Token | Hex/Value | Usage |
| :--- | :--- | :--- |
| `background` | `#050508` | Main dark background |
| `surface` | `#0a0a12` | Card/Sub-section backgrounds |
| `accent` | `#6c5ce7` | Primary vibrant purple (Brand color) |
| `accent-2` | `#a29bfe` | Secondary soft purple |
| `success` | `#00cec9` | Selection/Success glows |
| `danger` | `#ff6b6b` | Errors/Critical alerts |

#### Typography
- **Display**: `Space Grotesk` — Used for hero titles and prominent headings.
- **Sans**: `Inter` — Used for body text and descriptive content.
- **Mono**: `JetBrains Mono` — Used for technical details and IDs.

#### Key Design Properties
- **Glassmorphism**: `.glass`, `.glass-strong`, and `.glass-card` classes provide frosted-glass effects with backdrop-blur (20px-40px).
- **Interactive Elements**:
    - **Cursor**: Custom "Follower" cursor that changes state on hover.
    - **Animations**: GSAP-powered shimmer effects and Framer Motion spring physics.
    - **Overlays**: Film grain and noise textures for a cinematic feel.

---

## 🛠️ Physical Requirements (TODO List)

To complete the project, the following "physical" assets and technical implementations are required:

### 📸 Visual Assets (Photos & Icons)
- [ ] **Product Photos**: High-resolution transparent PNGs or WebP images for the `TrendingCarousel`.
- [ ] **Category Icons**: Premium SVG icons to replace the current emoji placeholders (📸, 🚗, etc.).
- [ ] **User Avatars**: Professional placeholder images for the `Testimonials` and `Dashboard`.
- [ ] **3D Models**: Optimized GLTF/GLB files for the `HeroScene` if switching from basic shapes to specific product highlights.

### 🔊 Audio Assets
- [ ] **engine.mp3**: Required for the immersive loading sequence.
- [ ] **getting_inside.mp3**: Secondary sound for the transition into the app.

### 🔌 API & Integration (Physical Logic)
- [ ] **Database Connection**: Set up the `.env` with a real PostgreSQL/MongoDB URL for Prisma.
- [ ] **Auth Implementation**: Implement password hashing (bcrypt) and JWT generation in `server/index.ts`.
- [ ] **Payment Bridge**: Integrate **Stripe** or similar for actual booking transactions.
- [ ] **File Storage**: Set up **Cloudinary** or **AWS S3** for uploading product photos from the "List Item" page.
- [ ] **Email Service**: Integration with **Resend** or **SendGrid** for booking confirmations.

---

> [!TIP]
> **Mobile Optimization**: Keep in mind that for the mobile version, custom cursors are disabled automatically to ensure touch-friendliness. Focus on responsive padding in the `.section-padding` utility.
