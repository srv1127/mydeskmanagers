CREATE OR REPLACE FUNCTION public.review_subscription_payment_proof(
  _proof_id UUID,
  _decision TEXT,
  _rejection_reason TEXT DEFAULT NULL
)
RETURNS public.subscription_payment_proofs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proof_row public.subscription_payment_proofs;
  reviewed_row public.subscription_payment_proofs;
  today_date DATE := CURRENT_DATE;
  renewal_date DATE;
  period_end DATE;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can review payment proofs';
  END IF;

  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review decision';
  END IF;

  SELECT * INTO proof_row
  FROM public.subscription_payment_proofs
  WHERE id = _proof_id AND status = 'pending'
  FOR UPDATE;

  IF proof_row.id IS NULL THEN
    RAISE EXCEPTION 'Payment proof is missing or already reviewed';
  END IF;

  IF _decision = 'approved' THEN
    renewal_date := make_date(EXTRACT(YEAR FROM today_date)::INTEGER, EXTRACT(MONTH FROM today_date)::INTEGER, 5);
    IF today_date >= renewal_date THEN
      renewal_date := (date_trunc('month', today_date) + INTERVAL '1 month' + INTERVAL '4 days')::DATE;
    END IF;
    period_end := renewal_date - 1;

    UPDATE public.library_subscriptions
    SET status = 'active',
        current_period_start = today_date,
        current_period_end = period_end,
        next_renewal_date = renewal_date,
        last_payment_at = now(),
        completed_at = now(),
        updated_by = auth.uid(),
        provider_reference = COALESCE(NULLIF(proof_row.provider_reference, ''), provider_reference)
    WHERE account_key = proof_row.account_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Subscription account was not found';
    END IF;
  END IF;

  UPDATE public.subscription_payment_proofs
  SET status = _decision,
      rejection_reason = CASE WHEN _decision = 'rejected' THEN NULLIF(TRIM(COALESCE(_rejection_reason, '')), '') ELSE NULL END,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _proof_id
  RETURNING * INTO reviewed_row;

  RETURN reviewed_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_subscription_payment_proof(UUID, TEXT, TEXT) TO authenticated;
