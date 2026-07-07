# План реалізації проекту: Valtir

Цей документ описує технічний план реалізації iOS-додатку Valtir на базі React Native (Expo) та Supabase.

## 1. Архітектура та Технологічний стек

### Frontend
- **Фреймворк:** React Native (Expo з custom dev client)
- **Мова:** TypeScript
- **State Management & Data Fetching:** 
  - `React Query` (TanStack Query) — для кешування API-запитів, офлайн-роботи та синхронізації з базою.
  - `Zustand` — для локального стану (auth state, BLE state, фільтри).
- **Платформа:** iOS (mobile-first UI, дистрибуція через TestFlight).

### Backend & База даних
- **BaaS (Backend as a Service):** Supabase.
- **База даних:** PostgreSQL.
- **Auth:** Supabase Auth (JWT, Row Level Security).
- **Сховище (Storage):** Supabase Storage (якщо потрібні фото активів).
- **Адмін-панель:** Вбудована Supabase Studio для управління даними.

### Нативні інтеграції
- **Карти:** `react-native-maps`
- **Локація:** `react-native-geolocation-service`
- **Bluetooth (BLE):** `react-native-ble-plx`

---

## 2. Етапи реалізації (Milestones)

### Фаза 1: Ініціалізація та Базова інфраструктура
- Створення проекту Expo (з TypeScript шаблоном).
- Налаштування EAS Build (Expo Application Services) для хмарної компіляції iOS (оскільки розробка може вестися на Windows).
- Створення проекту Supabase, налаштування таблиць PostgreSQL (`users`, `assets`, `trackers`, `asset_locations`, `activity_logs`).
- Інтеграція `supabase-js` у додаток, налаштування аутентифікації.
- Налаштування CI/CD для приватної дистрибуції через TestFlight (автоматичний сабміт через EAS Submit).

### Фаза 2: Управління інвентарем та UI (Оранжева тема)
- Налаштування глобальної системи кольорів (`src/theme/colors.ts`) на основі затвердженого оранжевого макету:
  - `background`: '#DBDDE1'
  - `primary`: '#F69F3C'
  - `card`: '#FFFFFF'
  - `foreground`: '#0F1729'
- Розробка кастомної нижньої навігації (Bottom Tab Navigator) з плаваючою центральною кнопкою "Scan" (Радар).
- Розробка UI-компонентів: **Dashboard** (Home), **Inventory List** (Items), **Asset Details**, **Profile**.
- Використання стандартних `StyleSheet` React Native для максимальної гнучкості та продуктивності.
- Інтеграція іконок `lucide-react-native`.
- Інтеграція `React Query` для отримання та оновлення списку активів з Supabase.
- Реалізація логіки додавання, редагування та перегляду активів.
- Модуль для імпорту CSV (парсинг на клієнті через `papaparse` -> масовий `upsert` в Supabase).

### Фаза 3: Локація та Відображення на мапі
- Налаштування дозволів для геолокації.
- Отримання та збереження GPS-координат (останньої відомої локації) при зміні статусу або скануванні активу.
- Розробка UI екрану **Map** за допомогою `react-native-maps` (використовувати супутниковий вид `mapType="satellite"`).
- Відображення активів як пінів на мапі з кластеризацією.

### Фаза 4: BLE Scan та Прив'язка тегів
- **[Підтверджено]** Використання стандартних BLE-маячків (Option A).
- Налаштування `react-native-ble-plx` та дозволів Bluetooth.
- Розробка сканера BLE ефіру.
- **Алгоритм роботи з мітками:**
  1. Створення тестової збірки для сканування та тестування мітки з Amazon.
  2. Розробка UI для екрану **Tag Assignment**.
  3. Реалізація екрану радару: відстеження RSSI (потужності сигналу) для оцінки **відстані** до мітки (Hot/Cold принцип).
  4. **Обмеження:** Стандартний BLE дозволяє визначати лише відстань. Визначити точний **напрямок** (стрілочку, куди йти) технічно неможливо без дорогих міток з UWB-чіпом.

### Фаза 5: Pick Ticket Add-on (Local MVP)
Цей додатковий модуль розбито на 3 етапи. Дані зберігаються виключно локально (bez backend-синхронізації).

**Stage 1: Data Import & Dashboard**
- Налаштування `papaparse` для читання CSV-файлів.
- Створення Zustand store (`useTicketStore`) з `persist` для збереження квитків у пам'яті пристрою.
- Створення екрану **Ticket Dashboard** з табами/фільтрами: Not Started, In Progress, Picked.

**Stage 2: Interactive Picking Workflow**
- Розробка екрану **Ticket Details**.
- Відображення списку товарів (items) для збірки.
- Інтерактивні елементи: зміна статусу на 'Picked' та ручне редагування кількості.
- Автоматичний перерахунок статусу всього квитка.

**Stage 3: Camera, PDF Export & Cleanup**
- Інтеграція `expo-image-picker` (або `expo-camera`) для додавання 1-2 фото вантажівки до квитка.
- Використання `expo-print` для генерації HTML-шаблону в PDF-документ (список товарів + фотографії).
- Інтеграція `expo-sharing` для друку або відправки PDF.
- Кнопка "Complete & Clear" для видалення квитка та фотографій з локального сховища.

### Фаза 6: Полірування та Реліз
- Інтеграція `Zustand` для зручного управління станом фільтрів та BLE-пошуку.
- Налаштування екрану **Settings** та простої форми **Feedback**.
- Фінальне тестування бізнес-логіки.
- Завантаження збірки у клієнтський TestFlight.

---

## 3. Схема Даних (PostgreSQL / Supabase)

**Table `assets`**
- `id` (UUID)
- `sku` (String, Unique)
- `name` (String)
- `quantity` (Int)
- `status` (String)
- `created_at` (Timestamp)

**Table `trackers`**
- `id` (UUID)
- `tracker_uuid` (String) - BLE UUID
- `asset_id` (UUID, Foreign Key)

**Table `asset_locations`**
- `id` (UUID)
- `asset_id` (UUID, Foreign Key)
- `latitude` (Float)
- `longitude` (Float)
- `rssi` (Int, optional)
- `detected_at` (Timestamp)
