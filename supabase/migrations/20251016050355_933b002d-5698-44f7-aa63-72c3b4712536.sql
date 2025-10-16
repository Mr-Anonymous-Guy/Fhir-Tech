-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'reviewer')),
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create AYUSH mappings table
CREATE TABLE public.ayush_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ayush_code TEXT NOT NULL,
  ayush_term TEXT NOT NULL,
  icd11_code TEXT NOT NULL,
  icd11_title TEXT NOT NULL,
  icd11_foundation_uri TEXT,
  mapping_status TEXT DEFAULT 'pending' CHECK (mapping_status IN ('pending', 'approved', 'rejected', 'under_review')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ayush_mappings
ALTER TABLE public.ayush_mappings ENABLE ROW LEVEL SECURITY;

-- AYUSH mappings policies (all authenticated users can read, only authenticated can create/update)
CREATE POLICY "Anyone can view AYUSH mappings"
  ON public.ayush_mappings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create AYUSH mappings"
  ON public.ayush_mappings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own AYUSH mappings"
  ON public.ayush_mappings FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = reviewed_by);

CREATE POLICY "Users can delete their own AYUSH mappings"
  ON public.ayush_mappings FOR DELETE
  USING (auth.uid() = created_by);

-- Create NAMASTE mappings table
CREATE TABLE public.namaste_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namaste_code TEXT NOT NULL,
  namaste_term TEXT NOT NULL,
  icd11_code TEXT NOT NULL,
  icd11_title TEXT NOT NULL,
  icd11_foundation_uri TEXT,
  mapping_status TEXT DEFAULT 'pending' CHECK (mapping_status IN ('pending', 'approved', 'rejected', 'under_review')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on namaste_mappings
ALTER TABLE public.namaste_mappings ENABLE ROW LEVEL SECURITY;

-- NAMASTE mappings policies
CREATE POLICY "Anyone can view NAMASTE mappings"
  ON public.namaste_mappings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create NAMASTE mappings"
  ON public.namaste_mappings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own NAMASTE mappings"
  ON public.namaste_mappings FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = reviewed_by);

CREATE POLICY "Users can delete their own NAMASTE mappings"
  ON public.namaste_mappings FOR DELETE
  USING (auth.uid() = created_by);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ayush_mappings_updated_at
  BEFORE UPDATE ON public.ayush_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_namaste_mappings_updated_at
  BEFORE UPDATE ON public.namaste_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to log audit trail for AYUSH mappings
CREATE OR REPLACE FUNCTION public.log_ayush_mapping_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, user_id, user_email)
    VALUES ('ayush_mappings', OLD.id, 'DELETE', row_to_json(OLD), auth.uid(), auth.email());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id, user_email)
    VALUES ('ayush_mappings', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid(), auth.email());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_values, user_id, user_email)
    VALUES ('ayush_mappings', NEW.id, 'INSERT', row_to_json(NEW), auth.uid(), auth.email());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log audit trail for NAMASTE mappings
CREATE OR REPLACE FUNCTION public.log_namaste_mapping_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, user_id, user_email)
    VALUES ('namaste_mappings', OLD.id, 'DELETE', row_to_json(OLD), auth.uid(), auth.email());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id, user_email)
    VALUES ('namaste_mappings', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid(), auth.email());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_values, user_id, user_email)
    VALUES ('namaste_mappings', NEW.id, 'INSERT', row_to_json(NEW), auth.uid(), auth.email());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit triggers for AYUSH mappings
CREATE TRIGGER ayush_mappings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ayush_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ayush_mapping_changes();

-- Create audit triggers for NAMASTE mappings
CREATE TRIGGER namaste_mappings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.namaste_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_namaste_mapping_changes();

-- Create storage bucket for bulk uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('mapping-uploads', 'mapping-uploads', false);

-- Storage policies for file uploads
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mapping-uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mapping-uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mapping-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );