# Changelog

## [0.1.0] — 2026-11-12
### Добавлено
- CI (GitHub Actions): typecheck, lint, format check, тесты на каждый PR; защита `main`.
- ESLint, Prettier, Husky + lint-staged; 53 юнит-теста (Vitest): классификация, разделы, лимиты AI, отчёты о сбоях, Wallet.
- Лимиты и rate limit для AI: `ai_usage`, `ai_consume()`, Free — 5 задач в месяц (миграция 0006).
- Отчёты о сбоях в `client_errors`, ErrorBoundary с «Попробовать снова» (миграция 0007).
- Apple Wallet карта по дизайну, кнопка «Добавить в Apple Wallet» на экране «Мой QR» (SC-050).
- Нагрузочный тест k6 (`tests/load/`).
### Изменено
- Индексы на всех внешних ключах и оптимизированные RLS-политики по советам Supabase advisors (миграция 0005).
- Чистая бизнес-логика вынесена из Edge Functions в `supabase/functions/_shared/`.
### Исправлено
- QR и ссылки на профиль вели на закрытый защитой Vercel адрес — теперь `smart-contacts.vercel.app`.
- Пустая вкладка Safari после добавления карты в Wallet — карта открывается внутри приложения.

## [0.0.1] — 2026-11-02
- Прототип v21, документация, архитектура, каркас кода, команда агентов.
