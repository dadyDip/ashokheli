import Link from "next/link";
import Image from "next/image";
import blogIndex from "@/lib/blog-index.json";
import { AnimatedCard } from "@/components/AnimatedCard";

export const metadata = {
  title: "Blog",
  description: "Updates, guides, and announcements from the platform",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Guides, updates, and behind-the-scenes insights about the platform.
          </p>
        </div>

        {/* BLOG GRID */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {blogIndex.map((post) => (
            <AnimatedCard key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-2xl overflow-hidden
                bg-gray-900/70 border border-emerald-500/20
                hover:border-emerald-400 transition"
              >
                {/* IMAGE */}
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300
                    group-hover:scale-105"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-5 flex flex-col gap-3">
                  <h2 className="text-lg font-semibold leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-sm text-gray-400 line-clamp-3">
                    {post.description}
                  </p>

                  {/* FOOTER */}
                  <div className="mt-auto pt-3 text-xs text-emerald-400">
                    Read more →
                  </div>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
}
