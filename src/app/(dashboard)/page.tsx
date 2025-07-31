import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">
          Manage your role-based access control system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Create and manage system permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Define what actions are available in your system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Create and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Define different user types and their capabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associations</CardTitle>
            <CardDescription>Link permissions to roles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Control what each role can do in the system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
