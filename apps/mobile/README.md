# apps/mobile — приложение (Expo)

```bash
npm run start      # Expo dev server → Expo Go на iPhone
npm run ios        # сборка в симуляторе (нужен Mac)
npx eas build -p ios --profile preview   # облачная сборка для TestFlight
```

## Структура
```
app/                         ← маршруты (Expo Router)
  _layout.tsx                ← провайдеры, тема
  (tabs)/_layout.tsx         ← плавающая панель из 4 иконок
  (tabs)/index.tsx           ← Знакомства
  (tabs)/contacts.tsx        ← Контакты (Разделы / А–Я)
  (tabs)/assistant.tsx       ← AI-помощник
  (tabs)/profile.tsx         ← Мой профиль
  person/[id].tsx            ← профиль человека
  task/[id].tsx              ← задача AI
src/
  theme/tokens.ts            ← цвета и размеры (docs/02-design/design-system.md)
  lib/supabase.ts            ← клиент Supabase
  features/<feature>/        ← api.ts, hooks.ts, components/
  i18n/                      ← тексты RU / EN / HY
```
Эталон UI: `prototype/smart-contacts-prototype.html`. Ответственный: `mobile-engineer`.
