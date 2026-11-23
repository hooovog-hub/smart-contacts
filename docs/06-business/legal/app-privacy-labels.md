# App Privacy в App Store Connect: готовые ответы

Версия 1.0 · Сверено с кодом 18 ноября 2026 года (миграции 0001–0009, Edge Functions, `apps/mobile`, `apps/web/api`)

Где заполнять: App Store Connect → приложение → **App Privacy** → **Get Started** (или **Edit**). Справка Apple: [App privacy details](https://developer.apple.com/app-store/app-privacy-details/).

## Содержание

1. [Общие вопросы](#1-общие-вопросы)
2. [Сводная таблица](#2-сводная-таблица)
3. [Ответы по каждому типу данных](#3-ответы-по-каждому-типу-данных)
4. [Что НЕ отмечать](#4-что-не-отмечать)
5. [Когда ответы придётся поменять](#5-когда-ответы-придётся-поменять)
6. [Спорные места](#6-спорные-места)

## 1. Общие вопросы

| Вопрос Apple | Ответ | Почему |
|---|---|---|
| Do you or your third-party partners collect data from this app? | **Yes, we collect data from this app** | Аккаунт, профиль, контакты и AI-данные уходят на наш сервер (Supabase) и в Anthropic |
| Privacy Policy URL | https://becontact.app/privacy | Обязательное поле |
| User Privacy Choices URL (необязательно) | https://becontact.app/privacy#12-удаление-аккаунта-и-данных | Где описано удаление и отзыв согласия |
| Used for tracking (для каждого типа) | **No** | Нет рекламы, нет сторонней аналитики, нет SDK трекинга, данные не объединяются с чужими данными для рекламы, нет брокеров данных. App Tracking Transparency не нужен |

Цель для всех типов ниже — только **App Functionality**. Не отмечаем Third-Party Advertising, Developer's Advertising or Marketing, Analytics, Other Purposes.

## 2. Сводная таблица

| Раздел Apple | Data Type | Collected | Linked to User | Tracking | Purposes |
|---|---|---|---|---|---|
| Contact Info | Name | Да | Да | Нет | App Functionality |
| Contact Info | Email Address | Да | Да | Нет | App Functionality |
| Contact Info | Phone Number | Да | Да | Нет | App Functionality |
| Contact Info | Other User Contact Info | Да | Да | Нет | App Functionality |
| Contacts | Contacts | Да | Да | Нет | App Functionality |
| User Content | Photos or Videos | Да | Да | Нет | App Functionality |
| User Content | Other User Content | Да | Да | Нет | App Functionality |
| Identifiers | User ID | Да | Да | Нет | App Functionality |
| Usage Data | Product Interaction | Да | Да | Нет | App Functionality |
| Diagnostics | Crash Data | Да | Да | Нет | App Functionality |
| Diagnostics | Other Diagnostic Data | Да | Да | Нет | App Functionality |

Итог на карточке App Store: блок **Data Linked to You** с этими 11 типами; блоков **Data Used to Track You** и **Data Not Linked to You** нет.

## 3. Ответы по каждому типу данных

**Contact Info → Name.** Имя в профиле; имя от Apple при первом входе. Связано с аккаунтом. Цель: App Functionality (публичный профиль, визитка, Wallet).

**Contact Info → Email Address.** Email для входа или email от Sign in with Apple (в том числе скрытый адрес Apple); email в ссылках профиля. Связано. App Functionality.

**Contact Info → Phone Number.** Телефон в профиле (публичный). Связано. App Functionality.

**Contact Info → Other User Contact Info.** Ссылки и ники WhatsApp, Telegram, Instagram, LinkedIn в профиле. Связано. App Functionality.

**Contacts → Contacts.** Контакты из телефонной книги (имя, телефон, компания, должность, день рождения), с разрешения iOS; хранятся в книжке пользователя, видит только он; часть полей (без телефонов) уходит в Anthropic для AI-функций. Связано. App Functionality. Это не трекинг и не продажа: Apple в определении трекинга имеет в виду объединение с данными других компаний для рекламы или передачу брокерам.

**User Content → Photos or Videos.** Фото профиля, которое пользователь сам выбрал или снял (Supabase Storage). Кадры камеры при сканировании QR не сохраняются и не отправляются — их не считаем. Связано. App Functionality.

**User Content → Other User Content.** «О себе», роль, город, языки, бренды, членство, награды, «Сейчас ищу», «Чем могу помочь», рекомендации, заметки к контактам, разделы, тексты запросов к AI-помощнику и ответы, подсказки «Стоит написать сегодня», жалобы на профили (причина) и список заблокированных. Связано. App Functionality (жалобы — ещё и модерация, тоже App Functionality).

**Identifiers → User ID.** Идентификатор аккаунта Supabase и идентификатор Apple (sub) при входе через Apple. Связано. App Functionality.

**Usage Data → Product Interaction.** Таблица `ai_usage`: какая AI-функция и когда вызвана — нужно для лимитов (10 сообщений в сутки и т. п.). Связано. App Functionality. Аналитику мы на этих данных не строим; если начнём — добавить цель Analytics.

**Diagnostics → Crash Data.** Отчёты о сбоях в нашей таблице `client_errors`: текст ошибки, стек, признак фатальности. Содержит `owner_id`, поэтому связано. App Functionality.

**Diagnostics → Other Diagnostic Data.** В тех же отчётах: версия приложения, платформа, служебный контекст ошибки. Связано. App Functionality.

## 4. Что НЕ отмечать

| Data Type | Почему не отмечаем |
|---|---|
| Physical Address | Адреса из телефонной книги не загружаем; город — свободный текст профиля (учтён в Other User Content) |
| Precise Location, Coarse Location | Геолокацию не запрашиваем и не определяем |
| Health and Fitness, Sensitive Info | Не собираем как тип данных (см. спорные места — заметки) |
| Financial Info, Payment Info | Оплата пока не принимается; при IAP платёжные данные видит только Apple |
| Purchases → Purchase History | Пока нет покупок. Добавить, когда запустим IAP (SC-060) |
| Emails or Text Messages | SMS-приглашения отправляет пользователь через системное окно, мы их не получаем. Тексты-черновики AI учтены в Other User Content |
| Audio Data | Микрофон и распознавание речи в текущей сборке не используются (в `app.json` нет `NSMicrophoneUsageDescription`) |
| Search History | Запросы к AI-помощнику отнесены к Other User Content. Если Apple в ревью попросит — можно дополнительно отметить Search History, App Functionality, Linked |
| Device ID | IDFA и IDFV не собираем |
| Browsing History, Advertising Data, Other Usage Data, Performance Data | Не собираем |
| Gameplay Content, Customer Support, Environment Scanning, Hands, Head, Other Data | Не применимо. Письма в поддержку приходят на email вне приложения |

Третьи стороны: Supabase, Vercel и Anthropic — обработчики, работающие только на нас (service providers), их данные входят в ответы выше. Expo (обновления приложения) не получает пользовательских данных, кроме технических данных запроса, — отдельный тип не отмечаем.

## 5. Когда ответы придётся поменять

Обновить анкету **до** выхода сборки, в которой появляется:

- подписка In-App Purchase → **Purchase History** (Linked, App Functionality);
- встречи и комнаты с гостями → проверить, не появились ли новые типы (телефон и имя гостя уже покрыты Contact Info, но это данные третьих лиц);
- статистика «кто смотрел профиль» → **Product Interaction** с целью Analytics и, возможно, Other Usage Data;
- любой SDK аналитики, крэш-репортинга или рекламы (Sentry, Firebase и т. п.) → пересмотреть всё, включая Tracking;
- голосовой ввод → **Audio Data**;
- push-уведомления → Device ID не нужен, но токен устройства стоит описать в политике.

## 6. Спорные места

- **AI и согласие.** Guideline 5.1.2(i) требует явного разрешения перед передачей персональных данных стороннему AI. Анкета App Privacy этого не заменяет: нужен экран согласия в приложении (см. README, блокер №1).
- **Product Personalization.** Подсказки «Стоит написать сегодня» и AI-помощник — это основная функция для самого пользователя, поэтому указываем App Functionality. Более осторожный вариант — дополнительно отметить Product Personalization для Contacts и Other User Content. Решение за основателем; на трекинг это не влияет.
- **Заметки к контактам** могут содержать сведения о здоровье третьих лиц (раздел «Медицина»). Мы не собираем такие данные целенаправленно, поэтому Sensitive Info и Health не отмечаем, но в политике просим пользователей не писать лишнего.
