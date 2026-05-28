import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

// ISR: 每小時重新驗證一次，確保內容更新能反映
export const revalidate = 3600

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
  if (!post) return { title: '找不到文章', description: '' }

  return {
    title: post.title,
    description: post.excerpt ?? '',
  }
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })
    const posts = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      limit: 1000,
      select: { slug: true },
    })
    return posts.docs.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

// 簡易 Lexical rich text renderer — 處理常見節點類型
function RenderNode({ node }: { node: any }): React.ReactNode {
  if (!node) return null

  switch (node.type) {
    case 'root':
      return (
        <>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </>
      )
    case 'paragraph':
      return (
        <p style={{ marginBottom: '1rem' }}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </p>
      )
    case 'heading': {
      const level = (node.tag ?? 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const sizes: Record<string, string> = { h1: '2rem', h2: '1.5rem', h3: '1.25rem', h4: '1.125rem', h5: '1rem', h6: '0.875rem' }
      const Tag = level
      return (
        <Tag style={{ marginTop: '2rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: sizes[level] }}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </Tag>
      )
    }
    case 'list':
      return node.listType === 'number' ? (
        <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </ol>
      ) : (
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </ul>
      )
    case 'listitem':
      return (
        <li>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </li>
      )
    case 'quote':
      return (
        <blockquote style={{ borderLeft: '4px solid #e5e7eb', paddingLeft: '1rem', color: '#6b7280', fontStyle: 'italic', margin: '1.5rem 0' }}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </blockquote>
      )
    case 'link':
      return (
        <a href={node.fields?.url ?? '#'} style={{ color: '#2563eb', textDecoration: 'underline' }} target={node.fields?.newTab ? '_blank' : undefined} rel={node.fields?.newTab ? 'noopener noreferrer' : undefined}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </a>
      )
    case 'text': {
      let text: React.ReactNode = node.text ?? ''
      if (node.format & 1) text = <strong>{text}</strong>
      if (node.format & 2) text = <em>{text}</em>
      if (node.format & 8) text = <u>{text}</u>
      if (node.format & 16) text = <s>{text}</s>
      if (node.format & 32) text = <code style={{ background: '#f3f4f6', padding: '0.1em 0.3em', borderRadius: '0.25rem', fontSize: '0.875em', fontFamily: 'monospace' }}>{text}</code>
      return text
    }
    default:
      return null
  }
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
            {post.tags.map((item: { tag?: string | null }) => (
              <span key={item.tag ?? Math.random()} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>
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
        {post.content && (
          <RenderNode node={(post.content as any)?.root ?? post.content} />
        )}
      </div>
    </article>
  )
}
