import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijgwhumofqnvwlzipmfu.supabase.co'; // မိမိ Supabase URL ထည့်ရန်
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ3dodW1vZnFudndsemlwbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzY2NDAsImV4cCI6MjA5ODMxMjY0MH0.MxOJPZy1QZmuzmPm0QysCVKnND-1zxsmWQaWWCapcHQ'; // မိမိ Supabase Anon Key ထည့်ရန်

export const supabase = createClient(supabaseUrl, supabaseAnonKey);