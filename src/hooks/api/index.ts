// Role hooks
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  roleKeys,
  type Role,
  type RoleFilters,
} from './use-roles';

// Permission hooks
export {
  usePermissions,
  usePermission,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  permissionKeys,
  type Permission,
  type PermissionFilters,
} from './use-permissions';

// Association hooks
export {
  useAssociations,
  useAssociationMatrix,
  useCreateAssociation,
  useDeleteAssociation,
  useBulkCreateAssociations,
  useBulkDeleteAssociations,
  associationKeys,
  type Association,
  type AssociationFilters,
} from './use-associations';

// Dashboard hooks
export {
  useDashboardStats,
  dashboardKeys,
  type DashboardStats,
} from './use-dashboard';

// AI Service hooks
export {
  useAIAvailability,
  useAISuggestions,
  useAIHelp,
  useProcessAICommand,
  useExecuteAICommand,
  aiServiceKeys,
  type AISuggestion,
  type AIHelpContent,
  type AIProcessRequest,
  type AIProcessResponse,
  type AICommandRequest,
  type AICommandResponse,
} from './use-ai-service';
