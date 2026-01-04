"use client";

import { MDXProvider } from "@mdx-js/react";

export default function MDXContent({ children }) {
  return (
    <MDXProvider>
      {children}
    </MDXProvider>
  );
}
