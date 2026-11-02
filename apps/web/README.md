# apps/web — веб-профили, комнаты, Wallet (Vercel Functions)

Без фреймворка: статичная страница в `public/` и серверные функции в `api/`. Маршруты задаются в `vercel.json`.

| Адрес | Функция | Что |
|---|---|---|
| `/<handle>` | `api/profile.js` | Публичный профиль (что видит человек без приложения после QR) |
| `/<handle>/vcard` | `api/vcard.js` | Скачать контакт (vCard) |
| `/r/<code>` | `api/room.js` | Вход в комнату встречи без приложения |
| `/api/wallet` | `api/wallet.js` | Генерация `.pkpass` (Apple Wallet) |

Переменные окружения (Vercel → Settings → Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), позже `NEXT_PUBLIC_SITE_URL` и `WALLET_*`.

Почему не Next.js: на Vercel сборка Next.js падала с известной ошибкой `ENOENT .../export-detail.json` (см. `docs/07-operations/decisions-log.md`, 2026-11-02). Функции проще и надёжнее для 4 маршрутов. Ответственный: `web-engineer`.
