"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SubAgentGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "sub-agent")) {
      router.replace("/");
    }
  }, [user, loading]);

  if (loading || !user || user.role !== "sub-agent") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sub-agent dashboard...</p>
        </div>
      </div>
    );
  }

  return children;
}