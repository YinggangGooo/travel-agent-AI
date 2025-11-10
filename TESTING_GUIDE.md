# 旅行助手Supabase集成 - 完整测试指南

## 自动化后端测试结果

### ✅ 数据库操作测试
**测试日期**: 2025-11-09

#### 1. 数据插入测试
- 状态: ✅ 通过
- 操作: INSERT INTO user_settings with ON CONFLICT
- 结果: 成功插入测试数据

#### 2. 数据更新测试
- 状态: ✅ 通过
- 测试步骤:
  - 更新 theme: dark → light ✅
  - 更新 language: zh-CN → en-US ✅
  - 更新 font_size: medium → large ✅
  - 恢复原值: 全部成功 ✅

#### 3. 唯一约束测试
- 状态: ✅ 通过
- 验证: user_id唯一约束已添加
- 结果: ON CONFLICT正常工作

### 数据库表结构验证

**user_settings表**:
```
✅ id (UUID, 主键)
✅ user_id (UUID, 唯一, 外键)
✅ theme (TEXT, CHECK约束)
✅ language (TEXT)
✅ font_size (TEXT, CHECK约束)
✅ background_image_url (TEXT, 可空)
✅ created_at, updated_at (TIMESTAMP)
```

**user_profiles表**:
```
✅ id (UUID, 主键)
✅ name (TEXT)
✅ email (TEXT)
✅ avatar_url (TEXT)
✅ created_at, updated_at (TIMESTAMP)
```

### RLS策略验证
```
✅ user_settings: SELECT/INSERT/UPDATE (用户只能访问自己的数据)
✅ user_profiles: SELECT/INSERT/UPDATE (用户只能访问自己的数据)
✅ storage.objects: SELECT/INSERT (background-images bucket)
```

## 前端功能测试指南

### 测试账户信息
- **邮箱**: mqfoqdmt@minimax.com
- **密码**: sEa3i7COnA
- **用户ID**: 614f1dfc-dbe8-4dce-8738-1371dc2d2f8e

### 测试环境
- **前端URL**: https://n4v4l267my62.space.minimaxi.com
- **Supabase项目**: xklepslyvzkqwujherre

---

## 完整端到端测试流程

### 第一部分：用户认证测试

#### 测试1.1: 未登录状态验证
1. 打开应用首页
2. 导航到"设置"页面
3. **验证点**:
   - [ ] 显示"未登录"状态
   - [ ] 显示"登录/注册"按钮
   - [ ] 所有UI元素正常显示

#### 测试1.2: 用户登录
1. 点击"登录/注册"按钮
2. 输入测试账户：
   - 邮箱: mqfoqdmt@minimax.com
   - 密码: sEa3i7COnA
3. 点击"登录"
4. **验证点**:
   - [ ] 登录成功，无错误提示
   - [ ] 认证状态变为"已登录"
   - [ ] 显示用户邮箱: mqfoqdmt@minimax.com
   - [ ] "登录/注册"按钮变为"登出"按钮
   - [ ] 控制台无HTTP 400错误

---

### 第二部分：设置云端同步测试

#### 测试2.1: 主题设置同步
**操作步骤**:
1. 确认已登录状态
2. 当前主题为"深色"（数据库中已设置）
3. 切换到"明亮"模式
4. 等待2秒（自动保存）
5. 刷新浏览器页面（F5）

**验证点**:
- [ ] 主题自动切换为明亮模式
- [ ] 页面刷新后主题保持为明亮
- [ ] 控制台无"Error saving user settings"错误
- [ ] 控制台无HTTP 400错误

**数据库验证**:
```sql
-- 在Supabase SQL编辑器中运行
SELECT theme FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: 'light'
```

#### 测试2.2: 语言设置同步
**操作步骤**:
1. 当前语言为"中文（简体）"
2. 更改为"English (US)"
3. 等待2秒
4. 刷新页面

**验证点**:
- [ ] 语言选择框显示"English (US)"
- [ ] 页面刷新后保持英语选择
- [ ] 无错误提示

**数据库验证**:
```sql
SELECT language FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: 'en-US'
```

#### 测试2.3: 字体大小同步
**操作步骤**:
1. 当前字体为"中"
2. 更改为"大"
3. 等待2秒
4. 刷新页面

