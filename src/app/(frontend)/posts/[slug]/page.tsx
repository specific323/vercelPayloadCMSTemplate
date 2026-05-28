import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const post = result.docs[0]
  if (!post) return { title: '找不到文章' }

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 1000,
    select: { slug: true },
  })

  return posts.docs.map((post) => ({ slug: post.slug }))
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })

  const post = result.docs[0]
  if (!post) notFound()

  return (
    <article style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/posts" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
          ← 返回文章列表
        </Link>
      </div>

      <header style={{ marginBottom: '2rem' }}>
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {post.tags.map((item: { tag?: string | null }, i: number) => (
              <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>
                {item.tag}
              </span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>{post.title}</h1>
        {post.excerpt && (
          <p style={{ fontSize: '1.125rem', color: '#4b5563', marginBottom: '1rem' }}>{post.excerpt}</p>
        )}
        <div style={{ display: 'flex', gap: '1rem', color: '#6b7280', fontSize: '0.875rem', alignItems: 'center' }}>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          )}
        </div>
      </header>

      {typeof post.featuredImage === 'object' && post.featuredImage?.url && (
        <div style={{ marginBottom: '2rem', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt ?? post.title}
            style={{ width: '100%', height: '400px', objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#374151' }}>
        {/* RichText content rendered as JSON - use @payloadcms/richtext-lexical/react for full rendering */}
        <p style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
          [Rich Text Content - 使用 @payloadcms/richtext-lexical 的 RichText 元件渲染]
        </p>
      </div>
    </article>
  )
}
