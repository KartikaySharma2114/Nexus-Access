-- Insert sample permissions
INSERT INTO permissions (name, description) VALUES
  ('read_users', 'Permission to view user information'),
  ('write_users', 'Permission to create and update users'),
  ('delete_users', 'Permission to delete users'),
  ('read_reports', 'Permission to view reports'),
  ('write_reports', 'Permission to create and update reports'),
  ('admin_access', 'Full administrative access to the system')
ON CONFLICT (name) DO NOTHING;

-- Insert sample roles
INSERT INTO roles (name) VALUES
  ('Admin'),
  ('Manager'),
  ('User'),
  ('Viewer')
ON CONFLICT (name) DO NOTHING;

-- Create role-permission associations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE (r.name = 'Admin' AND p.name IN ('read_users', 'write_users', 'delete_users', 'read_reports', 'write_reports', 'admin_access'))
   OR (r.name = 'Manager' AND p.name IN ('read_users', 'write_users', 'read_reports', 'write_reports'))
   OR (r.name = 'User' AND p.name IN ('read_users', 'read_reports'))
   OR (r.name = 'Viewer' AND p.name IN ('read_reports'))
ON CONFLICT (role_id, permission_id) DO NOTHING;