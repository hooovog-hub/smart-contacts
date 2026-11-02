# Релизы

1. `qa-lead` — вердикт GO.
2. Версия: semver в `apps/mobile/app.json` (`version`) + автоинкремент buildNumber в EAS.
3. `npx eas build --platform ios --profile production`
4. `npx eas submit --platform ios` → TestFlight.
5. Тест основателем и 5–20 тестерами.
6. App Store Connect: тексты (`docs/05-marketing/aso.md`), скриншоты, Privacy Label → отправка на ревью (только с подтверждением основателя).
7. `CHANGELOG.md` обновлён.

## Перед первой отправкой в App Review
- Демо-аккаунт для ревьюера с заполненными данными.
- Удаление аккаунта в приложении.
- Тексты разрешений (контакты, камера, микрофон, речь).
- Подписки: экран с ценой, условиями и восстановлением покупок.
