# Valtir Mobile App 📦📡

Valtir — це мобільний додаток для трекінгу та інвентаризації активів з використанням Bluetooth (BLE) міток та GPS-локацій. 

## 🛠 Технологічний стек

**Frontend:**
- [React Native](https://reactnative.dev/) (через [Expo](https://expo.dev/) з Custom Dev Client)
- **Мова:** TypeScript
- **Навігація:** React Navigation
- **Стан (State Management):** Zustand (глобальний стан, BLE) + React Query (кешування та синхронізація API)
- **Форми:** React Hook Form

**Backend (BaaS):**
- [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)

**Специфічні модулі:**
- **BLE (Bluetooth):** `react-native-ble-plx` (пошук міток, прив'язка, моніторинг сигналу)
- **Локація:** `react-native-geolocation-service` (отримання GPS координат)
- **Карти:** `react-native-maps` (відображення активів)

---

## 🚀 Основний функціонал (V1)
1. **Інвентаризація:** Перегляд, додавання та редагування активів.
2. **BLE Трекінг:** Сканування ефіру, зчитування UUID міток та прив'язка їх до конкретного активу.
3. **GPS Локація:** Фіксація останньої відомої локації активу при скануванні або редагуванні.
4. **Мапа:** Перегляд усіх активів на карті (піни з локаціями).
5. **CSV Імпорт:** Масове завантаження бази інвентарю.

---

## ⚙️ Початок роботи (Development)

Оскільки додаток використовує нативні модулі для Bluetooth (`react-native-ble-plx`), розробка ведеться через **Expo Development Build (Custom Dev Client)**. Ви не можете використовувати стандартний додаток Expo Go.

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Налаштування змінних оточення
Створіть файл `.env` у корені проекту та додайте ключі Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Збірка Dev Client
Для запуску на фізичному пристрої вам потрібен Dev Client.

**Якщо ви розробляєте на Mac:**
```bash
npx expo run:ios
```

**Якщо ви розробляєте на Windows (хмарна збірка через EAS):**
1. Переконайтеся, що ви залогінені в Expo (`npx eas login`).
2. Запустіть хмарну збірку:
```bash
eas build --profile development --platform ios
```
3. Після завершення збірки встановіть додаток на свій iPhone (через QR-код).

### 4. Запуск локального сервера
Коли Dev Client встановлено на телефон, запустіть локальний сервер:
```bash
npx expo start --dev-client
```
Відскануйте QR-код з терміналу вашим пристроєм, і додаток завантажиться з підтримкою Hot Reload.

---

## 📱 Дистрибуція
Для відправки готової збірки клієнту у TestFlight:
```bash
eas build --profile production --platform ios
eas submit -p ios
```
