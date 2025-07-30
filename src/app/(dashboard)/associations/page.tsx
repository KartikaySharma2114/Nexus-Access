import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AssociationsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Role-Permission Associations</CardTitle>
          <CardDescription>
            Assign permissions to roles and manage associations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Association management interface will be implemented in upcoming
            tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
