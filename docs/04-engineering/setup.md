# Установка и запуск

## Что нужно
- Node.js 22+, npm 10+
- Для iOS-симулятора: Xcode из App Store (`sudo xcode-select -s /Applications/Xcode.app`)
- Git, аккаунт GitHub
- Supabase CLI (`npx supabase`), Docker (для локальной БД)
- Аккаунт Expo (EAS) и приложение Expo Go на iPhone
- Для Wallet и App Store: Apple Developer Program

## Шаги
1. `git clone <repo> && cd smart-contacts && npm install && npm ci --prefix apps/mobile && npm install --prefix apps/web`
2. `cp .env.example .env` и заполнить.
3. `npx supabase start` → `npx supabase db reset` (миграции + `supabase/seed.sql`).
4. Секреты функций: `npx supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...`
5. `npx supabase functions serve` — функции локально.
6. `npm run mobile` → QR в терминале → Expo Go.
7. `npm run web` → http://localhost:3000/hovhannes

## Проверки качества
| Команда (из корня) | Что делает |
|---|---|
| `npm run typecheck` | Типы: мобильное приложение, `packages/shared`, чистая логика Edge Functions |
| `npm run lint` | ESLint по всему репозиторию (ошибки ломают CI, `any` — пока предупреждение) |
| `npm run format` / `format:check` | Prettier: отформатировать / проверить |
| `npm test` | Юнит-тесты (Vitest) |
| `npm run check` | Всё вышеперечисленное — то же, что запускает CI |

Перед каждым коммитом Husky запускает `lint-staged` (eslint --fix + prettier на изменённых файлах).
CI (`.github/workflows/ci.yml`) запускает `typecheck · lint · test` на каждый PR и push в `main`.

## Аккаунты, которые заводит основатель
| Сервис | Зачем | Стоимость на старте |
|---|---|---|
| GitHub | Код | 0 |
| Supabase | БД, авторизация, функции | 0 (Free), далее $25/мес |
| Expo | Сборки | 0 (Free) |
| Vercel | Веб-профили | 0 (Hobby) |
| Anthropic | Claude API | по факту, на тестах — единицы $ |
| Apple Developer | TestFlight, App Store, Wallet | $99/год |
