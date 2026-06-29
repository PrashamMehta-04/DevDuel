import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/frontend',
  'apps/backend',
  'services/worker',
  'packages/*'
])
