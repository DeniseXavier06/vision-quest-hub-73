DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_policies WHERE schemaname='public' AND policyname='staff_all' LOOP
    EXECUTE format('ALTER POLICY staff_all ON public.%I USING ((SELECT public.is_staff())) WITH CHECK ((SELECT public.is_staff()))', t);
  END LOOP;
END $$;
ALTER POLICY staff_select_analises ON public.analises USING ((SELECT public.is_staff()));