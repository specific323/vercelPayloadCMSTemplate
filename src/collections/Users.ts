import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
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
