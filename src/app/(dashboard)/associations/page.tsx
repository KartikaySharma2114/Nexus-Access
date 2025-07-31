'use client';

import { useState } from 'react';
import { Role, Permission } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AssociationMatrix,
  RolePermissionAssigner,
  PermissionRoleViewer,
  BulkAssignmentTool,
} from '@/components/associations';

export default function AssociationsPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Role-Permission Associations</h1>
        <p className="text-gray-600 mt-2">
          Manage the relationships between roles and permissions in your system
        </p>
      </div>

      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix">Association Matrix</TabsTrigger>
          <TabsTrigger value="role-assigner">Role Assigner</TabsTrigger>
          <TabsTrigger value="permission-viewer">Permission Viewer</TabsTrigger>
          <TabsTrigger value="bulk-assignment">Bulk Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
          <AssociationMatrix />
        </TabsContent>

        <TabsContent value="role-assigner" className="space-y-6">
          <RolePermissionAssigner
            selectedRole={selectedRole || undefined}
            onRoleSelect={setSelectedRole}
          />
        </TabsContent>

        <TabsContent value="permission-viewer" className="space-y-6">
          <PermissionRoleViewer
            selectedPermission={selectedPermission || undefined}
            onPermissionSelect={setSelectedPermission}
          />
        </TabsContent>

        <TabsContent value="bulk-assignment" className="space-y-6">
          <BulkAssignmentTool />
        </TabsContent>
      </Tabs>
    </div>
  );
}
