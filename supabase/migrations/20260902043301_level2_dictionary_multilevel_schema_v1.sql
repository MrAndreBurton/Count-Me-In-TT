alter table public.math_language_terms drop constraint if exists math_language_terms_level_check;
alter table public.math_language_terms add constraint math_language_terms_level_check check (level between 1 and 9);;
