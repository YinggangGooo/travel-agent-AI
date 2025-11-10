import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xklepslyvzkqwujherre.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbGVwc2x5dnprcXd1amhlcnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDM0MDcsImV4cCI6MjA3ODIxOTQwN30.LCRcIalEOBjH22-Umn0QQxrDtwyCgcbZiC5ta31GY0o";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
