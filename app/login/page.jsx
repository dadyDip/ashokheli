"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLang } from "@/app/i18n/useLang";
import { Eye, EyeOff, Phone, Lock, ArrowRight, Shield, UserPlus } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.login}
          </h1>
          <p className="text-gray-600">
            {lang === 'bn' ? "আপনার অ্যাকাউন্টে সাইন ইন করুন" : "Sign in to your account"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={16} className="text-orange-500" />
                {t.phoneNumber}
              </label>
              <div className="relative">
                <input
                  placeholder={lang === 'bn' ? "০১XXXXXXXXX" : "01XXXXXXXXX"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-4 pl-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Lock size={16} className="text-orange-500" />
                {t.password}
              </label>
              <div className="relative">
                <input
                  placeholder={lang === 'bn' ? "আপনার পাসওয়ার্ড দিন" : "Enter your password"}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pl-12 pr-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                  aria-label={showPassword ? (lang === 'bn' ? "পাসওয়ার্ড লুকান" : "Hide password") : (lang === 'bn' ? "পাসওয়ার্ড দেখান" : "Show password")}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right pt-1">
                <button className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors">
                  {lang === 'bn' ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              disabled={loading}
              onClick={submit}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.loggingIn}
                </>
              ) : (
                <>
                  {t.loginBtn}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                {t.dontHaveAccount}{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="text-orange-600 hover:text-orange-700 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  {t.registerHere}
                  <UserPlus size={14} />
                </button>
              </p>
            </div>

            {/* Security Note */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 text-center">
                🔒 {lang === 'bn' ? "আপনার অ্যাকাউন্ট সুরক্ষিত" : "Your account is secure"}
              </p>
            </div>
          </div>
        </div>

        {/* Features/Benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">⚡</div>
            <p className="text-xs font-medium text-gray-700">
              {lang === 'bn' ? "দ্রুত লগইন" : "Quick Login"}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">🔐</div>
            <p className="text-xs font-medium text-gray-700">
              {lang === 'bn' ? "সুরক্ষিত" : "Secure"}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">🎯</div>
            <p className="text-xs font-medium text-gray-700">
              {lang === 'bn' ? "সহজ" : "Easy"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {lang === 'bn' ? "সাহায্যের প্রয়োজন?" : "Need help?"}{" "}
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              {lang === 'bn' ? "সাপোর্টে যোগাযোগ করুন" : "Contact support"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}