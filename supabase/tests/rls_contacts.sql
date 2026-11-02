-- pgTAP: чужой пользователь не видит чужие контакты
begin;
select plan(1);
-- TODO(test-engineer): создать двух пользователей, контакт у первого, проверить select от второго = 0 строк
select ok(true, 'placeholder');
select * from finish();
rollback;
