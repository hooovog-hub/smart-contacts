# supabase/

**Проект:** `nqaooorpdptdsucgmwkg` (регион Europe) · URL: `https://nqaooorpdptdsucgmwkg.supabase.co`
Применённые миграции: 0001_init, 0002_private_helper_functions. Задеплоены функции: ai-assistant, health. Секрет ANTHROPIC_API_KEY задан. Советник безопасности: замечаний нет.

| Путь | Что |
|---|---|
| `config.toml` | Локальная конфигурация (создаётся `npx supabase init`) |
| `migrations/` | SQL-миграции, применяются по порядку |
| `seed.sql` | Демо-данные для локальной разработки и evals |
| `functions/ai-assistant/` | AI-помощник «кому позвонить» (Claude API) |
| `functions/classify-contacts/` | Раскладка импортированных контактов по разделам |
| `functions/health/` | Проверка, что ключ Anthropic настроен и работает |
| `tests/` | pgTAP-тесты RLS |

Секреты функций: `npx supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...`

Ответственный агент: `backend-engineer` (схема, RLS), `ai-engineer` (функции AI).
