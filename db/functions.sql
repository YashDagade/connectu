-- Create a function to execute SQL statements directly
-- This is required for the schema setup script to work
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO service_role;

-- Create triggers for the update_updated_at_column function
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION public.exec_sql IS 'A function that executes SQL statements. Only available to service_role (used for schema setup).'; 