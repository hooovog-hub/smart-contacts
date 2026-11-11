# Соглашения

## Код
- TypeScript strict, без `any`.
- Имена: компоненты `PascalCase`, хуки `useXxx`, файлы экранов по маршруту Expo Router.
- Фичи: `apps/mobile/src/features/<feature>/{api.ts,hooks.ts,components/,utils.ts}`.
- Все цвета и размеры — из `src/theme/tokens.ts`.
- Тексты интерфейса — через `src/i18n/` (ключи), не хардкодом.
- Даты — ISO в БД, локальный формат на экране.

## Git
- Ветки: `feat/SC-021-contacts-az`, `fix/SC-045-...`, `docs/...`.
- Коммиты: Conventional Commits (`feat(contacts): add A–Z rail`).
- PR: шаблон `.github/PULL_REQUEST_TEMPLATE.md`, ссылка на SC-ID, скриншоты для UI.
- В `main` нельзя пушить напрямую: только через PR с зелёным CI (`typecheck · lint · test`).
- Бизнес-логику пишем чистыми функциями без сети/БД (`*.logic.ts`, `supabase/functions/_shared/`) и покрываем тестами.

## База
- Одна миграция — одно логическое изменение, имя `NNNN_описание.sql`.
- После миграции: `npm run db:types`.
