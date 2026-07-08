# Valtir Mobile App 📦📡

Valtir is a mobile application for asset tracking and inventory management using Bluetooth (BLE) tags and GPS locations.

## 🛠 Technology Stack

**Frontend:**
- [React Native](https://reactnative.dev/) (via [Expo](https://expo.dev/) with Custom Dev Client)
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State Management:** Zustand (global state, BLE) + React Query (API caching and synchronization)
- **Forms:** React Hook Form

**Backend (BaaS):**
- [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)

**Specific Modules:**
- **BLE (Bluetooth):** `react-native-ble-plx` (scanning for tags, pairing, signal monitoring)
- **Location:** `react-native-geolocation-service` (retrieving GPS coordinates)
- **Maps:** `react-native-maps` (displaying assets on a map)

---

## 🚀 Core Features (V1)
1. **Inventory Management:** View, add, and edit assets.
2. **BLE Tracking:** Scan the area, read tag UUIDs/MACs, and link them to specific assets.
3. **GPS Location:** Record the last known location of an asset during scanning or editing.
4. **Map:** View all assets on a map (pins with locations).
5. **CSV Import:** Bulk upload inventory databases.

---

## ⚙️ Getting Started (Development)

Since the app uses native modules for Bluetooth (`react-native-ble-plx`), development is done via an **Expo Development Build (Custom Dev Client)**. You cannot use the standard Expo Go app.

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables Setup
Create a `.env` file in the root of the project and add your Supabase keys:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Build the Dev Client
To run the app on a physical device, you need a Dev Client.

**If you are developing on a Mac:**
```bash
npx expo run:ios
```

**If you are developing on Windows (Cloud Build via EAS):**
1. Make sure you are logged into Expo (`npx eas login`).
2. Start the cloud build:
```bash
eas build --profile development --platform ios
```
3. Once the build is complete, install the app on your iPhone (via QR code).

### 4. Start the Local Server
When the Dev Client is installed on your phone, start the local server:
```bash
npx expo start --dev-client
```
Scan the QR code from the terminal with your device, and the app will load with Hot Reload support.

---

## 📱 Distribution
To send a production build to a client in TestFlight:
```bash
eas build --profile production --platform ios
eas submit -p ios
```
