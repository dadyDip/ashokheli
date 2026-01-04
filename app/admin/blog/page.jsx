"use client";

import { useState } from "react";

export default function AdminBlogEditor() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("/images/card-game.jpg");
  const [content, setContent] = useState("");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Blog Post</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="space-y-4">
            <input
              className="w-full p-3 bg-gray-800 rounded"
              placeholder="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                );
              }}
            />

            <input
              className="w-full p-3 bg-gray-800 rounded"
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />

            <input
              className="w-full p-3 bg-gray-800 rounded"
              placeholder="Image path"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />

            <textarea
              className="w-full h-32 p-3 bg-gray-800 rounded"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <textarea
              className="w-full h-64 p-3 bg-gray-800 rounded font-mono"
              placeholder="MDX Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* RIGHT */}
          <div className="bg-gray-800 rounded p-4">
            <h2 className="font-semibold mb-2">Preview</h2>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {content || "Start writing..."}
            </pre>
          </div>
        </div>

        <button
          className="mt-6 bg-emerald-600 px-6 py-3 rounded hover:bg-emerald-700"
          onClick={async () => {
            await fetch("/api/admin/blog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                slug,
                description,
                image,
                content,
              }),
            });
            alert("Blog saved!");
          }}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
