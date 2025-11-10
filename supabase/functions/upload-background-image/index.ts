import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 获取用户认证信息
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 验证用户身份
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // 获取上传的图片数据
    const { imageData, fileName } = await req.json();
    
    if (!imageData || !fileName) {
      throw new Error('Missing image data or file name');
    }

    // 将 base64 数据转换为 Blob
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];
    const decodedData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // 生成安全的文件名（使用ASCII字符）
    const timestamp = Date.now();
    const safeFileName = `${user.id}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('background-images')
      .upload(safeFileName, decodedData, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from('background-images')
      .getPublicUrl(safeFileName);

    // 更新用户设置中的背景图片URL
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        background_image_url: publicUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Update settings error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        data: { 
          publicUrl,
          message: 'Image uploaded successfully' 
        } 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = {
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
