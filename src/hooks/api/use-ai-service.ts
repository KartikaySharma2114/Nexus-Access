import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AISuggestion {
  id: string;
  text: string;
  category: 'role' | 'permission' | 'association';
}

export interface AIHelpContent {
  examples: string[];
  tips: string[];
  commonCommands: Array<{
    command: string;
    description: string;
  }>;
}

export interface AIProcessRequest {
  command: string;
  context?: Record<string, any>;
}

export interface AIProcessResponse {
  success: boolean;
  interpretation: string;
  actions: Array<{
    type: string;
    description: string;
    data: Record<string, any>;
  }>;
  confidence: number;
}

export interface AICommandRequest {
  interpretation: string;
  actions: Array<{
    type: string;
    description: string;
    data: Record<string, any>;
  }>;
}

export interface AICommandResponse {
  success: boolean;
  results: Array<{
    action: string;
    success: boolean;
    message: string;
    data?: any;
  }>;
}

// Query keys for consistent cache management
export const aiServiceKeys = {
  all: ['ai-service'] as const,
  availability: () => [...aiServiceKeys.all, 'availability'] as const,
  suggestions: () => [...aiServiceKeys.all, 'suggestions'] as const,
  help: () => [...aiServiceKeys.all, 'help'] as const,
};

// Check AI service availability
export function useAIAvailability() {
  return useQuery({
    queryKey: aiServiceKeys.availability(),
    queryFn: () => apiClient.get<{ available: boolean }>('/ai-service/availability'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once for availability checks
  });
}

// Fetch AI suggestions
export function useAISuggestions() {
  return useQuery({
    queryKey: aiServiceKeys.suggestions(),
    queryFn: () => apiClient.get<AISuggestion[]>('/ai-service/suggestions'),
    staleTime: 10 * 60 * 1000, // 10 minutes (suggestions don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Fetch AI help content
export function useAIHelp() {
  return useQuery({
    queryKey: aiServiceKeys.help(),
    queryFn: () => apiClient.get<AIHelpContent>('/ai-service/help'),
    staleTime: 30 * 60 * 1000, // 30 minutes (help content is static)
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Process natural language command
export function useProcessAICommand() {
  return useMutation({
    mutationFn: (data: AIProcessRequest) =>
      apiClient.post<AIProcessResponse>('/ai-service/process', data),
  });
}

// Execute AI command
export function useExecuteAICommand() {
  return useMutation({
    mutationFn: (data: AICommandRequest) =>
      apiClient.post<AICommandResponse>('/ai-command', data),
  });
}