# Как включить карту Apple Wallet

Код карты готов (`apps/web/api/wallet.js`, кнопка «Добавить в Apple Wallet» на экране «Мой QR»).
Apple принимает только карты, подписанные сертификатом разработчика, поэтому нужен один раз
сделать сертификат. Это делает основатель: аккаунт Apple и пароли — только его.

Пока сертификата нет, кнопка отвечает «Карта Wallet ещё не настроена» — приложение не ломается.

## 1. Apple Developer Program (если ещё нет)
- developer.apple.com/programs → Enroll. **$99 в год.** Тот же аккаунт понадобится для TestFlight и App Store.
- Как частное лицо — 1–2 дня. Как компания — нужен D-U-N-S номер, дольше.

## 2. Pass Type ID
developer.apple.com → Certificates, Identifiers & Profiles → **Identifiers** → «+» → **Pass Type IDs**:
- Description: `Smart Contacts Card`
- Identifier: `pass.am.smartcontacts.card`

## 3. Сертификат для этого Pass Type ID
1. На Mac: «Связка ключей» → меню «Ассистент сертификации» → «Запросить сертификат у бюро сертификации». Email — ваш, «Сохранён на диске». Получится файл `.certSigningRequest`.
2. На сайте Apple откройте созданный Pass Type ID → **Create Certificate** → загрузите этот файл → скачайте `pass.cer`.
3. Дважды кликните `pass.cer` — он попадёт в «Связку ключей». Найдите его там («Pass Type ID: pass.am.smartcontacts.card»), правый клик → **Экспортировать** → формат `.p12`, задайте пароль.
4. Скачайте промежуточный сертификат Apple **WWDR G4**: apple.com/certificateauthority → «Worldwide Developer Relations - G4» → файл `AppleWWDRCAG4.cer`.

## 4. Ключи на сервер
В терминале, в папке проекта:

```bash
bash scripts/wallet-certs.sh ~/Downloads/pass.p12 ~/Downloads/AppleWWDRCAG4.cer
```

Скрипт спросит пароль от `.p12` и положит значения в `wallet-secrets/` (в git не попадает).
Вставьте их в Vercel → проект `smart-contacts` → Settings → Environment Variables (Production):

| Переменная | Значение |
|---|---|
| `WALLET_PASS_TYPE_ID` | `pass.am.smartcontacts.card` |
| `WALLET_TEAM_ID` | Team ID из developer.apple.com → Membership |
| `WALLET_SIGNER_CERT_B64` | из `wallet-secrets/WALLET_SIGNER_CERT_B64.txt` |
| `WALLET_SIGNER_KEY_B64` | из `wallet-secrets/WALLET_SIGNER_KEY_B64.txt` |
| `WALLET_WWDR_CERT_B64` | из `wallet-secrets/WALLET_WWDR_CERT_B64.txt` |
| `WALLET_LINK_SECRET` | из `wallet-secrets/WALLET_LINK_SECRET.txt` |

Потом: Deployments → Redeploy, и удалить папку `wallet-secrets/`.

## 5. Проверка
На iPhone с тарифом Pro: «Мой профиль» → «Мой QR» → «Добавить в Apple Wallet» → Safari покажет карту → «Добавить».

## Как это устроено
- Приложение просит у сервера ссылку (с сессией пользователя) → сервер отвечает подписанной ссылкой на 5 минут → Safari открывает её и получает `.pkpass`. Пароль/сессия в адрес не попадают.
- Карта: графит `#161618`, логотип Smart Contacts, имя, «роль · компания», телефон, email, QR на профиль — по дизайну «Smart Contacts — Wallet-карта» (claude.ai).
- Двойное нажатие боковой кнопки открывает Wallet; сверху банковская карта по умолчанию, визитка — в списке карт под ней (так устроен iOS: «по двойному нажатию» Apple ставит только платёжные карты).
- Автообновление карты при изменении профиля — отдельная задача SC-051 (нужен Wallet web service + push).
