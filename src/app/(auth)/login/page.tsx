import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>RBAC Configuration Tool</CardTitle>
          <CardDescription>
            Sign in to manage roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Authentication system will be implemented in the next task.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
