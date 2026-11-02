-- 0003: AI-раскладка контактов по разделам
-- category_locked: пользователь сам выбрал раздел — AI его больше не трогает
-- ai_sorted_at: когда AI последний раз разложил контакт
alter table contacts add column if not exists category_locked boolean not null default false;
alter table contacts add column if not exists ai_sorted_at timestamptz;
-- "Без раздела" — новое имя для unsorted в системных разделах не нужно: unsorted — виртуальный раздел в клиенте
