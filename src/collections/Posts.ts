import type { CollectionConfig, Where } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'author'],
  },
  access: {
    read: ({ req }): boolean | Where => {
      if (req.user) return true
      return {
        and: [
          { status: { equals: 'published' } } as Where,
          { publishedAt: { less_than_equal: new Date().toISOString() } } as Where,
        ],
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '標題',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL)',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: '摘要',
    },
    {
      name: 'content',
      type: 'richText',
      label: '內容',
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      label: '封面圖片',
      relationTo: 'media',
    },
    {
      name: 'author',
      type: 'relationship',
      label: '作者',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: '標籤',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      label: '狀態',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已發布', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '發布時間',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: (data) => data?.status === 'published',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.status === 'published' && !data.publishedAt) {
          return { ...data, publishedAt: new Date().toISOString() }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