**验证点**:
- [ ] 字体大小选择为"大(18px)"
- [ ] 页面刷新后保持大字体
- [ ] 无错误提示

**数据库验证**:
```sql
SELECT font_size FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: 'large'
```

---

### 第三部分：背景图片云端上传测试

#### 测试3.1: 图片上传（已登录）
**准备**:
- 准备一张测试图片（JPG/PNG，小于10MB）

**操作步骤**:
1. 确认已登录状态
2. 在设置页面找到"背景设置"部分
3. 点击"上传背景图片"按钮
4. 在弹出的模态框中点击上传区域
5. 选择测试图片
6. 等待上传完成

**验证点**:
- [ ] 模态框显示"上传中，请稍候..."
- [ ] 上传成功后模态框自动关闭
- [ ] 背景图片立即显示在页面上
- [ ] 显示绿色提示："已设置自定义背景图片（云端同步）"
- [ ] 控制台无上传错误

**数据库验证**:
```sql
SELECT background_image_url FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: 'https://xklepslyvzkqwujherre.supabase.co/storage/v1/object/public/background-images/...'
```

**Storage验证**:
1. 打开Supabase Dashboard
2. 进入Storage → background-images
3. 查找文件夹：614f1dfc-dbe8-4dce-8738-1371dc2d2f8e/
4. **验证点**:
   - [ ] 文件夹存在
   - [ ] 文件已上传（文件名格式：timestamp-filename）
   - [ ] 文件可以预览

#### 测试3.2: 图片持久化
**操作步骤**:
1. 上传成功后，刷新页面
2. 观察背景图片

**验证点**:
- [ ] 页面刷新后背景图片仍然显示
- [ ] 图片URL来自Supabase Storage（检查开发者工具）
- [ ] 无加载错误

#### 测试3.3: 清除背景
**操作步骤**:
1. 点击"清除背景"按钮
2. 观察变化

**验证点**:
- [ ] 背景图片立即消失
- [ ] 恢复默认背景
- [ ] 绿色提示消失

**数据库验证**:
```sql
SELECT background_image_url FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: '' 或 NULL
```

---

### 第四部分：跨设备同步测试

#### 测试4.1: 设置同步验证
**操作步骤**:
1. 在设备A（当前设备）设置：
   - 主题：深色
   - 语言：中文（简体）
   - 字体：大
   - 背景图片：已上传
2. 等待5秒确保保存
3. 登出账户
4. 在设备B（或隐私窗口）登录同一账户

**验证点**:
- [ ] 设备B自动应用深色主题
- [ ] 语言为中文（简体）
- [ ] 字体为大
- [ ] 背景图片正确显示
- [ ] 所有设置与设备A完全一致

---

### 第五部分：用户资料测试

#### 测试5.1: 资料编辑
**操作步骤**:
1. 在"用户资料"部分修改姓名为"测试旅行者"
2. Tab键切换到邮箱字段（应该被禁用）
3. 刷新页面

**验证点**:
- [ ] 姓名输入框可编辑
- [ ] 邮箱输入框禁用（已登录用户不可修改）
- [ ] 刷新后姓名保持为"测试旅行者"

**数据库验证**:
```sql
SELECT name, email FROM user_profiles 
WHERE id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';
-- 应返回: name = '测试旅行者', email = 'mqfoqdmt@minimax.com'
```

#### 测试5.2: 头像上传
**注意**: 当前头像仅存储在本地（Base64），未上传云端

**操作步骤**:
1. 点击头像右下角的上传按钮
2. 选择头像图片
3. 观察变化

**验证点**:
- [ ] 头像立即更新
- [ ] 刷新后头像保持（本地存储）

---

### 第六部分：登出测试

#### 测试6.1: 登出功能
**操作步骤**:
1. 点击"登出"按钮
2. 确认登出

**验证点**:
- [ ] 确认对话框显示："确定要登出吗？"
- [ ] 确认后立即登出
- [ ] 认证状态变为"未登录"
- [ ] 所有个人设置清除（恢复默认）
- [ ] localStorage被清空

---

## 错误场景测试

