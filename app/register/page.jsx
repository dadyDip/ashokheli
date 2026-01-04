"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
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
    const { firstName, lastName, email, phone, password } = form;

    if (!firstName || !lastName || !email || !phone || !password) {
      alert("All fields are required");
      return;
    }

    if (!isValidBDPhone(phone)) {
      alert("Invalid phone number (use 01XXXXXXXXX or 8801XXXXXXXX)");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
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

      alert("Account created successfully. 1000৳ demo balance added.");
      router.replace("/login");
    } catch (err) {
      setLoading(false);
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-emerald-950 to-teal-900 text-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900/60 backdrop-blur border border-emerald-500/20 p-6 space-y-5">

        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-sm text-white/60">
            Join Bangladesh’s next-gen skill gaming platform
          </p>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
            className="p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
          />

          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
            className="p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <input
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
        />

        <input
          placeholder="Phone Number (01XXXXXXXXX or 8801XXXXXXXX)"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          className="w-full p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          className="w-full p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
        />

        <input
          placeholder="Promo Code (optional)"
          value={form.promoCode || ""}
          onChange={(e) =>
            setForm({ ...form, promoCode: e.target.value.toUpperCase() })
          }
          className="w-full p-3 rounded bg-gray-800 border border-white/10 focus:outline-none focus:border-emerald-500"
        />

        {/* INFO */}
        <p className="text-xs text-white/50">
          🔒 You get 1000৳ demo balance instantly after registration.
        </p>

        {/* ACTION */}
        <button
          disabled={loading}
          onClick={submit}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* FOOTER */}
        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <span
            className="text-emerald-400 cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
