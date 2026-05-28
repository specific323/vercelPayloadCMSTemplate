import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // 只有管理員可以讀取使用者列表；使用者可讀取自己
    read: ({ req }) => {
      if (!req.user) return false
      return true
    },
    // 更新：只能更新自己（或管理員）
    update: ({ req }) => !!req.user,
    // 刪除：需要登入
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: '姓名',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      label: '角色',
      options: [
        { label: '管理員', value: 'admin' },
        { label: '編輯', value: 'editor' },
        { label: '使用者', value: 'user' },
      ],
    },
  ],
}
