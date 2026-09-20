CREATE TABLE public.subscription_payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_key TEXT NOT NULL DEFAULT 'default',
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payer_name TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 499,
  provider_reference TEXT,
  proof_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_payment_proofs TO authenticated;
GRANT UPDATE ON public.subscription_payment_proofs TO authenticated;
GRANT ALL ON public.subscription_payment_proofs TO service_role;

ALTER TABLE public.subscription_payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can submit payment proofs"
ON public.subscription_payment_proofs
FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Members can view their own payment proofs"
ON public.subscription_payment_proofs
FOR SELECT TO authenticated
USING (submitted_by = auth.uid());

CREATE POLICY "Admins can review payment proofs"
ON public.subscription_payment_proofs
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment proofs"
ON public.subscription_payment_proofs
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER subscription_payment_proofs_updated_at
BEFORE UPDATE ON public.subscription_payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can upload their own payment proof files"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'subscription-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Members can view their own payment proof files"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'subscription-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can review payment proof files"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'subscription-proofs'
  AND private.has_role(auth.uid(), 'admin'::app_role)
);
