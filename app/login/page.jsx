"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // ✅ HOOK AT TOP LEVEL

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data || "Login failed");
      return;
    }

    login(data.token, data.user); // ✅ SAFE
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-gray-900/60 p-6 border border-emerald-500/20">
        <h2 className="text-2xl font-bold text-center">Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-white/10"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-white/10"
        />

        <button
          disabled={loading}
          onClick={submit}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-white/60">
          Don’t have an account?{" "}
          <span
            className="text-emerald-400 cursor-pointer"
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