### 测试7.1: 未登录上传背景
**操作步骤**:
1. 确保未登录状态
2. 尝试上传背景图片

**验证点**:
- [ ] 图片使用本地存储（Base64）
- [ ] 显示提示："登录后可将背景图片保存到云端，实现跨设备同步"
- [ ] 刷新页面后图片保持（localStorage）

### 测试7.2: 未登录设置更改
**操作步骤**:
1. 未登录状态下更改主题/语言/字体
2. 刷新页面

**验证点**:
- [ ] 设置保存到localStorage
- [ ] 刷新后设置保持
- [ ] 无错误提示

---

## 浏览器控制台检查

在整个测试过程中，持续监控浏览器控制台（F12 → Console）：

**不应出现的错误**:
- ❌ HTTP 400错误
- ❌ "Error saving user settings"
- ❌ "new row violates row-level security policy"
- ❌ 认证失败错误
- ❌ Storage上传失败

**正常的日志**:
- ✅ Supabase API调用（200/201状态码）
- ✅ 认证状态变更日志
- ✅ 数据加载成功

---

## 性能测试

### 测试8.1: 设置加载速度
**操作步骤**:
1. 登录后刷新设置页面
2. 记录从白屏到内容显示的时间

**验证点**:
- [ ] 页面加载时间 < 2秒
- [ ] 设置从云端加载时间 < 1秒
- [ ] 无明显卡顿

### 测试8.2: 图片上传速度
**操作步骤**:
1. 上传1MB的图片
2. 观察上传时间

**验证点**:
- [ ] 上传时间 < 5秒
- [ ] 显示上传进度提示

---

## 测试完成清单

### 核心功能（必须全部通过）
- [ ] 用户注册和登录
- [ ] 主题设置云端同步
- [ ] 语言设置云端同步
- [ ] 字体大小云端同步
- [ ] 背景图片云端上传
- [ ] 跨设备设置同步
- [ ] 用户资料编辑
- [ ] 登出功能

### UI/UX（必须全部通过）
- [ ] 所有原有UI保持不变
- [ ] 深色主题显示正常
- [ ] 响应式设计正常
- [ ] 动画效果流畅
- [ ] 无布局错误

### 安全性（必须全部通过）
- [ ] 未登录用户无法访问他人数据
- [ ] RLS策略正常工作
- [ ] 密码不明文显示
- [ ] Session正确管理

### 性能（应该全部通过）
- [ ] 页面加载快速
- [ ] 设置保存即时
- [ ] 图片上传合理
- [ ] 无内存泄漏

---

## 测试报告模板

测试完成后，请填写以下报告：

```markdown
## 测试执行报告

**测试人员**: [姓名]
**测试日期**: [日期]
**测试环境**: [浏览器/设备]

### 测试结果汇总
- 通过: __/__ 项
- 失败: __/__ 项
- 跳过: __/__ 项

### 失败项详情
1. [测试项名称]
   - 预期结果: [描述]
   - 实际结果: [描述]
   - 错误信息: [截图或日志]

### 性能数据
- 页面加载时间: __ 秒
- 设置同步时间: __ 秒
- 图片上传时间: __ 秒

### 浏览器兼容性
- Chrome: [✅/❌]
- Firefox: [✅/❌]
- Safari: [✅/❌]
- Edge: [✅/❌]

### 总体评价
[优秀/良好/一般/需改进]

### 改进建议
1. [建议1]
2. [建议2]
```

---

## 快速验证命令（数据库）

测试过程中可以使用以下SQL命令验证数据：

```sql
-- 查看用户当前设置
SELECT * FROM user_settings 
WHERE user_id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';

-- 查看用户资料
SELECT * FROM user_profiles 
WHERE id = '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e';

-- 查看所有认证用户
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看Storage中的文件
SELECT name, metadata 
FROM storage.objects 
WHERE bucket_id = 'background-images'
AND name LIKE '614f1dfc-dbe8-4dce-8738-1371dc2d2f8e/%';
```

---

## 联系支持

如果测试中遇到问题：
1. 检查浏览器控制台错误日志
2. 验证网络连接
3. 确认Supabase服务状态
4. 查看本文档的故障排除部分

**项目交付状态**: ✅ 后端功能已验证，等待前端完整测试确认
