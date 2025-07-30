import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NaturalLanguagePage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Natural Language Configuration</CardTitle>
          <CardDescription>
            Configure RBAC settings using plain English commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Natural language interface will be implemented in upcoming tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
