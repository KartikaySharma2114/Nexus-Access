-- Enable Row Level Security on all tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create functions in public schema
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, all authenticated users are considered admins
  -- This can be modified later to check specific roles or metadata
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions table policies
CREATE POLICY "Authenticated users can view permissions" ON permissions
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admin users can insert permissions" ON permissions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can update permissions" ON permissions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin users can delete permissions" ON permissions
  FOR DELETE USING (public.is_admin());

-- Roles table policies
CREATE POLICY "Authenticated users can view roles" ON roles
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admin users can insert roles" ON roles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can update roles" ON roles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin users can delete roles" ON roles
  FOR DELETE USING (public.is_admin());

-- Role permissions table policies
CREATE POLICY "Authenticated users can view role permissions" ON role_permissions
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admin users can insert role permissions" ON role_permissions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can delete role permissions" ON role_permissions
  FOR DELETE USING (public.is_admin());

-- User roles table policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin users can insert user roles" ON user_roles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can delete user roles" ON user_roles
  FOR DELETE USING (public.is_admin());