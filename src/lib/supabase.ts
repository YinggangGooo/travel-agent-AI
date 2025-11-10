import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xklepslyvzkqwujherre.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbGVwc2x5dnprcXd1amhlcnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDM0MDcsImV4cCI6MjA3ODIxOTQwN30.LCRcIalEOBjH22-Umn0QQxrDtwyCgcbZiC5ta31GY0o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 用户设置相关类型
export interface UserSettings {
  id?: string;
  user_id?: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  font_size: 'small' | 'medium' | 'large';
  background_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// 用户资料相关类型
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// 获取用户设置
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
}

// 保存用户设置
export async function saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error saving user settings:', error);
    return false;
  }

  return true;
}

// 获取用户资料
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// 保存用户资料
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (error) {
    console.error('Error saving user profile:', error);
    return false;
  }

  return true;
}

// 上传背景图片
export async function uploadBackgroundImage(file: File): Promise<string | null> {
  try {
    // 获取当前用户的session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // 将文件转换为 base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 调用 Edge Function 上传图片
    const { data, error } = await supabase.functions.invoke('upload-background-image', {
      body: {
        imageData: base64Data,
        fileName: file.name
      }
    });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    return data.data.publicUrl;
  } catch (error) {
    console.error('Error in uploadBackgroundImage:', error);
    return null;
  }
}
