UPDATE auth.users
SET email_confirmed_at = now(), confirmed_at = DEFAULT, updated_at = now()
WHERE lower(email) = 'denise.santos@uniriosead.com' AND email_confirmed_at IS NULL;