# API

Клиенты работают с Supabase напрямую (PostgREST + RLS). Отдельные эндпоинты:

| Эндпоинт | Где | Вход | Выход |
|---|---|---|---|
| `POST /functions/v1/ai-assistant` | Supabase Edge | `{ taskId?, message }` + JWT | `{ taskId, category, reply, people:[{contactId, kind, why, ask}] }` |
| `POST /functions/v1/classify-contacts` | Supabase Edge | `{ contacts:[{tmpId, name, company?, jobTitle?}] }` (≤200) | `{ results:[{tmpId, category, isTemporary}] }` |
| `GET /<handle>` | Next.js | — | Публичный профиль (SSR) |
| `GET /<handle>/vcard` | Next.js | — | `text/vcard` |
| `GET /r/<code>` | Next.js | — | Страница комнаты |
| `POST /api/rooms/<code>/join` | Next.js | `{ name, role, phone }` или JWT | `{ memberId }` |
| `GET /api/wallet` | Next.js | JWT пользователя | `application/vnd.apple.pkpass` |
| `POST /api/wallet/v1/...` | Next.js | Apple Wallet web service | Протокол обновления пропусков |
| `POST /api/billing/appstore` | Next.js | App Store Server Notifications v2 | 200 |
| `POST /api/billing/acquiring` | Next.js | Вебхук эквайринга | 200 |
