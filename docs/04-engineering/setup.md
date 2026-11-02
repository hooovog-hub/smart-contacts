# Установка и запуск

## Что нужно
- Node.js 20+, npm 10+
- Git, аккаунт GitHub
- Supabase CLI (`npx supabase`), Docker (для локальной БД)
- Аккаунт Expo (EAS) и приложение Expo Go на iPhone
- Для Wallet и App Store: Apple Developer Program

## Шаги
1. `git clone <repo> && cd smart-contacts && npm install`
2. `cp .env.example .env` и заполнить.
3. `npx supabase start` → `npx supabase db reset` (миграции + `supabase/seed.sql`).
4. Секреты функций: `npx supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...`
5. `npx supabase functions serve` — функции локально.
6. `npm run mobile` → QR в терминале → Expo Go.
7. `npm run web` → http://localhost:3000/hovhannes

## Аккаунты, которые заводит основатель
| Сервис | Зачем | Стоимость на старте |
|---|---|---|
| GitHub | Код | 0 |
| Supabase | БД, авторизация, функции | 0 (Free), далее $25/мес |
| Expo | Сборки | 0 (Free) |
| Vercel | Веб-профили | 0 (Hobby) |
| Anthropic | Claude API | по факту, на тестах — единицы $ |
| Apple Developer | TestFlight, App Store, Wallet | $99/год |
