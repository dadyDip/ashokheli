"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLang } from "@/app/i18n/useLang";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, lang } = useLang();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!phone || !password) {
      alert(t.requiredFields);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data?.error || "Login failed");
        return;
      }

      login(data.token, data.user);
      router.push("/dashboard");

    } catch (err) {
      setLoading(false);
      alert(t.serverError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 border border-gray-300 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{t.login}</h2>
          {lang === 'bn' && (
            <p className="text-sm text-gray-600">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          )}
        </div>

        {/* Phone Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t.phoneNumber}
          </label>
          <input
            placeholder={lang === 'bn' ? "০১XXXXXXXXX" : "01XXXXXXXXX"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Password Input with Show/Hide */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t.password}
          </label>
          <div className="relative">
            <input
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          disabled={loading}
          onClick={submit}
          className="w-full py-3 rounded-lg bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? t.loggingIn : t.loginBtn}
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600">
          {t.dontHaveAccount}{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {t.registerHere}
          </button>
        </p>
      </div>
    </div>
  );
}