-- Launch requires payment at both application and direct database boundaries.
-- Existing verified purchases and bounded operator exemptions are retained.
begin;
update commerce_private.settings set enforced = true where id;
alter table commerce_private.settings alter column enforced set default true;
commit;
