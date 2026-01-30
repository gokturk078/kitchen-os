import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use placeholder values during build time to prevent crashes
// These MUST be set correctly in your Vercel Environment Variables for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only warn if we're not in a build/prerender context and keys are missing
if (typeof window !== 'undefined' && (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder'))) {
    console.error(
        '⚠️ Supabase credentials not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
    );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
