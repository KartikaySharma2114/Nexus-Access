import { PermissionList } from '@/components/permissions';

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Permission Management</h1>
        <p className="text-gray-600 mt-2">
          Create, view, update, and delete permissions for your RBAC system.
        </p>
      </div>
      <PermissionList />
    </div>
  );
}
