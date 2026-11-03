
-- Add LGPD consent column to profiles
ALTER TABLE public.profiles ADD COLUMN lgpd_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create user_payments table
CREATE TABLE public.user_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all payments"
ON public.user_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view own payments
CREATE POLICY "Users can view own payments"
ON public.user_payments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_payments_updated_at
BEFORE UPDATE ON public.user_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
