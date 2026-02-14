# RentVerse Verification Guide

This guide provides a step-by-step walkthrough to verify all essential platform features. Follow these steps sequentially to ensure RentVerse is operational.

---

## Part 1: Standard User Journey 👤

### 1. Landing & Navigation
1.  **Open Homepage**: Navigate to the base URL.
2.  **Verify Hero Section**: Observe the 3D scene; move your mouse to check light tracking/tilt effects.
3.  **Check Carousel**: Scroll down and interact with the "Trending Rentals" carousel. Ensure items scroll smoothly.
4.  **Test Filters**: Click on category labels (Photography, Luxury, etc.) and verify they trigger a glassmorphic highlight.
5.  **Mobile POV**:
    - Open Browser DevTools (F12) and toggle "Device Toolbar".
    - Select a phone model (e.g., iPhone 14).
    - **Check**: Is the 3D hero hidden or simplified? Do the category grids stack vertically? Is the menu accessible?

### 2. Search & Explore
1.  **Search Bar**: Click the search bar and type a keyword (e.g., "Camera"). Verify suggestions appear.
2.  **Explore Page**: Click "Explore Now".
3.  **Map Interaction**: View the realistic 3D map. Zoom in and out; tilt the perspective (if enabled) to see 3D markers.

### 3. User Dashboard & Listings
1.  **Registration**: Sign up for a new account.
2.  **Login**: Log out and log back in with the new credentials.
3.  **Create Listing**:
    - Navigate to the Dashboard.
    - Click "Create New Listing".
    - Fill out the form and upload a test image.
    - **Check**: Does the listing appear in "My Listings"?

---

## Part 2: Administrator Journey 👮

### 1. Admin Access
1.  **Navigate to `/admin`**: Access the administrative login page.
2.  **Login**: Use admin-specific credentials.

### 2. Dashboard Audit (The "Control Center")
1.  **Verify Stats**: Check if the "Live Environment" stats (Users, Listings, Revenue) are displaying data.
2.  **Observe Charts**: Ensure the Revenue Performance and User Growth charts are rendering correctly.
3.  **Check Audit Log**: Perform an action (e.g., change a setting) and verify it appears in the "Live Audit Log" feed.
4.  **Systems Health**: Confirm all infrastructure nodes (API, DB, etc.) show as "Operational" with green pulse icons.

### 3. Moderation
1.  **Approval Queue**: Check the "Approval Queue" section.
2.  **Review Content**: Find the test listing you created as a user. Verify its details are visible to the admin.

### 4. Role-Based Access (Multi-Level)
1.  **Switch Roles**: If possible (e.g., via DB or mock login), log in as a **Moderator** or **Support** staff.
2.  **Verify Sidebar**: Confirm that restricted menus (like "System" or "Payments" for Moderators) are hidden.
3.  **Check Permissions**: Attempt to access a restricted URL directly (e.g., `/admin/system`) and verify it blocks access.

### 5. Quick Actions
1.  **Test Shortcuts**:
    - Press `⌘L` (or simulate click) for "New Listing".
    - Press `⌘U` (or simulate click) for "Create User".
2.  **Check Responsiveness**: Verify the Quick Actions menu closes when clicking outside or selecting an action.

### 5. Mobile POV (Admin)
- Toggle mobile view in DevTools for the `/admin` URL.
- **Check**: Does the sidebar menu collapse into a hamburger or disappear into a bottom bar? Do the Large charts remain readable?

---

## Part 3: Visual & Audio Audit 🌌

1.  **Glassmorphism**: Ensure all cards have a consistent `backdrop-blur` effect.
2.  **Animations**: Hover over buttons and cards to verify GSAP/Framer Motion physics.
3.  **Audio**: Verify the loading sounds (`engine.mp3`, `getting_inside.mp3`) play during initial entry.
