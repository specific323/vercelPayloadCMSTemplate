import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export const revalidate = 3600

export default async function HomePage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    limit: 6,
    sort: '-publishedAt',
  }).catch(() => ({ docs: [] }))

  return (
    <div>
      <section style={{ textAlign: 'center', padding: '4rem 0 3rem', borderBottom: '1px solid #e5e7eb', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Vercel + PayloadCMS + Neon
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto 2rem' }}>
          一個使用 Payload CMS 作為 Headless CMS、Next.js App Router 前台、Vercel Neon PostgreSQL 資料庫的完整範例。
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/admin"
            style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}
          >
            進入管理後台
          </Link>
          <Link
            href="/posts"
            style={{ border: '1px solid #d1d5db', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', color: '#374151' }}
          >
            瀏覽文章
          </Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>最新文章</h2>
        {posts.docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '0.5rem', color: '#6b7280' }}>
            <p style={{ marginBottom: '1rem' }}>目前還沒有文章。</p>
            <Link href="/admin/collections/posts/create" style={{ color: '#2563eb' }}>
              建立第一篇文章 →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {posts.docs.map((post) => (
              <article key={post.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('zh-TW') : '草稿'}
                  </p>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1rem' }}>{post.excerpt}</p>
                  )}
                  <Link href={`/posts/${post.slug}`} style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 }}>
                    閱讀更多 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '4rem', background: '#f9fafb', borderRadius: '0.75rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>技術堆疊</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'Payload CMS v3', desc: 'Headless CMS + REST/GraphQL API' },
            { name: 'Next.js 15', desc: 'App Router + Server Components' },
            { name: 'Vercel Neon', desc: 'Serverless PostgreSQL 資料庫' },
            { name: 'Vercel Blob', desc: '媒體檔案存儲' },
          ].map((tech) => (
            <div key={tech.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{tech.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
