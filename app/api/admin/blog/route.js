import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const INDEX_FILE = path.join(process.cwd(), "lib/blog-index.json");

export async function POST(req) {
  const { title, slug, description, image, content } = await req.json();

  if (!slug) {
    return Response.json({ error: "Slug required" }, { status: 400 });
  }

  // Ensure blog directory
  fs.mkdirSync(BLOG_DIR, { recursive: true });

  // Write MDX file
  fs.writeFileSync(
    path.join(BLOG_DIR, `${slug}.mdx`),
    `# ${title}\n\n${content}\n`
  );

  // Read index
  let posts = [];
  if (fs.existsSync(INDEX_FILE)) {
    posts = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  }

  // Remove duplicate
  posts = posts.filter((p) => p.slug !== slug);

  // Add new post
  posts.unshift({
    slug,
    title,
    description,
    image,
    date: new Date().toISOString().slice(0, 10),
  });

  // Write index
  fs.writeFileSync(
    INDEX_FILE,
    JSON.stringify(posts, null, 2)
  );

  return Response.json({ success: true });
}
