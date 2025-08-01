# Component Documentation

## Core Components

### PermissionList

Displays all permissions in a data table with search, filtering, and CRUD operations.

**Props:**

- None (fetches data internally)

**Features:**

- Real-time updates via Supabase subscriptions
- Search by name/description
- Create, edit, delete permissions
- Pagination support

### RoleList

Displays all roles in a data table with management capabilities.

**Props:**

- None (fetches data internally)

**Features:**

- Real-time updates
- Search functionality
- Role CRUD operations
- Shows permission count per role

### AssociationMatrix

Visual matrix showing role-permission relationships.

**Props:**

- None (fetches data internally)

**Features:**

- Toggle associations with click
- Visual indicators for assigned permissions
- Bulk assignment capabilities
- Real-time synchronization

### NaturalLanguageInput

AI-powered command input for RBAC operations.

**Props:**

- `onCommandExecuted?: () => void` - Callback after successful command

**Features:**

- Natural language processing
- Command suggestions
- Execution history
- Error handling with recovery suggestions

## UI Components

### DataTable

Reusable data table component with sorting, filtering, and pagination.

**Props:**

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
}
```

### StatusIndicator

Shows status with colored indicators.

**Props:**

```typescript
interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending';
  label?: string;
}
```

### ConfirmationDialog

Reusable confirmation dialog for destructive actions.

**Props:**

```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}
```

### LoadingSpinner

Loading indicator component.

**Props:**

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

## Form Components

### PermissionForm

Modal form for creating/editing permissions.

**Props:**

```typescript
interface PermissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission | null;
  onSuccess: () => void;
}
```

### RoleForm

Modal form for creating/editing roles.

**Props:**

```typescript
interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: () => void;
}
```

## Layout Components

### DashboardLayout

Main layout wrapper for authenticated pages.

**Features:**

- Navigation sidebar
- Header with user menu
- Responsive design
- Error boundaries

### ConditionalLayout

Conditionally renders layout based on authentication status.

**Features:**

- Shows login page for unauthenticated users
- Renders dashboard layout for authenticated users
- Handles loading states

## Error Components

### ErrorBoundary

React error boundary for handling unhandled errors.

**Props:**

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}
```

### ErrorFallback

Default error fallback component.

**Features:**

- User-friendly error messages
- Retry functionality
- Development error details
- Recovery suggestions

## Authentication Components

### AuthProvider

Context provider for authentication state.

**Features:**

- Session management
- User state tracking
- Authentication helpers

### LoginForm

Login form component.

**Features:**

- Email/password authentication
- Form validation
- Error handling
- Loading states

## Usage Examples

### Basic Permission Management

```tsx
import { PermissionList } from '@/components/permissions/permission-list';

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Permissions</h1>
      <PermissionList />
    </div>
  );
}
```

### Custom Data Table

```tsx
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

export function UserTable({ users }: { users: User[] }) {
  return (
    <DataTable
      data={users}
      columns={columns}
      searchPlaceholder="Search users..."
    />
  );
}
```

### Error Boundary Usage

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function App() {
  return (
    <ErrorBoundary>
      <YourAppContent />
    </ErrorBoundary>
  );
}
```
