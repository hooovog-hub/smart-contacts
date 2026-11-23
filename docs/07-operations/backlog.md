# Бэклог

Статусы: `todo` · `doing` · `review` · `done`. Приоритет: P0 (MVP) … P3.

| ID | Задача | Этап | P | Агент | Статус | Что осталось (аудит 2026-11-12) |
|---|---|---|---|---|---|---|
| SC-001 | Интервью-гайд и список 15 респондентов | 0 | P0 | ux-researcher | todo | В репозитории следов нет — уточнить у основателя |
| SC-002 | Лендинг с листом ожидания | 0 | P0 | web-engineer | todo | Есть `apps/web/public/index.html`, листа ожидания нет |
| SC-003 | Тест Meta $50–100 | 0 | P0 | ads-manager | todo | Уточнить у основателя |
| SC-004 | Варианты названия и проверка доступности | 0 | P1 | brand-designer | done | 2026-11-24: BeContact, логотип в `Identity/` |
| SC-010 | Миграция 0001 + RLS + seed | 1 | P0 | backend-engineer | done | |
| SC-011 | Вход (телефон / Apple ID) | 1 | P0 | mobile-engineer | review | 2026-11-16: «Продолжить с Apple» сделан (`features/sign-in.md`). Нужно: включить Apple в Supabase, проверить на iPhone. Вход по телефону не начат — решение основателя (SMS платные) |
| SC-012 | Экран «Мой профиль» + редактирование | 1 | P0 | mobile-engineer | done | Бренды и членство редактируются |
| SC-013 | Веб-профиль `/<handle>` + vCard | 1 | P0 | web-engineer | done | Работает на Vercel |
| SC-014 | Мой QR | 1 | P0 | mobile-engineer | done | |
| SC-015 | Индексы и RLS по советам Supabase advisors (миграция 0005) | 1 | P0 | backend-engineer | done | Применено, 63 замечания закрыты |
| SC-016 | Отчёты о сбоях: client_errors, ErrorBoundary, глобальный обработчик | 1 | P0 | mobile-engineer | done | Таблица создана; приложению нужно обновление (EAS update), чтобы начало слать отчёты |
| SC-017 | Лимиты и rate limit для AI (ai_usage, 5 задач/мес на Free) | 1 | P0 | ai-engineer | done | Миграция 0006 применена, ai-assistant v2 и classify-contacts v4 задеплоены 2026-11-12; проверить живым запросом с iPhone |
| SC-018 | Нагрузочный тест k6 | 1 | P1 | test-engineer | review | Скрипт готов, не запускался |
| SC-019 | CI, ESLint/Prettier, pre-commit, юнит-тесты, защита main | 1 | P0 | release-manager | done | |
| SC-020 | Импорт контактов + classify-contacts | 2 | P0 | mobile-engineer, ai-engineer | done | Импорт с телефона и AI-раскладка работают |
| SC-021 | Книжка: чипы, «Ещё», разделы, А–Я | 2 | P0 | mobile-engineer | doing | Есть разделы, А–Я и поиск; не нашёл кнопку «Ещё» с сеткой всех разделов |
| SC-022 | Профиль человека (чужой) | 2 | P0 | mobile-engineer | done | |
| SC-030 | Комнаты: создание, QR, вход гостя | 3 | P2 | backend-engineer, web-engineer | backlog | Комнаты видно (демо-данные), но создать комнату в приложении нельзя; веб-страница входа гостя — заглушка |
| SC-031 | «Вспомнить всех» | 3 | P2 | mobile-engineer | backlog | Экран комнаты с отметкой «говорили» есть; нужна проверка на реальной встрече |
| SC-032 | «Стоит написать сегодня» на главной | 3 | P0 | mobile-engineer, ai-engineer | review | 0.2.0: функция `daily-picks`, вкладка «Сегодня» |
| SC-040 | Edge Function ai-assistant + evals | 4 | P0 | ai-engineer | review | Работает; evals не прогонялись автоматически |
| SC-041 | Экран задач AI, архив, разделы | 4 | P0 | mobile-engineer | doing | Задачи, экран задачи, «решено» есть; нет выбора «кто помог» |
| SC-042 | Голосовой ввод в доке | 4 | P0 | integrations-engineer | todo | Кнопка микрофона пока показывает подсказку про диктовку клавиатуры |
| SC-050 | Wallet-карта | 5 | P1 | integrations-engineer | done | Сертификат Apple настроен, карта проверена на iPhone 2026-11-12. У пользователей появится после EAS update (SC-052) |
| SC-051 | Автообновление Wallet-карты при изменении профиля | 5 | P2 | integrations-engineer | todo | Wallet web service + APNs |
| SC-052 | EAS update: публичный адрес для QR + кнопка Wallet у пользователей | 5 | P2 | release-manager | done | 2026-11-16: не понадобился — первая сборка (build 1) уже содержит исправления; канал `production` настроен для будущих обновлений |
| SC-053 | Пересохранить WALLET_SIGNER_KEY_B64 и WALLET_LINK_SECRET в Vercel как Secret | 5 | P2 | release-manager | todo | Сейчас тип Config (видно в панели Vercel) |
| SC-060 | IAP Pro | 5 | P0 | integrations-engineer | todo | |
| SC-061 | Business: команды, оплата через сайт | 5 | P1 | backend-engineer | todo | Таблицы teams есть, экранов нет |
| SC-070 | Политика конфиденциальности и условия | 6 | P0 | legal-privacy-advisor | doing | 2026-11-18: черновики RU/EN, страницы и ссылки в ветке `feat/SC-070-privacy-terms`; публикация после SC-100…105 |
| SC-071 | Страница App Store | 6 | P0 | aso-seo-specialist | todo | |
| SC-072 | Удаление аккаунта в приложении (требование Apple) | 6 | P0 | mobile-engineer, backend-engineer | review | 2026-11-16: кнопка в профиле + Edge Function `delete-account` с отзывом токенов Apple (`features/account-deletion.md`). Нужно: задеплоить функцию, ключ Apple .p8 в секреты, проверить на iPhone |
| SC-073 | Не отдавать handle удалённого аккаунта новому человеку (старые QR и Wallet-карты) | 6 | P1 | backend-engineer | todo | Ревью безопасности 2026-11-16. Срок блокировки — решение основателя |
| SC-074 | Лимит AI не должен сбрасываться удалением аккаунта | 5 | P2 | ai-engineer | todo | Ревью безопасности 2026-11-16; счётчик по хэшу Apple sub / email |
| SC-090 | «Вас ищут»: согласие «видно знакомым знакомых» + Настройки → Приватность | 7 | P1 | mobile-engineer, backend-engineer | todo | Спецификация `features/needs-matching.md` (2026-11-16). Зависит от `profile_seeks` (параллельный пакет) |
| SC-091 | Связи между пользователями: совпадение номеров (взаимно), QR, комнаты; таблица `connections` | 7 | P1 | backend-engineer | todo | Сначала проверка юристом сравнения телефонных книг (SC-070, App Store 5.1.1) |
| SC-092 | Подбор «Ищу ↔ Помогу»: SQL-отбор + ранжирование Claude, `seek_matches` | 7 | P1 | ai-engineer, backend-engineer | todo | В AI — без имён/телефонов; свой серверный лимит |
| SC-093 | Лента «Вас ищут» на главной + оффер (одно сообщение) с «Принять / Нет» | 7 | P1 | mobile-engineer, backend-engineer | todo | Офферы только Pro/Business; 10 в сутки + правило качества (решение 2026-11-18) |
| SC-094 | Жалобы, двусторонний блок, лимиты офферов, заморозка после 3 жалоб | 7 | P1 | backend-engineer, mobile-engineer | todo | Требование App Store 1.2 — без этого фичу не выпускаем |
| SC-095 | Push-уведомления: «Новое предложение», «Принято», сводка «Вас ищут» 1 раз в сутки | 7 | P2 | integrations-engineer | todo | Push-инфраструктуры в приложении пока нет |
| SC-096 | Макеты: экран согласия, блок и список «Вас ищут», оффер, приватность | 7 | P1 | ui-designer | todo | По прототипу; варианты на выбор основателю |
| SC-097 | Чат по офферу внутри приложения | 7 | P3 | mobile-engineer, backend-engineer | backlog | Решение 2026-11-18: позже, только если пользователи попросят. Нужны жалобы на сообщения и блок (Apple 1.2) |
| SC-080 | Вкладка «Сегодня»: Познакомиться (QR/сканер), дни рождения, новые знакомства | 3 | P0 | mobile-engineer | review | 0.2.0, `features/today.md` |
| SC-081 | Приглашения: ссылка/код, SMS выбранным, бонус 10 = +1 месяц | 5 | P0 | mobile-engineer, backend-engineer | review | 0.2.0, `features/invites.md`; нужен `INVITE_INSTALL_URL` в Vercel |
| SC-082 | Профиль на месте: фото, «Сейчас ищу», «Чем могу помочь», Wallet рядом с фото | 2 | P0 | mobile-engineer | review | 0.2.0, `features/profile.md` |
| SC-083 | Фото профиля на Wallet-карте (нужен PNG-thumbnail) | 5 | P2 | integrations-engineer | todo | Сейчас фото на карте нет |
| SC-084 | «Повод написать»: новости по сферам → кому переслать | 3 | P2 | product-lead | backlog | Решение 2026-11-16: пока не делаем |
| SC-100 | Согласие на AI перед первым использованием + выключатель AI | 6 | P0 | mobile-engineer, ai-engineer | doing | 2026-11-24: окно согласия, выключатель, проверка на сервере (0013 + guard.ts); не выкачено | Apple 5.1.2(i); политика это обещает |
| SC-101 | Пожаловаться / заблокировать пользователя | 6 | P0 | mobile-engineer, backend-engineer | doing | 2026-11-24: миграция 0014 + кнопки под чужим профилем; жалобы читает команда в Supabase (24 ч); не выкачено |
| SC-102 | Убрать плашку «✓ Профиль проверен» | 6 | P0 | mobile-engineer, web-engineer | done | Никто не проверяет — вводит в заблуждение |
| SC-103 | Закрыть массовую выгрузку телефонов из `profiles` | 6 | P0 | backend-engineer | done | 2026-11-24: 0011+0012 применены; номер — profile_phone() (50 чел./день), vCard 20/час на IP; проверено на iPhone |
| SC-104 | Удалить контакт / все импортированные в приложении | 6 | P0 | mobile-engineer | doing | 2026-11-24: «Удалить контакт» в карточке, «Удалить все импортированные из телефона» в книжке; не выкачено |
| SC-105 | Автоочистка `client_errors` старше 12 месяцев | 6 | P1 | backend-engineer | done | 2026-11-24: миграция 0010 применена (pg_cron, 03:17 ежедневно) |
| SC-106 | Свой номер в WhatsApp/Telegram (режим «другой номер») лежит в публичной `links` | 6 | P1 | backend-engineer | todo | Из security-review SC-103: выгружается одним запросом |
| SC-107 | `room_members.guest_phone` видят все участники комнаты | 7 | P2 | backend-engineer | todo | Сверить с security-privacy.md |
| SC-108 | Объяснять, почему номер не показан (дневной лимит 50) | 6 | P2 | mobile-engineer | todo | Сейчас кнопки звонка просто пропадают |
| SC-109 | Перебор `invite_code` (код виден всем) | 7 | P2 | backend-engineer | todo | Риск низкий, при ревизии наград за приглашения |
| SC-110 | «Профиль недоступен» вместо пустого экрана, если профиль скрыт блокировкой или удалён | 6 | P2 | mobile-engineer | todo | Из security-review SC-101 |
| SC-111 | Удалять имена удалённых контактов из истории AI-чатов (`ai_messages`) | 7 | P2 | backend-engineer | todo | Сейчас предупреждаем в тексте подтверждения |

## Где мы сейчас
См. `docs/07-operations/status.md` — сводка и следующие шаги.
