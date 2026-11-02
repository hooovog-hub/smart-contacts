# supabase/

| Путь | Что |
|---|---|
| `config.toml` | Локальная конфигурация (создаётся `npx supabase init`) |
| `migrations/` | SQL-миграции, применяются по порядку |
| `seed.sql` | Демо-данные для локальной разработки и evals |
| `functions/ai-assistant/` | AI-помощник «кому позвонить» (Claude API) |
| `functions/classify-contacts/` | Раскладка импортированных контактов по разделам |
| `tests/` | pgTAP-тесты RLS |

Секреты функций: `npx supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...`

Ответственный агент: `backend-engineer` (схема, RLS), `ai-engineer` (функции AI).
