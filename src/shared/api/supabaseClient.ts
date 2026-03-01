import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase 클라이언트
 * - 스키마: public (기본값)
 * - 용도: 모든 테이블 접근 (contents, videos, channels 등)
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
