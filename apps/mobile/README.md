# apps/mobile — приложение (Expo SDK 58)

Работает в **Expo Go** (без нативных модулей вне Expo Go). Голосовая запись в доке появится в собственной сборке (EAS Build).

## Запуск
```bash
npm install
npx expo start          # QR → Expo Go на iPhone
eas update --branch preview --message "..."   # опубликовать JS-обновление для Expo Go
```

## Структура
```
app/
  _layout.tsx            ← AuthProvider + редиректы (вход → создание профиля → вкладки)
  sign-in.tsx            ← вход по почте и паролю
  onboarding.tsx         ← создание профиля (имя, адрес профиля, роль, телефон)
  (tabs)/index.tsx       ← Знакомства
  (tabs)/contacts.tsx    ← Контакты: импорт из телефона, Разделы / А–Я, чипы
  (tabs)/assistant.tsx   ← AI-помощник: последние 2 + архив, док ввода
  (tabs)/profile.tsx     ← Мой профиль: бренды, членство, QR, поделиться
  profile/edit.tsx, profile/qr.tsx, contact/[id].tsx, task/[id].tsx
src/
  lib/ (supabase, auth, config, types, sections)  components/ (ui, Icon, Dock)  features/assistant.ts  theme/tokens.ts
```
Конфигурация Supabase и адрес сайта — в `app.json → expo.extra` (publishable key безопасен в клиенте, данные защищает RLS).
