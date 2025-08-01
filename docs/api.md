# API Documentation

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-app.vercel.app/api`

## Authentication

All API endpoints require authentication via Supabase session cookies.

## Permissions API

### GET /api/permissions

Get all permissions with optional search and pagination.

**Query Parameters:**

- `query` (optional): Search term for name/description
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "read_users",
      "description": "Read user data",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### POST /api/permissions

Create a new permission.

**Request Body:**

```json
{
  "name": "read_users",
  "description": "Read user data"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "read_users",
    "description": "Read user data",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Permission created successfully"
}
```

### PUT /api/permissions/[id]

Update an existing permission.

### DELETE /api/permissions/[id]

Delete a permission.

## Roles API

### GET /api/roles

Get all roles with optional search and pagination.

### POST /api/roles

Create a new role.

**Request Body:**

```json
{
  "name": "admin"
}
```

### PUT /api/roles/[id]

Update an existing role.

### DELETE /api/roles/[id]

Delete a role and all its associations.

## Associations API

### GET /api/associations

Get all role-permission associations.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "role_id": "uuid",
      "permission_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/associations

Create a role-permission association.

**Request Body:**

```json
{
  "role_id": "uuid",
  "permission_id": "uuid"
}
```

### DELETE /api/associations

Remove a role-permission association.

## AI Command API

### POST /api/ai-command

Process natural language commands for RBAC operations.

**Request Body:**

```json
{
  "command": "Create admin role with read_users and write_users permissions"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Command executed successfully",
  "actions": [
    {
      "type": "create_role",
      "data": { "name": "admin" }
    },
    {
      "type": "assign_permissions",
      "data": { "role": "admin", "permissions": ["read_users", "write_users"] }
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "User-friendly error message",
  "details": "Additional error details",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate name)
- `500` - Internal Server Error
