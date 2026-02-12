"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Eye, EyeOff, User, Phone, Lock, Gift, ArrowRight, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    promoCode: "",
  });

  const splitFullName = (fullName) => {
    if (!fullName || fullName.trim() === "") return { firstName: "", lastName: "" };
    
    const trimmed = fullName.trim();
    const words = trimmed.split(/\s+/);
    
    if (words.length === 1) {
      const mid = Math.ceil(words[0].length / 2);
      return {
        firstName: words[0].substring(0, mid),
        lastName: words[0].substring(mid) || "User"
      };
    }
    
    return {
      firstName: words[0],
      lastName: words.slice(1).join(" ") || "User"
    };
  };

  const normalizePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("880")) return cleaned.slice(2);
    return cleaned;
  };

  const isValidBDPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return /^01\d{9}$/.test(normalized);
  };

  const submit = async () => {
    const { fullName, phone, password } = form;

    if (!fullName || !phone || !password) {
      alert("সব তথ্য পূরণ করুন");
      return;
    }

    if (!isValidBDPhone(phone)) {
      alert("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
      return;
    }

    if (password.length < 6) {
      alert("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);

    const { firstName, lastName } = splitFullName(fullName);

    const payload = {
      firstName,
      lastName,
      phone: normalizePhone(phone),
      password,
      promoCode: form.promoCode || null,
    };

    try {
      const registerRes = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const registerData = await registerRes.json();
      
      if (!registerRes.ok) {
        alert(registerData?.error || "নিবন্ধন ব্যর্থ হয়েছে");
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const loginPayload = {
        phone: normalizePhone(phone),
        password: password
      };
      
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });

      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        alert("নিবন্ধন সফল! দয়া করে লগইন করুন");
        router.push("/login");
        setLoading(false);
        return;
      }

      login(loginData.token, loginData.user);
      
      router.push("/dashboard");

    } catch (err) {
      alert("নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Header with Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p className="text-gray-600">
            আমাদের প্ল্যাটফর্মে যোগ দিন এবং শুরু করুন
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <User size={16} className="text-orange-500" />
                পূর্ণ নাম
              </label>
              <div className="relative">
                <input
                  placeholder="আপনার নাম লিখুন"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-4 pl-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500">
                আপনার নাম (যেমন: রাহিম করিম)
              </p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={16} className="text-orange-500" />
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  placeholder="০১XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-4 pl-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500">
                বাংলাদেশের মোবাইল নম্বর (01 দিয়ে শুরু)
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Lock size={16} className="text-orange-500" />
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  placeholder="পাসওয়ার্ড দিন"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-4 pl-12 pr-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                  aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                কমপক্ষে ৬টি অক্ষর, বড় হাতের ও ছোট হাতের অক্ষর, সংখ্যা ব্যবহার করুন
              </p>
            </div>

            {/* Promo Code Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Gift size={16} className="text-orange-500" />
                প্রোমো কোড
                <span className="text-xs text-gray-500 font-normal">
                  (ঐচ্ছিক)
                </span>
              </label>
              <div className="relative">
                <input
                  placeholder="ঐচ্ছিক প্রোমো কোড"
                  value={form.promoCode}
                  onChange={(e) => setForm({ ...form, promoCode: e.target.value.toUpperCase() })}
                  className="w-full p-4 pl-12 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500">
                বোনাস পেতে প্রোমো কোড ব্যবহার করুন
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <input 
                type="checkbox" 
                id="terms" 
                defaultChecked 
                className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                আমি{" "}
                <button className="text-orange-600 hover:text-orange-700 font-medium">
                  সেবার শর্তাবলী
                </button>{" "}
                এবং{" "}
                <button className="text-orange-600 hover:text-orange-700 font-medium">
                  গোপনীয়তা নীতি
                </button>{" "}
                পড়েছি এবং সম্মতি দিচ্ছি
              </label>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              onClick={submit}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  অ্যাকাউন্ট তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  নিবন্ধন করুন
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-orange-600 hover:text-orange-700 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  লগইন করুন
                  <ArrowRight size={14} />
                </button>
              </p>
            </div>

            {/* Security Note */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 text-center">
                🔒 আপনার তথ্য সুরক্ষিত রাখা হয়েছে
              </p>
            </div>
          </div>
        </div>

        {/* Features/benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">⚡</div>
            <p className="text-xs font-medium text-gray-700">দ্রুত নিবন্ধন</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">🎁</div>
            <p className="text-xs font-medium text-gray-700">বোনাস অফার</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-orange-500 text-lg font-bold mb-1">🛡️</div>
            <p className="text-xs font-medium text-gray-700">সুরক্ষিত</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            সাহায্যের প্রয়োজন?{" "}
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              আমাদের সাথে যোগাযোগ করুন
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}