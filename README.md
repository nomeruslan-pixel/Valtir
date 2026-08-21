# Valtir Mobile Application 📦📡📱

A production-grade mobile application for asset tracking, inventory management, Bluetooth (BLE) sensor pairing, GPS yard mapping, and warehouse pick-ticket fulfillment.

---

## 🛠 Technology Stack

- **Core Framework:** [React Native](https://reactnative.dev/) (0.81+) & [Expo SDK](https://expo.dev/) (SDK 54) with Bare/Prebuild workflow
- **Language:** TypeScript
- **Navigation:** [React Navigation v7](https://reactnavigation.org/) (Native Stack & Bottom Tabs)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Networking & API:** Axios (HTTP client with Bearer Token interceptor)
- **Bluetooth (BLE):** `react-native-ble-plx` (Background central mode, tag scanning, RSSI signal detection)
- **Geolocation & Mapping:** `react-native-geolocation-service` & `react-native-maps`
- **Document & Media Processing:**
  - `expo-print` (HTML-to-PDF rendering engine)
  - `expo-image-picker` & `expo-image-manipulator` (Camera photo capture, compression, Base64 conversion)
  - `expo-sharing` & `expo-file-system` (Native Share Sheet and document export)
- **Icons & Theme:** `lucide-react-native`, dynamic theme color hooks

---

## 🚀 Key Modules & Features

### 1. Inventory Hub (`/src/screens/InventoryScreen`)
- Full catalog of tracked and untracked warehouse items.
- Real-time search across SKU name, description, and **Yard** location.
- Classification pills by item **Type** (*Fabricated*, *Purchased*, *Raw*).
- Multi-select selection mode for batch item deletion.
- Item edit modal for updating quantities, descriptions, item type, and yard.

### 2. BLE Tracking & Radar (`/src/screens/ScanScreen`, `/src/screens/RadarScreen`)
- Real-time scanning for nearby Bluetooth beacons and tags.
- Signal strength indicator (RSSI) with distance approximation.
- Tag association to link physical tags to digital SKU records.

### 3. Yard Geolocation & Map (`/src/screens/MapScreen`)
- Live GPS tracking of assets on high-resolution map overlays.
- Visual polygon zones for identifying item locations across yard sectors.

### 4. Warehouse Pick Tickets (`/src/screens/TicketDashboardScreen`, `/src/screens/TicketDetailsScreen`)
- Interactive pick lists grouped by order / load number.
- Color-coded item tiles based on item type (*Fabricated = Yellow, Purchased = Orange, Raw = Grey*).
- Live quantity counters (`- / +`) with automatic state transitions (*Not Started* → *In Progress* → *Picked*).
- Camera capture for truck and cargo inspection photos.
- **PDF Export Engine:** Generates styled PDF pick tickets with embedded photos and opens the native OS share dialog.

### 5. Authentication & Security (`/src/screens/AuthScreen`)
- Secure JWT-based authentication connected to the company backend.
- Case-insensitive email login with keyboard-aware responsive view.
- In-memory session handling for enhanced security.

---

## 📂 Project Structure

```
mobile-app-Valtir/
├── src/
│   ├── api/                 # Axios HTTP client configuration
│   ├── app/
│   │   └── navigation/      # Root, Tab, and Stack navigators
│   ├── entities/
│   │   └── inventory/       # Inventory state store and data models
│   ├── features/
│   │   ├── auth/            # Auth state store (Zustand)
│   │   ├── bluetooth/       # BLE scanner and tag connection managers
│   │   └── tickets/         # Pick ticket state store and PDF generator
│   ├── screens/
│   │   ├── AuthScreen/      # Login & registration screen
│   │   ├── HomeScreen/      # Overview & Inventory Hub landing
│   │   ├── InventoryScreen/ # Item list, search, and bulk operations
│   │   ├── MapScreen/       # Asset geolocation and yard zones
│   │   ├── ScanScreen/      # BLE tag scanner
│   │   └── TicketDetailsScreen/ # Pick ticket fulfillment & PDF export
│   └── theme/               # Color system and theme hooks
├── assets/                  # App icon, splash screen, adaptive icons
├── app.json                 # Expo configuration & native permissions
├── codemagic.yaml           # CI/CD automated build & TestFlight publishing
└── package.json             # Dependencies and build scripts
```

---

## ⚙️ Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend Endpoint
Ensure `API_BASE_URL` in `src/api/client.ts` points to your target backend instance:
```typescript
export const API_BASE_URL = 'http://20.80.96.227';
```

### 3. Generate Native Projects
Since the application uses custom native modules (Bluetooth BLE, Camera, Maps):
```bash
npx expo prebuild --clean
```

### 4. Run on Device / Simulator

**iOS (macOS required):**
```bash
npx expo run:ios
```

**Android:**
```bash
npx expo run:android
```

---

## 🚢 CI/CD & TestFlight Publishing (Codemagic)

The repository is configured with an automated CI/CD pipeline in `codemagic.yaml` for building and distributing iOS production releases directly to Apple TestFlight.

### Pipeline Workflow:
1. **Dependency Installation:** `npm install`
2. **Build Number Increment:** Automatically updates `app.json` build number with `$BUILD_NUMBER`.
3. **Native Prebuild:** Executes `npx expo prebuild --platform ios --clean`.
4. **CocoaPods:** Installs native iOS pod dependencies.
5. **Code Signing:** Automatic certificate and provisioning profile signing via App Store Connect API integration.
6. **Archive & Export:** Compiles `.ipa` binary using `xcode-project build-ipa`.
7. **Publish:** Delivers the binary directly to Apple TestFlight for internal and external testing.
