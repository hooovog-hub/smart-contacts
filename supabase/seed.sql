-- Демо-данные для локальной разработки и AI evals.
-- Полный набор демо-людей из прототипа: prototype/smart-contacts-prototype.html (массив P).
-- TODO(backend-engineer): сгенерировать auth.users + profiles + contacts из прототипа скриптом scripts/seed-from-prototype.ts
insert into organizations(name,kind,verified) values
 ('Бизнес-клуб «Манташянц»','club',true),
 ('Палата адвокатов Армении','chamber',true),
 ('Союз строителей Армении','association',true)
on conflict do nothing;
