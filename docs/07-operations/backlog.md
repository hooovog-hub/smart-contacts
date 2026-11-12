# Бэклог

Статусы: `todo` · `doing` · `review` · `done`. Приоритет: P0 (MVP) … P3.

| ID | Задача | Этап | P | Агент | Статус | Что осталось (аудит 2026-11-12) |
|---|---|---|---|---|---|---|
| SC-001 | Интервью-гайд и список 15 респондентов | 0 | P0 | ux-researcher | todo | В репозитории следов нет — уточнить у основателя |
| SC-002 | Лендинг с листом ожидания | 0 | P0 | web-engineer | todo | Есть `apps/web/public/index.html`, листа ожидания нет |
| SC-003 | Тест Meta $50–100 | 0 | P0 | ads-manager | todo | Уточнить у основателя |
| SC-004 | Варианты названия и проверка доступности | 0 | P1 | brand-designer | todo | Название — открытый вопрос в decisions-log |
| SC-010 | Миграция 0001 + RLS + seed | 1 | P0 | backend-engineer | done | |
| SC-011 | Вход (телефон / Apple ID) | 1 | P0 | mobile-engineer | doing | Работает вход по email и паролю; нет входа по телефону и Apple ID |
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
| SC-030 | Комнаты: создание, QR, вход гостя | 3 | P0 | backend-engineer, web-engineer | doing | Комнаты видно (демо-данные), но создать комнату в приложении нельзя; веб-страница входа гостя — заглушка |
| SC-031 | «Вспомнить всех» | 3 | P0 | mobile-engineer | doing | Экран комнаты с отметкой «говорили» есть; нужна проверка на реальной встрече |
| SC-032 | «Стоит написать сегодня» на главной | 3 | P0 | mobile-engineer | todo | Не найдено в коде |
| SC-040 | Edge Function ai-assistant + evals | 4 | P0 | ai-engineer | review | Работает; evals не прогонялись автоматически |
| SC-041 | Экран задач AI, архив, разделы | 4 | P0 | mobile-engineer | doing | Задачи, экран задачи, «решено» есть; нет выбора «кто помог» |
| SC-042 | Голосовой ввод в доке | 4 | P0 | integrations-engineer | todo | Кнопка микрофона пока показывает подсказку про диктовку клавиатуры |
| SC-050 | Wallet-карта | 5 | P1 | integrations-engineer | done | Сертификат Apple настроен, карта проверена на iPhone 2026-11-12. У пользователей появится после EAS update (SC-052) |
| SC-051 | Автообновление Wallet-карты при изменении профиля | 5 | P2 | integrations-engineer | todo | Wallet web service + APNs |
| SC-052 | EAS update: публичный адрес для QR + кнопка Wallet у пользователей | 5 | P0 | release-manager | todo | Без него у установленных приложений QR ведёт на закрытый адрес Vercel |
| SC-053 | Пересохранить WALLET_SIGNER_KEY_B64 и WALLET_LINK_SECRET в Vercel как Secret | 5 | P2 | release-manager | todo | Сейчас тип Config (видно в панели Vercel) |
| SC-060 | IAP Pro | 5 | P0 | integrations-engineer | todo | |
| SC-061 | Business: команды, оплата через сайт | 5 | P1 | backend-engineer | todo | Таблицы teams есть, экранов нет |
| SC-070 | Политика конфиденциальности и условия | 6 | P0 | legal-privacy-advisor | todo | |
| SC-071 | Страница App Store | 6 | P0 | aso-seo-specialist | todo | |
| SC-072 | Удаление аккаунта в приложении (требование Apple) | 6 | P0 | mobile-engineer | todo | Не найдено в коде; без него App Store отклонит |

## Где мы сейчас (аудит 2026-11-12)
- **Этапы 1–2 (Основа, Книжка)** почти готовы: не хватает входа по телефону/Apple ID и кнопки «Ещё».
- **Этапы 3–4 (Встречи, AI)** сделаны наполовину: нет создания комнат, входа гостя, «Стоит написать сегодня», голоса.
- **Этапы 5–6 (Деньги, Запуск)** почти не начаты.
- **Этап 0 (Валидация)** — статус неизвестен, в репозитории следов нет.
