-- 0004: демо-данные помечены флагом, чтобы их можно было показать и потом удалить одной командой.
alter table profiles add column if not exists is_demo boolean not null default false;
alter table contacts add column if not exists is_demo boolean not null default false;
