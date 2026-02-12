// app/dashboard/withdraw/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Eye, EyeOff, RefreshCw, FileText, AlertCircle } from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export default function WithdrawPage() {
  const router = useRouter();
  const { t, lang } = useLang();

  // State
  const [walletSetup, setWalletSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showTransactionPassword, setShowTransactionPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState({ main: 0, available: 0 });
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // New wallet form
  const [newWallet, setNewWallet] = useState({
    type: "bkash",
    accountNumber: "",
    accountHolder: ""
  });

  // Transaction password setup
  const [setupPassword, setSetupPassword] = useState({
    password: "",
    confirmPassword: ""
  });

  // Validation states
  const [accountError, setAccountError] = useState("");

  // Texts
  const texts = {
    en: {
      withdraw: "Withdraw",
      eWallet: "E wallet",
      selectedWallet: "Selected E-Wallet",
      emptyWallet: "Empty E-Wallet",
      addNewWallet: "Add New Wallet",
      withdrawTime: "Withdrawal Time: 24 Hours",
      dailyLimit: "Daily withdrawals 99 times, remaining 99 times",
      mainWallet: "Main Wallet",
      available: "Available",
      refreshBalance: "Refresh Your Balance",
      withdrawAmount: "Withdrawal Amount:",
      amount: "Amount",
      amountPlaceholder: "100 ~ 1,000",
      transactionPassword: "Transaction Password",
      transactionPasswordPlaceholder: "Enter transaction password",
      setupTransactionPassword: "Setup Transaction Password",
      enterTransactionPassword: "Enter Transaction Password",
      confirmTransactionPassword: "Confirm Transaction Password",
      setup: "Setup",
      cancel: "Cancel",
      submit: "Submit Withdraw",
      processing: "Processing...",
      bkash: "bKash",
      nagad: "Nagad",
      rocket: "Rocket",
      accountNumber: "Account Number",
      accountHolder: "Account Holder Name",
      save: "Save Wallet",
      default: "Default",
      insufficientBalance: "Insufficient balance",
      invalidAmount: "Please enter a valid amount",
      minWithdraw: "Minimum withdraw is 200 BDT",
      wrongPassword: "Incorrect transaction password",
      success: "Withdrawal request submitted successfully",
      accountExists: "This {type} number is already registered with another user",
      accountExistsSelf: "You already have this {type} number added",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      selectWallet: "Please select a wallet",
      fillAllFields: "Please fill all fields",
      maxWallets: "Maximum 4 wallets allowed",
      invalidNumber: "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)",
      processingTime: "Withdrawals are processed within 1 hour"
    },
    bn: {
      withdraw: "উত্তোলন",
      eWallet: "ই-ওয়ালেট",
      selectedWallet: "নির্বাচিত ই-ওয়ালেট",
      emptyWallet: "খালি ই-ওয়ালেট",
      addNewWallet: "নতুন ওয়ালেট যোগ করুন",
      withdrawTime: "উত্তোলন সময় : ২৪ ঘন্টা",
      dailyLimit: "দৈনিক উত্তোলন ৯৯ বার, অবশিষ্ট উত্তোলন ৯৯ বার",
      mainWallet: "প্রধান ওয়ালেট",
      available: "উপলব্ধ পরিমাণ",
      refreshBalance: "আপনার ব্যালেন্স রিফ্রেশ করুন",
      withdrawAmount: "উত্তোলন পরিমাণ:",
      amount: "পরিমাণ",
      amountPlaceholder: "১০০ ~ ১,০০০",
      transactionPassword: "লেনদেন পাসওয়ার্ড",
      transactionPasswordPlaceholder: "লেনদেন পাসওয়ার্ড দিন",
      setupTransactionPassword: "লেনদেন পাসওয়ার্ড সেটআপ করুন",
      enterTransactionPassword: "লেনদেন পাসওয়ার্ড দিন",
      confirmTransactionPassword: "লেনদেন পাসওয়ার্ড নিশ্চিত করুন",
      setup: "সেটআপ",
      cancel: "বাতিল",
      submit: "উত্তোলন সাবমিট করুন",
      processing: "প্রসেসিং...",
      bkash: "বিকাশ",
      nagad: "নগদ",
      rocket: "রকেট",
      accountNumber: "অ্যাকাউন্ট নম্বর",
      accountHolder: "অ্যাকাউন্ট হোল্ডারের নাম",
      save: "ওয়ালেট সংরক্ষণ করুন",
      default: "ডিফল্ট",
      insufficientBalance: "পর্যাপ্ত ব্যালেন্স নেই",
      invalidAmount: "দয়া করে সঠিক পরিমাণ দিন",
      minWithdraw: "সর্বনিম্ন উত্তোলন ২০০ টাকা",
      wrongPassword: "ভুল লেনদেন পাসওয়ার্ড",
      success: "উত্তোলন অনুরোধ সফলভাবে সাবমিট হয়েছে",
      accountExists: "এই {type} নম্বরটি ইতিমধ্যে অন্য ব্যবহারকারীর সাথে নিবন্ধিত",
      accountExistsSelf: "আপনার কাছে ইতিমধ্যে এই {type} নম্বরটি সংরক্ষিত আছে",
      passwordMismatch: "পাসওয়ার্ড মিলছে না",
      passwordTooShort: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
      selectWallet: "দয়া করে একটি ওয়ালেট নির্বাচন করুন",
      fillAllFields: "দয়া করে সব তথ্য দিন",
      maxWallets: "সর্বোচ্চ ৪টি ওয়ালেট যোগ করা যাবে",
      invalidNumber: "দয়া করে সঠিক বাংলাদেশী মোবাইল নম্বর দিন (01XXXXXXXXX)",
      processingTime: "উত্তোলন ১ ঘন্টার মধ্যে প্রক্রিয়া করা হবে"
    }
  };

  const currentText = texts[lang] || texts.en;

  // Fetch wallet setup and balance
  useEffect(() => {
    fetchWalletSetup();
    fetchBalance();
  }, []);

  const fetchWalletSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/setup", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setWalletSetup(data);
        // Select default wallet if exists
        if (data.ewallets && data.ewallets.length > 0) {
          const defaultWallet = data.ewallets.find(w => w.isDefault);
          setSelectedWallet(defaultWallet || data.ewallets[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching wallet setup:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBalance({
          main: data.totalBalance / 100,
          available: data.withdrawableBalance / 100
        });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const refreshBalance = async () => {
    setRefreshingBalance(true);
    await fetchBalance();
    setTimeout(() => setRefreshingBalance(false), 500);
  };

  const validateAccountNumber = (number, type) => {
    if (!number) return "";
    if (!number.match(/^01[3-9]\d{8}$/)) {
      return currentText.invalidNumber;
    }
    return "";
  };

  const checkAccountExists = async (number, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/wallet/check-account?number=${number}&type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking account:", error);
      return false;
    }
  };

  const handleAccountNumberChange = async (e) => {
    const value = e.target.value;
    setNewWallet({ ...newWallet, accountNumber: value });
    
    // Validate format
    const formatError = validateAccountNumber(value, newWallet.type);
    if (formatError) {
      setAccountError(formatError);
      return;
    }
    
    // Clear error if no number
    if (!value) {
      setAccountError("");
      return;
    }
    
    // Check if number already exists for this type with another user
    if (value.length === 11) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/wallet/check-account?number=${value}&type=${newWallet.type}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.exists) {
          if (data.isOwn) {
            setAccountError(currentText.accountExistsSelf.replace("{type}", newWallet.type));
          } else {
            setAccountError(currentText.accountExists.replace("{type}", newWallet.type));
          }
        } else {
          setAccountError("");
        }
      } catch (error) {
        console.error("Error checking account:", error);
      }
    }
  };

  const addNewWallet = async () => {
    if (!newWallet.accountNumber || !newWallet.accountHolder) {
      setError(currentText.fillAllFields);
      return;
    }

    // Validate Bangladeshi number
    if (!newWallet.accountNumber.match(/^01[3-9]\d{8}$/)) {
      setError(currentText.invalidNumber);
      return;
    }

    // Check if there's an account error
    if (accountError) {
      setError(accountError);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/ewallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newWallet)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add wallet");
      }

      setSuccess("Wallet added successfully");
      setShowAddWallet(false);
      setNewWallet({ type: "bkash", accountNumber: "", accountHolder: "" });
      setAccountError("");
      fetchWalletSetup();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const setupTransactionPasswordHandler = async () => {
    if (!setupPassword.password || !setupPassword.confirmPassword) {
      setError(currentText.fillAllFields);
      return;
    }

    if (setupPassword.password.length < 6) {
      setError(currentText.passwordTooShort);
      return;
    }

    if (setupPassword.password !== setupPassword.confirmPassword) {
      setError(currentText.passwordMismatch);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/transaction-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: setupPassword.password })
      });

      if (res.ok) {
        setSuccess("Transaction password setup successfully");
        setShowTransactionPassword(false);
        setSetupPassword({ password: "", confirmPassword: "" });
        fetchWalletSetup();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to setup password");
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const submitWithdraw = async () => {
    setError("");

    if (!selectedWallet) {
      setError(currentText.selectWallet);
      return;
    }

    if (!amount) {
      setError(currentText.fillAllFields);
      return;
    }

    if (!transactionPassword) {
      setError(currentText.transactionPasswordPlaceholder);
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(currentText.invalidAmount);
      return;
    }

    if (amountNum < 200) {
      setError(currentText.minWithdraw);
      return;
    }

    if (amountNum > balance.available) {
      setError(currentText.insufficientBalance);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedWallet.type,
          amount: amountNum,
          account: selectedWallet.accountNumber,
          transactionPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      setSuccess(currentText.success);
      setAmount("");
      setTransactionPassword("");
      fetchBalance();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const canWithdraw = walletSetup?.hasTransactionPassword && walletSetup?.ewallets?.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Top App Bar - Maroon */}
      <div className="fixed top-0 left-0 right-0 bg-[#800000] h-24 z-50 flex items-center justify-between px-5 shadow-lg">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <h1 className="text-2xl font-bold text-white absolute left-1/2 transform -translate-x-1/2">
          {currentText.withdraw}
        </h1>
        
        <button 
          onClick={() => router.push("/dashboard/withdraw/history")}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <FileText className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Main Content - Add top padding for fixed header */}
      <div className="pt-24 pb-10 px-5">
        {/* 2. Wallet Type Row */}
        <div className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">ec</span>
            </div>
            <span className="text-red-600 font-medium text-lg">{currentText.eWallet}</span>
          </div>
        </div>

        {/* Thin red divider */}
        <div className="h-[1px] w-full bg-red-200 mb-4"></div>

        {/* 3. Selected Wallet Count Label */}
        <div className="text-gray-600 text-sm mb-6">
          {currentText.selectedWallet} ({walletSetup?.ewallets?.length || 0}/4)
        </div>

        {/* 4. Empty Wallet Illustration Area */}
        {(!walletSetup?.ewallets || walletSetup.ewallets.length === 0) && !showAddWallet && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 opacity-30">
              {/* SVG Illustration - Credit card with landscape */}
              <svg viewBox="0 0 200 200" className="w-full h-full text-gray-400">
                <rect x="40" y="80" width="120" height="70" rx="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="50" y="95" width="100" height="8" rx="2" fill="currentColor" fillOpacity="0.3"/>
                <rect x="50" y="115" width="60" height="6" rx="2" fill="currentColor" fillOpacity="0.2"/>
                <circle cx="140" cy="120" r="6" fill="currentColor" fillOpacity="0.2"/>
                <path d="M20 160 L180 160 L160 140 L40 140 L20 160" fill="currentColor" fillOpacity="0.1"/>
                <rect x="30" y="140" width="8" height="15" fill="currentColor" fillOpacity="0.15"/>
                <rect x="162" y="140" width="8" height="15" fill="currentColor" fillOpacity="0.15"/>
                <circle cx="60" cy="150" r="3" fill="currentColor" fillOpacity="0.2"/>
                <circle cx="140" cy="150" r="3" fill="currentColor" fillOpacity="0.2"/>
              </svg>
              {/* Fog effect */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            </div>
            <p className="text-gray-500 text-lg mt-4 opacity-60">
              {currentText.emptyWallet}
            </p>
          </div>
        )}

        {/* Wallet List */}
        {walletSetup?.ewallets && walletSetup.ewallets.length > 0 && (
          <div className="space-y-3 mb-6">
            {walletSetup.ewallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedWallet?.id === wallet.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      wallet.type === "bkash" ? "bg-[#E2136E]" : 
                      wallet.type === "nagad" ? "bg-[#E30B23]" : 
                      "bg-[#DC143C]"
                    }`}>
                      <span className="text-white font-bold">
                        {wallet.type === "bkash" ? "B" : 
                         wallet.type === "nagad" ? "N" : "R"}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {wallet.type === "bkash" ? currentText.bkash : 
                         wallet.type === "nagad" ? currentText.nagad : 
                         currentText.rocket}
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        {wallet.accountNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {wallet.accountHolder}
                      </div>
                    </div>
                  </div>
                  {wallet.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {currentText.default}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 5. Floating Add Button (+) */}
        {!showAddWallet && walletSetup?.ewallets?.length < 4 && (
          <button
            onClick={() => setShowAddWallet(true)}
            className="fixed right-6 bottom-24 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:bg-red-700 transition transform hover:scale-105 z-40"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Add Wallet Form */}
        {showAddWallet && (
          <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">{currentText.addNewWallet}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Payment Method</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "bkash", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg border-2 transition ${
                      newWallet.type === "bkash"
                        ? "border-[#E2136E] bg-[#E2136E]/10"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <span className={newWallet.type === "bkash" ? "text-[#E2136E]" : "text-gray-700"}>
                      {currentText.bkash}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "nagad", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg border-2 transition ${
                      newWallet.type === "nagad"
                        ? "border-[#E30B23] bg-[#E30B23]/10"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <span className={newWallet.type === "nagad" ? "text-[#E30B23]" : "text-gray-700"}>
                      {currentText.nagad}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "rocket", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg border-2 transition ${
                      newWallet.type === "rocket"
                        ? "border-[#DC143C] bg-[#DC143C]/10"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <span className={newWallet.type === "rocket" ? "text-[#DC143C]" : "text-gray-700"}>
                      {currentText.rocket}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">{currentText.accountNumber}</label>
                <input
                  type="text"
                  value={newWallet.accountNumber}
                  onChange={handleAccountNumberChange}
                  placeholder="01XXXXXXXXX"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:border-red-500 bg-white text-gray-900 ${
                    accountError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  maxLength={11}
                />
                {accountError && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{accountError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">{currentText.accountHolder}</label>
                <input
                  type="text"
                  value={newWallet.accountHolder}
                  onChange={(e) => setNewWallet({ ...newWallet, accountHolder: e.target.value })}
                  placeholder="Name as per bKash/Nagad/Rocket"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addNewWallet}
                  disabled={!!accountError || !newWallet.accountNumber || !newWallet.accountHolder}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentText.save}
                </button>
                <button
                  onClick={() => {
                    setShowAddWallet(false);
                    setNewWallet({ type: "bkash", accountNumber: "", accountHolder: "" });
                    setAccountError("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  {currentText.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Password Setup */}
        {!walletSetup?.hasTransactionPassword && !showTransactionPassword && (
          <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl mb-6">
            <p className="text-yellow-800 mb-3">{currentText.setupTransactionPassword}</p>
            <button
              onClick={() => setShowTransactionPassword(true)}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition"
            >
              {currentText.setup}
            </button>
          </div>
        )}

        {showTransactionPassword && (
          <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">{currentText.setupTransactionPassword}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">{currentText.enterTransactionPassword}</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"}
                    value={setupPassword.password}
                    onChange={(e) => setSetupPassword({ ...setupPassword, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-gray-900 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSetupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">{currentText.confirmTransactionPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={setupPassword.confirmPassword}
                    onChange={(e) => setSetupPassword({ ...setupPassword, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-gray-900 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {setupPassword.password && setupPassword.confirmPassword && 
               setupPassword.password !== setupPassword.confirmPassword && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{currentText.passwordMismatch}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={setupTransactionPasswordHandler}
                  disabled={!setupPassword.password || !setupPassword.confirmPassword || 
                           setupPassword.password !== setupPassword.confirmPassword ||
                           setupPassword.password.length < 6}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentText.setup}
                </button>
                <button
                  onClick={() => {
                    setShowTransactionPassword(false);
                    setSetupPassword({ password: "", confirmPassword: "" });
                    setShowSetupPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  {currentText.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Grey Separator Line */}
        <div className="h-[1px] w-full bg-gray-200 my-6"></div>

        {/* 7. Withdraw Time + Rules Text Block */}
        <div className="space-y-2 mb-4">
          <p className="text-gray-600 text-sm">{currentText.withdrawTime}</p>
          <p className="text-gray-600 text-sm">{currentText.dailyLimit}</p>
          <p className="text-gray-800 font-medium">{currentText.mainWallet}: ৳ {balance.main.toFixed(2)}</p>
          <p className="text-gray-800 font-medium">
            {currentText.available}: ৳ {balance.available.toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs mt-2">{currentText.processingTime}</p>
        </div>

        {/* 8. Balance Refresh Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={refreshBalance}
            disabled={refreshingBalance}
            className="flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-full text-blue-600 font-medium shadow-sm hover:bg-blue-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingBalance ? "animate-spin" : ""}`} />
            {currentText.refreshBalance}
          </button>
        </div>

        {/* 9. Withdraw Amount Section */}
        {canWithdraw ? (
          <>
            <div className="mb-2">
              <label className="text-gray-700 font-medium">{currentText.withdrawAmount}</label>
            </div>

            {/* 10. Amount Input Field - Card style */}
            <div className="mb-4">
              <div className="bg-white border border-gray-300 rounded-xl p-1 flex items-center h-16 shadow-sm">
                <div className="px-4 border-r border-gray-200">
                  <span className="text-gray-700 font-bold">{currentText.amount}</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={currentText.amountPlaceholder}
                  className="flex-1 px-4 h-full bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* 11. Transaction Password Input Field */}
            <div className="mb-6">
              <div className="bg-white border border-gray-300 rounded-xl p-1 flex items-center h-16 shadow-sm">
                <div className="px-4 border-r border-gray-200">
                  <span className="text-gray-700 font-bold whitespace-nowrap">{currentText.transactionPassword}</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder={currentText.transactionPasswordPlaceholder}
                  className="flex-1 px-4 h-full bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitWithdraw}
              disabled={submitting || !selectedWallet || !amount || !transactionPassword}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? currentText.processing : currentText.submit}
            </button>
          </>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            {!walletSetup?.hasTransactionPassword ? (
              <p className="text-gray-500">{currentText.setupTransactionPassword}</p>
            ) : (
              <p className="text-gray-500">{currentText.emptyWallet}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}