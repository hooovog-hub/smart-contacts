# Безопасность и приватность

## Данные
| Данные | Чувствительность | Где | Доступ |
|---|---|---|---|
| Контакты из телефона | Высокая (данные третьих лиц) | `contacts` | Только владелец (RLS) |
| Заметки | Высокая | `contacts.note`, `meeting_marks` | Только владелец |
| Профиль | Публичная по выбору пользователя | `profiles` и связанные | Все |
| Переписка с AI | Средняя | `ai_messages` | Только владелец |

## Правила
1. RLS включён на каждой таблице. Новая таблица без политик не проходит ревью.
2. `service_role` ключ — только на сервере (Vercel, Edge Functions).
3. Claude API ключ — только в секретах Edge Functions.
4. Импорт контактов — только выбранных пользователем (iOS 18 limited access поддерживается).
5. В AI не отправляются телефоны и email.
6. Удаление аккаунта — полное каскадное удаление + удаление файлов из Storage.
7. Логи не содержат персональных данных.

## Apple
- `NSContactsUsageDescription`, `NSCameraUsageDescription`, `NSSpeechRecognitionUsageDescription`, `NSMicrophoneUsageDescription` — понятные тексты на RU/EN/HY.
- Privacy Nutrition Label в App Store Connect: Contacts, User Content — «не используются для трекинга».
- Удаление аккаунта внутри приложения обязательно.
