"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLang } from "@/app/i18n/useLang";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, lang } = useLang();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    promoCode: "",
  });

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
    const { firstName, lastName, phone, password } = form;

    if (!firstName || !lastName || !phone || !password) {
      alert(t.allFieldsRequired);
      return;
    }

    if (!isValidBDPhone(phone)) {
      alert(t.invalidPhone);
      return;
    }

    if (password.length < 6) {
      alert(t.passwordTooShort);
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      phone: normalizePhone(phone),
      promoCode: form.promoCode || null,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data?.message || "Registration failed");
        return;
      }

      // Auto login after registration
      if (data.success) {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            phone: normalizePhone(phone), 
            password 
          }),
        });

        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.token, loginData.user);
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }
    } catch (err) {
      setLoading(false);
      alert(t.serverError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-300 shadow-xl p-6 space-y-5">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {t.createAccount}
          </h1>
          <p className="text-sm text-gray-600">
            {t.joinPlatform}
          </p>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {t.firstName}
            </label>
            <input
              placeholder={lang === 'bn' ? "আপনার নাম" : "Your name"}
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: e.target.value })
              }
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {t.lastName}
            </label>
            <input
              placeholder={lang === 'bn' ? "আপনার উপনাম" : "Your last name"}
              value={form.lastName}
              onChange={(e) =>
                setForm({ ...form, lastName: e.target.value })
              }
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t.phoneNumber}
          </label>
          <input
            placeholder={t.phonePlaceholder}
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t.password}
          </label>
          <div className="relative">
            <input
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t.promoCode}
          </label>
          <input
            placeholder={lang === 'bn' ? "ঐচ্ছিক প্রোমো কোড" : "Optional promo code"}
            value={form.promoCode}
            onChange={(e) =>
              setForm({ ...form, promoCode: e.target.value.toUpperCase() })
            }
            className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* ACTION */}
        <button
          disabled={loading}
          onClick={submit}
          className="w-full py-3 rounded-lg bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? t.creatingAccount : t.registerBtn}
        </button>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-600">
          {t.alreadyHaveAccount}{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {t.loginHere}
          </button>
        </p>
      </div>
    </div>
  );
}