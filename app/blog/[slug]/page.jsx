import blogIndex from "@/lib/blog-index.json";
import BlogPostClient from "./post-client";
import { notFound } from "next/navigation";

export default function BlogPostPage({ params }) {
  const { slug } = params;

  const meta = blogIndex.find((p) => p.slug === slug);

  if (!meta) {
    notFound();
  }

  return <BlogPostClient meta={meta} slug={slug} />;
}
