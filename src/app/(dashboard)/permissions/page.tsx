import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Permission Management</CardTitle>
          <CardDescription>
            Create, view, update, and delete permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Permission management interface will be implemented in upcoming
            tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
