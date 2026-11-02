# apps/web — веб-профили, комнаты, Wallet (Next.js)

| Маршрут | Что |
|---|---|
| `/[handle]` | Публичный профиль (то, что видит человек без приложения после QR) |
| `/[handle]/vcard` | Скачать контакт (vCard) |
| `/r/[code]` | Вход в комнату встречи без приложения |
| `/api/wallet` | Генерация `.pkpass` (Apple Wallet) |

`npm run dev` → http://localhost:3000. Деплой — Vercel. Ответственный: `web-engineer`, Wallet — `integrations-engineer`.
