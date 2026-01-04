import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export function getAllPosts() {
  const files = fs.readdirSync(BLOG_DIR);

  return files.map((file) => {
    const slug = file.replace(".mdx", "");
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    return { slug, ...data };
  });
}

export function getPostBySlug(slug) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const content = fs.readFileSync(filePath, "utf-8");
  const { data, content: body } = matter(content);

  return { meta: data, body };
}
