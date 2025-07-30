import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RolesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Create, view, update, and delete roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Role management interface will be implemented in upcoming tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
