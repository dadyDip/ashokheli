"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

export default function BlogPostClient({ meta, slug }) {
  const Post = dynamic(
    () => import(`@/content/blog/${slug}.mdx`),
    { ssr: false }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <a href="/blog" className="text-emerald-400 text-sm">
          ← Back to Blog
        </a>

        <h1 className="text-3xl font-bold mt-4">{meta.title}</h1>
        <p className="text-sm text-gray-400">{meta.description}</p>

        {meta.image && (
          <div className="relative w-full h-64 mt-6 rounded-xl overflow-hidden">
            <Image
              src={meta.image}
              alt={meta.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <article className="prose prose-invert mt-8">
          <Post />
        </article>
      </div>
    </div>
  );
}
