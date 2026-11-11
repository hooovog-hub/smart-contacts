# supabase/

**Проект:** `nqaooorpdptdsucgmwkg` (регион Europe) · URL: `https://nqaooorpdptdsucgmwkg.supabase.co`
Применённые миграции: 0001–0007 (последние три — 2026-11-12). Задеплоены функции: ai-assistant (v2), classify-contacts (v4), health. Секрет ANTHROPIC_API_KEY задан. Советник безопасности: осталось включить Leaked Password Protection (Auth).

| Путь | Что |
|---|---|
| `config.toml` | Локальная конфигурация (создаётся `npx supabase init`) |
| `migrations/` | SQL-миграции, применяются по порядку |
| `seed.sql` | Демо-данные для локальной разработки и evals |
| `functions/ai-assistant/` | AI-помощник «кому позвонить» (Claude API) |
| `functions/classify-contacts/` | Раскладка импортированных контактов по разделам |
| `functions/health/` | Проверка, что ключ Anthropic настроен и работает |
| `tests/` | pgTAP-тесты RLS |

Отчёты о сбоях: `select * from client_errors order by created_at desc limit 50;` в SQL editor.

Секреты функций: `npx supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...`

Ответственный агент: `backend-engineer` (схема, RLS), `ai-engineer` (функции AI).
