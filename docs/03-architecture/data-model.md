# Модель данных

Источник правды — миграции в `supabase/migrations/`. Этот документ объясняет смысл.

## Таблицы

| Таблица | Назначение | Ключевые поля | Кто видит |
|---|---|---|---|
| `profiles` | Публичный профиль пользователя (1:1 с auth.users) | handle, full_name, role, bio, city, languages[], phone, links jsonb, plan, avatar_url | Все (публичные поля), редактирует владелец |
| `brands` | Бренды/компании профиля | profile_id, name, sphere, description, founded_year, team_size, offer, links jsonb, position | Все, если plan ≠ free |
| `organizations` | Клубы, палаты, ассоциации | name, kind, verified | Все |
| `memberships` | Членство профиля | profile_id, organization_id, org_name, status_title, since_year, verified | Все, если plan ≠ free |
| `awards` | Награды и достижения | profile_id, title, kind, year, source | Все, если plan ≠ free |
| `endorsements` | Рекомендации | from_profile, to_profile, text | Все |
| `categories` | Разделы книжки пользователя | owner_id, key, name, icon, color, position, is_system | Владелец |
| `contacts` | Контакты в книжке | owner_id, linked_profile_id?, display_name, phone, role, category_key, note, source, is_temporary, expires_at | **Только владелец** |
| `rooms` | Комнаты встреч | owner_id, title, kind, place, starts_at, code | Участники |
| `room_members` | Участники комнаты | room_id, profile_id? / guest_name, guest_role, guest_phone | Участники комнаты |
| `meeting_marks` | «Говорили / нет» после встречи | owner_id, room_id, member_id, talked | Владелец |
| `ai_tasks` | Задачи AI | owner_id, title, category, status, helper_contact_id | Владелец |
| `ai_messages` | Переписка в задаче | task_id, role, content, people jsonb | Владелец |
| `teams`, `team_members` | Business: команды | owner_id, name / team_id, profile_id, role | Члены команды |

## Перечисления
- `plan`: free · pro · business
- `contact_source`: phonebook · qr · room · manual
- `award_kind`: medal · cert · press · talk · case
- `task_category`: biz · personal · friends · family · med · home
- `task_status`: open · done

## Принципы
- `contacts` — частные данные владельца. Связь с профилем (`linked_profile_id`) не даёт владельцу профиля доступа к записи.
- Раздел сообщества в книжке — вычисляемый: контакты, у чьих профилей есть подтверждённое членство в организации.
- Удаление аккаунта удаляет всё каскадно (требование App Store).
