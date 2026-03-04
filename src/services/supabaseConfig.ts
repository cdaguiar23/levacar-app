import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with actual Supabase URL and Anon Key
const supabaseUrl = 'https://nvbaognztrmrphqoramb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YmFvZ256dHJtcnBocW9yYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDI0NTksImV4cCI6MjA4ODIxODQ1OX0.XNNQBDAbW62OqutVqdVyMOXziH55eAeg3wu0oMu3hpA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
