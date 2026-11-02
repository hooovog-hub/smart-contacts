# Smart Contacts

> Умная записная книжка для бизнесменов: богатые профили, знакомства с любых встреч, комнаты по QR и AI-помощник, который подсказывает, кому позвонить.

**Статус:** pre-MVP. Есть кликабельный прототип (`prototype/`), архитектура и каркас кода. Рабочее название, финальный бренд ещё не выбран.

---

## С чего начать

| Кто вы | Что читать первым |
|---|---|
| Основатель / новый участник | `docs/00-overview/vision.md` → `docs/01-product/PRD.md` |
| Разработчик | `docs/04-engineering/setup.md` → `docs/03-architecture/ARCHITECTURE.md` → `docs/03-architecture/data-model.md` |
| AI-агент (Claude Code и др.) | `CLAUDE.md` → `AGENTS.md` → документ своей роли в `.claude/agents/` |
| Маркетинг | `docs/05-marketing/positioning.md` → `docs/05-marketing/gtm-plan.md` |
| Дизайнер | `docs/02-design/design-system.md` → `prototype/smart-contacts-prototype.html` |

## Карта репозитория

```
smart-contacts/
├── README.md                 ← вы здесь
├── CLAUDE.md                 ← правила для AI-агентов (оркестратор)
├── AGENTS.md                 ← оргструктура агентов и как им ставить задачи
├── .claude/
│   ├── agents/               ← определения агентов (лиды и специалисты)
│   └── commands/             ← готовые процессы: /feature, /campaign, /release …
├── docs/
│   ├── 00-overview/          ← видение, глоссарий
│   ├── 01-product/           ← PRD, фичи, user stories
│   ├── 02-design/            ← дизайн-система, экраны
│   ├── 03-architecture/      ← архитектура, модель данных, API, AI, безопасность, ADR
│   ├── 04-engineering/       ← установка, соглашения, тесты, релизы
│   ├── 05-marketing/         ← позиционирование, GTM, контент, реклама, ASO
│   ├── 06-business/          ← тарифы, метрики, план валидации
│   └── 07-operations/        ← роадмап, бэклог, журнал решений
├── apps/
│   ├── mobile/               ← iOS/Android приложение (Expo, React Native)
│   └── web/                  ← веб-профиль по ссылке/QR, вход в комнату, Wallet-карты (Next.js)
├── supabase/                 ← база данных, миграции, серверные функции (AI)
├── packages/shared/          ← общие типы и константы
├── marketing/                ← рабочая папка маркетинговых агентов (брифы, контент, кампании)
├── prototype/                ← кликабельный HTML-прототип
└── .github/                  ← CI, шаблоны PR и задач
```

## Стек (кратко)

- **Мобильное приложение:** Expo + React Native + TypeScript, Expo Router.
- **Бэкенд:** Supabase (Postgres, Auth, Storage, Edge Functions, Row Level Security).
- **AI:** Claude API, вызывается только с сервера (Edge Function `ai-assistant`).
- **Веб:** Next.js на Vercel — публичные профили, вход в комнату без приложения, генерация `.pkpass`.
- **Оплата:** Apple In-App Purchase для Pro в приложении; Business — через сайт и местный эквайринг (см. ADR-0005).

Подробно: `docs/03-architecture/ARCHITECTURE.md`.

## Быстрый старт для разработчика

```bash
# 1. Зависимости
npm install                      # из корня (npm workspaces)

# 2. Переменные окружения
cp .env.example .env             # заполнить ключи Supabase и Anthropic

# 3. База данных (локально)
npx supabase start
npx supabase db reset            # применит миграции и seed

# 4. Мобильное приложение
npm run mobile                   # Expo, открыть в Expo Go на iPhone

# 5. Веб
npm run web                      # http://localhost:3000/hovhannes
```

Полная инструкция: `docs/04-engineering/setup.md`.

## Правила работы

- Источник правды по продукту — `docs/01-product/PRD.md`. Код не должен противоречить документам; если меняется решение — сначала документ, потом код.
- Каждое архитектурное решение фиксируется в `docs/03-architecture/adr/`.
- Любое решение основателя фиксируется в `docs/07-operations/decisions-log.md`.
- Задачи живут в `docs/07-operations/backlog.md` с ID вида `SC-012`.

## Владелец

Ованнес (основатель). Все продуктовые решения — за ним.
