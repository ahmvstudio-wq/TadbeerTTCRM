import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_URL = "https://gmwogtyjqmwluspcxbzb.supabase.co";
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd29ndHlqcW13bHVzcGN4YnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODY5NjAsImV4cCI6MjA5OTg2Mjk2MH0.731hd_hytgy_FTW6z5e93Kd-DyvIrS2m1YoP0FSEj-A";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

  return createBrowserClient(url, key);
}
