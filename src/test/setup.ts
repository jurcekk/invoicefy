import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});