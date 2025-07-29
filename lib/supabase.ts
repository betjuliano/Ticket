import { createClient } from '@supabase/supabase-js'

// Supabase configuration should rely solely on environment variables.
// Never hard-code secrets or fallback keys in the codebase. When the required
// variables are not present the client will be initialized with empty strings,
// which will cause requests to fail fast and alert maintainers to properly
// configure the environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)