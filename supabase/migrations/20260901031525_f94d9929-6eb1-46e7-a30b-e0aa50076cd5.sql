CREATE TABLE public.library_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_key text NOT NULL DEFAULT 'default' UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due')),
  plan text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL DEFAULT 499,
  currency text NOT NULL DEFAULT 'INR',
  billing_day integer NOT NULL DEFAULT 5 CHECK (billing_day BETWEEN 1 AND 28),
  current_period_start date,
  current_period_end date,
  next_renewal_date date,
  last_payment_at timestamptz,
  provider_reference text,
  completed_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.library_subscriptions TO authenticated;
GRANT ALL ON public.library_subscriptions TO service_role;

ALTER TABLE public.library_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view subscription status"
  ON public.library_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subscription status"
  ON public.library_subscriptions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER library_subscriptions_updated_at
  BEFORE UPDATE ON public.library_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.library_subscriptions (account_key, status, plan, amount, currency, billing_day)
VALUES ('default', 'pending', 'monthly', 499, 'INR', 5)
ON CONFLICT (account_key) DO NOTHING;