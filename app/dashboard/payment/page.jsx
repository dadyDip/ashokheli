// app/dashboard/payment/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  CreditCard,
  Smartphone,
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  Star
} from "lucide-react";
import { useLang } from "@/app/i18n/useLang";

export default function PaymentSetupPage() {
  const router = useRouter();
  const { t, lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [walletSetup, setWalletSetup] = useState(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New wallet form
  const [newWallet, setNewWallet] = useState({
    type: "bkash",
    accountNumber: "",
    accountHolder: ""
  });

  // Account validation
  const [accountError, setAccountError] = useState("");

  // Texts
  const texts = {
    en: {
      paymentSetup: "Payment Setup",
      back: "Back",
      eWallets: "My E-Wallets",
      manageWallets: "Your registered withdrawal wallets",
      maxWallets: "Maximum 4 wallets allowed",
      addNewWallet: "Add New Wallet",
      noWallets: "No Wallets Added",
      noWalletsDesc: "Add your first e-wallet to start withdrawing",
      bkash: "bKash",
      nagad: "Nagad",
      rocket: "Rocket",
      accountNumber: "Account Number",
      accountHolder: "Account Holder",
      default: "Default",
      addedOn: "Added on",
      withdraw: "Go to Withdraw",
      transactionPassword: "Transaction Password",
      passwordStatus: "Transaction password is set",
      passwordNotSet: "Transaction password not set",
      setPassword: "Set up transaction password in Withdraw page",
      save: "Save Wallet",
      cancel: "Cancel",
      accountExists: "This {type} number is already registered with another user",
      accountExistsSelf: "You already have this {type} number added",
      invalidNumber: "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)",
      fillAllFields: "Please fill all fields",
      walletAdded: "Wallet added successfully",
      maxWalletsError: "Maximum 4 wallets allowed",
      viewOnly: "Wallets cannot be removed or changed once added",
      permanent: "Permanent Entry"
    },
    bn: {
      paymentSetup: "পেমেন্ট সেটআপ",
      back: "পেছনে",
      eWallets: "আমার ই-ওয়ালেট",
      manageWallets: "আপনার নিবন্ধিত উত্তোলন ওয়ালেট",
      maxWallets: "সর্বোচ্চ ৪টি ওয়ালেট যোগ করা যাবে",
      addNewWallet: "নতুন ওয়ালেট যোগ করুন",
      noWallets: "কোন ওয়ালেট নেই",
      noWalletsDesc: "উত্তোলন শুরু করতে আপনার প্রথম ওয়ালেট যোগ করুন",
      bkash: "বিকাশ",
      nagad: "নগদ",
      rocket: "রকেট",
      accountNumber: "অ্যাকাউন্ট নম্বর",
      accountHolder: "অ্যাকাউন্ট হোল্ডার",
      default: "ডিফল্ট",
      addedOn: "যোগ করা হয়েছে",
      withdraw: "উত্তোলন পৃষ্ঠায় যান",
      transactionPassword: "লেনদেন পাসওয়ার্ড",
      passwordStatus: "লেনদেন পাসওয়ার্ড সেট করা আছে",
      passwordNotSet: "লেনদেন পাসওয়ার্ড সেট করা নেই",
      setPassword: "উত্তোলন পৃষ্ঠায় গিয়ে লেনদেন পাসওয়ার্ড সেটআপ করুন",
      save: "ওয়ালেট সংরক্ষণ করুন",
      cancel: "বাতিল",
      accountExists: "এই {type} নম্বরটি ইতিমধ্যে অন্য ব্যবহারকারীর সাথে নিবন্ধিত",
      accountExistsSelf: "আপনার কাছে ইতিমধ্যে এই {type} নম্বরটি সংরক্ষিত আছে",
      invalidNumber: "দয়া করে সঠিক বাংলাদেশী মোবাইল নম্বর দিন (01XXXXXXXXX)",
      fillAllFields: "দয়া করে সব তথ্য দিন",
      walletAdded: "ওয়ালেট সফলভাবে যোগ করা হয়েছে",
      maxWalletsError: "সর্বোচ্চ ৪টি ওয়ালেট যোগ করা যাবে",
      viewOnly: "ওয়ালেট একবার যোগ করলে পরিবর্তন বা মুছে ফেলা যাবে না",
      permanent: "স্থায়ী এন্ট্রি"
    }
  };

  const currentText = texts[lang] || texts.en;

  // Fetch wallet setup
  useEffect(() => {
    fetchWalletSetup();
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
      }
    } catch (error) {
      console.error("Error fetching wallet setup:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateAccountNumber = (number, type) => {
    if (!number) return "";
    if (!number.match(/^01[3-9]\d{8}$/)) {
      return currentText.invalidNumber;
    }
    return "";
  };

  const handleAccountNumberChange = async (e) => {
    const value = e.target.value;
    setNewWallet({ ...newWallet, accountNumber: value });
    
    const formatError = validateAccountNumber(value, newWallet.type);
    if (formatError) {
      setAccountError(formatError);
      return;
    }
    
    if (!value) {
      setAccountError("");
      return;
    }
    
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
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!newWallet.accountNumber.match(/^01[3-9]\d{8}$/)) {
      setError(currentText.invalidNumber);
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (accountError) {
      setError(accountError);
      setTimeout(() => setError(""), 3000);
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

      setSuccess(currentText.walletAdded);
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

  const getWalletIcon = (type) => {
    switch(type) {
      case "bkash":
        return <span className="text-white font-bold text-lg">B</span>;
      case "nagad":
        return <span className="text-white font-bold text-lg">N</span>;
      case "rocket":
        return <span className="text-white font-bold text-lg">R</span>;
      default:
        return <Smartphone className="w-6 h-6 text-white" />;
    }
  };

  const getWalletColor = (type) => {
    switch(type) {
      case "bkash": return "bg-[#E2136E]";
      case "nagad": return "bg-[#E30B23]";
      case "rocket": return "bg-[#DC143C]";
      default: return "bg-gray-600";
    }
  };

  const getWalletName = (type) => {
    switch(type) {
      case "bkash": return currentText.bkash;
      case "nagad": return currentText.nagad;
      case "rocket": return currentText.rocket;
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const canAddMore = walletSetup?.ewallets?.length < 4;

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Maroon */}
      <div className="fixed top-0 left-0 right-0 bg-[#800000] h-20 z-50 flex items-center justify-between px-5 shadow-lg">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <h1 className="text-xl font-bold text-white">
          {currentText.paymentSetup}
        </h1>
        
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-10 px-5">
        {/* Header Section */}
        <div className="py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentText.eWallets}</h2>
              <p className="text-sm text-gray-500">{currentText.manageWallets}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gray-200 mb-6"></div>

        {/* Transaction Password Status Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{currentText.transactionPassword}</h3>
              {walletSetup?.hasTransactionPassword ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-medium">
                    ✓ {currentText.passwordStatus}
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-yellow-700 text-sm mb-2">{currentText.passwordNotSet}</p>
                  <p className="text-xs text-gray-500">{currentText.setPassword}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Wallets Count and Add Button Row */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {walletSetup?.ewallets?.length || 0}/4 {currentText.eWallets}
            </span>
            {!canAddMore && (
              <span className="ml-3 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                {currentText.maxWallets}
              </span>
            )}
          </div>
          
          {/* Add Wallet Button - ONLY SHOW IF LESS THAN 4 WALLETS */}
          {!showAddWallet && canAddMore && (
            <button
              onClick={() => setShowAddWallet(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              {currentText.addNewWallet}
            </button>
          )}
        </div>

        {/* Add Wallet Form */}
        {showAddWallet && canAddMore && (
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-red-200 mb-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              {currentText.addNewWallet}
            </h3>
            
            <div className="space-y-5">
              {/* Payment Method Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {currentText.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "bkash", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`py-3 rounded-xl border-2 transition flex flex-col items-center ${
                      newWallet.type === "bkash"
                        ? "border-[#E2136E] bg-[#E2136E]/10"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      newWallet.type === "bkash" ? "text-[#E2136E]" : "text-gray-700"
                    }`}>
                      {currentText.bkash}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "nagad", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`py-3 rounded-xl border-2 transition flex flex-col items-center ${
                      newWallet.type === "nagad"
                        ? "border-[#E30B23] bg-[#E30B23]/10"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      newWallet.type === "nagad" ? "text-[#E30B23]" : "text-gray-700"
                    }`}>
                      {currentText.nagad}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNewWallet({ ...newWallet, type: "rocket", accountNumber: "" });
                      setAccountError("");
                    }}
                    className={`py-3 rounded-xl border-2 transition flex flex-col items-center ${
                      newWallet.type === "rocket"
                        ? "border-[#DC143C] bg-[#DC143C]/10"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      newWallet.type === "rocket" ? "text-[#DC143C]" : "text-gray-700"
                    }`}>
                      {currentText.rocket}
                    </span>
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {currentText.accountNumber}
                </label>
                <input
                  type="text"
                  value={newWallet.accountNumber}
                  onChange={handleAccountNumberChange}
                  placeholder="01XXXXXXXXX"
                  className={`w-full p-4 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 transition ${
                    accountError ? "border-red-500 bg-red-50" : "border-gray-200"
                  }`}
                  maxLength={11}
                />
                {accountError && (
                  <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{accountError}</span>
                  </div>
                )}
              </div>

              {/* Account Holder */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {currentText.accountHolder}
                </label>
                <input
                  type="text"
                  value={newWallet.accountHolder}
                  onChange={(e) => setNewWallet({ ...newWallet, accountHolder: e.target.value })}
                  placeholder={currentText.accountHolder}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={addNewWallet}
                  disabled={!!accountError || !newWallet.accountNumber || !newWallet.accountHolder}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {currentText.save}
                </button>
                <button
                  onClick={() => {
                    setShowAddWallet(false);
                    setNewWallet({ type: "bkash", accountNumber: "", accountHolder: "" });
                    setAccountError("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  {currentText.cancel}
                </button>
              </div>
            </div>
            
            {/* Permanent Entry Notice */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <span className="text-amber-600">⚠️</span>
                {currentText.viewOnly}
              </p>
            </div>
          </div>
        )}

        {/* Wallet List - VIEW ONLY (NO DELETE/EDIT BUTTONS) */}
        {walletSetup?.ewallets && walletSetup.ewallets.length > 0 ? (
          <div className="space-y-4 mb-8">
            {walletSetup.ewallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition relative"
              >
                {/* Permanent Badge */}
                <div className="absolute top-5 right-5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="text-gray-500">🔒</span>
                    {currentText.permanent}
                  </span>
                </div>
                
                <div className="flex items-start gap-4">
                  {/* Wallet Icon */}
                  <div className={`w-16 h-16 rounded-full ${getWalletColor(wallet.type)} flex items-center justify-center shadow-md flex-shrink-0`}>
                    {getWalletIcon(wallet.type)}
                  </div>
                  
                  {/* Wallet Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {getWalletName(wallet.type)}
                      </h3>
                      {wallet.isDefault && (
                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                          <Star className="w-3 h-3" />
                          {currentText.default}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-base">{wallet.accountNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{wallet.accountHolder}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>{currentText.addedOn}: {formatDate(wallet.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State - No wallets */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 mb-8">
            <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Smartphone className="w-14 h-14 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              {currentText.noWallets}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
              {currentText.noWalletsDesc}
            </p>
            {canAddMore && (
              <button
                onClick={() => setShowAddWallet(true)}
                className="px-8 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {currentText.addNewWallet}
              </button>
            )}
          </div>
        )}

        {/* Max Wallets Message */}
        {!canAddMore && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700 text-center">
              {lang === 'bn' 
                ? 'আপনি সর্বোচ্চ ৪টি ওয়ালেট যোগ করেছেন। আর যোগ করা যাবে না।' 
                : 'You have added the maximum of 4 wallets. Cannot add more.'}
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span className="text-gray-500">🔒</span>
            {lang === 'bn' 
              ? 'ওয়ালেট একবার যোগ করলে পরিবর্তন বা মুছে ফেলা যাবে না' 
              : 'Wallets cannot be modified or removed once added'}
          </p>
        </div>
      </div>
    </div>
  );
}