import { RoleList } from '@/components/roles';

export default function RolesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Create, view, update, and delete roles in your RBAC system.
          </p>
        </div>
        <RoleList />
      </div>
    </div>
  );
}
