import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '所有文章',
}

export default async function PostsPage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 20,
  }).catch(() => ({ docs: [], totalDocs: 0 }))

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>所有文章</h1>
        <p style={{ color: '#6b7280' }}>共 {posts.totalDocs} 篇文章</p>
      </div>

      {posts.docs.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>目前還沒有已發布的文章。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.docs.map((post) => (
            <article
              key={post.id}
              style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}
            >
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </p>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p style={{ color: '#4b5563', marginBottom: '1rem' }}>{post.excerpt}</p>
              )}
              <Link href={`/posts/${post.slug}`} style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 }}>
                閱讀更多 →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
