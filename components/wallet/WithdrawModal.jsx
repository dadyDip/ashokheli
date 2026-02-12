"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/design/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";
import { useLang } from "@/app/i18n/useLang";
import { ChevronDown, AlertCircle, Lock, RefreshCw } from "lucide-react";

const MINIMUM_WITHDRAW = 200; // Minimum withdraw amount

export default function WithdrawModal({ open, onClose }) {
  const { t, lang } = useLang();

  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [walletInfo, setWalletInfo] = useState(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  // Bilingual text configuration
  const texts = {
    en: {
      withdrawFunds: "Withdraw Funds",
      minWithdraw: "Minimum Withdraw",
      minWithdrawDesc: "Minimum withdrawal amount is",
      paymentMethod: "Payment Method",
      bkashNumber: "bKash Number",
      nagadNumber: "Nagad Number",
      accountPlaceholder: "01XXXXXXXXX",
      amount: "Amount (BDT)",
      amountPlaceholder: `Minimum ${MINIMUM_WITHDRAW} BDT`,
      entered: "Entered",
      needMore: "Need",
      more: "more",
      withdrawInfo: "Withdraw requests are processed within 1 hour",
      submitWithdraw: "Submit Withdraw",
      submitting: "Submitting...",
      withdrawSummary: "Withdraw Summary",
      methodLabel: "Method",
      amountLabel: "Amount",
      accountLabel: "Account Number",
      fillAllFields: "Please fill all fields",
      invalidNumber: "Please enter a valid number",
      minWithdrawError: `Minimum withdraw is ${MINIMUM_WITHDRAW} BDT`,
      withdrawSubmitted: "Withdraw request submitted. You will receive money within 1 hour.",
      withdrawFailed: "Withdraw failed",
      somethingWentWrong: "Something went wrong",
      unauthorized: "Unauthorized",
      important: "Important",
      enterExactly: "Enter your exact",
      number: "number",
      copyNumber: "Double-check your account number",
      processingTime: "Processing within 1 hour",
      currentBalance: "Current Balance",
      availableForWithdraw: "Available for withdrawal",
      insufficientBalance: "Insufficient balance",
      bkash: "bKash",
      nagad: "Nagad",
      // New bonus-related texts
      checkingBalance: "Checking balance...",
      balanceLocked: "Balance Locked 🔒",
      completeTurnover: "Complete Turnover to Withdraw",
      playMore: "Play more games to unlock withdrawal",
      balanceLockedInfo: "Your balance is locked due to active bonus turnover requirements",
      withdrawalNotAllowed: "Complete bonus turnover to withdraw",
      refreshStatus: "Refresh Status",
      turnoverProgress: "Turnover Progress",
      completed: "Completed",
      remaining: "Remaining"
    },
    bn: {
      withdrawFunds: "টাকা উত্তোলন",
      minWithdraw: "সর্বনিম্ন উত্তোলন",
      minWithdrawDesc: "সর্বনিম্ন উত্তোলনের পরিমাণ",
      paymentMethod: "পেমেন্ট পদ্ধতি",
      bkashNumber: "বিকাশ নম্বর",
      nagadNumber: "নগদ নম্বর",
      accountPlaceholder: "01XXXXXXXXX",
      amount: "পরিমাণ (টাকা)",
      amountPlaceholder: `সর্বনিম্ন ${MINIMUM_WITHDRAW} টাকা`,
      entered: "প্রবেশ করানো",
      needMore: "আরো দরকার",
      more: "অধিক",
      withdrawInfo: "উত্তোলন অনুরোধ ১ ঘন্টার মধ্যে প্রক্রিয়া করা হবে",
      submitWithdraw: "উত্তোলন সাবমিট করুন",
      submitting: "সাবমিট হচ্ছে...",
      withdrawSummary: "উত্তোলন সারাংশ",
      methodLabel: "পদ্ধতি",
      amountLabel: "পরিমাণ",
      accountLabel: "অ্যাকাউন্ট নম্বর",
      fillAllFields: "দয়া করে সব তথ্য দিন",
      invalidNumber: "দয়া করে একটি সঠিক সংখ্যা দিন",
      minWithdrawError: `সর্বনিম্ন উত্তোলন ${MINIMUM_WITHDRAW} টাকা`,
      withdrawSubmitted: "উত্তোলন অনুরোধ সাবমিট হয়েছে। ১ ঘন্টার মধ্যে টাকা পাবেন।",
      withdrawFailed: "উত্তোলন ব্যর্থ হয়েছে",
      somethingWentWrong: "কিছু একটা সমস্যা হয়েছে",
      unauthorized: "অননুমোদিত",
      important: "গুরুত্বপূর্ণ",
      enterExactly: "আপনার সঠিক",
      number: "নম্বর",
      copyNumber: "আপনার অ্যাকাউন্ট নম্বর দুবার চেক করুন",
      processingTime: "১ ঘন্টার মধ্যে প্রক্রিয়াকরণ",
      currentBalance: "বর্তমান ব্যালেন্স",
      availableForWithdraw: "উত্তোলনের জন্য প্রাপ্ত",
      insufficientBalance: "পর্যাপ্ত ব্যালেন্স নেই",
      bkash: "বিকাশ",
      nagad: "নগদ",
      // New bonus-related texts
      checkingBalance: "ব্যালেন্স চেক করা হচ্ছে...",
      balanceLocked: "ব্যালেন্স লক 🔒",
      completeTurnover: "টার্নওভার সম্পূর্ণ করে উত্তোলন করুন",
      playMore: "উত্তোলন আনলক করতে আরো গেম খেলুন",
      balanceLockedInfo: "আপনার ব্যালেন্স বোনাস টার্নওভার প্রয়োজনীয়তার কারণে লক করা আছে",
      withdrawalNotAllowed: "বোনাস টার্নওভার সম্পূর্ণ করে উত্তোলন করুন",
      refreshStatus: "স্ট্যাটাস রিফ্রেশ করুন",
      turnoverProgress: "টার্নওভার প্রগ্রেস",
      completed: "সম্পূর্ণ",
      remaining: "বাকি"
    }
  };

  const currentText = texts[lang] || texts.en;

  useEffect(() => {
    if (open) {
      fetchWalletInfo();
    }
  }, [open]);

  const fetchWalletInfo = async () => {
    setCheckingBalance(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError(currentText.unauthorized);
      setCheckingBalance(false);
      return;
    }

    try {
      const response = await fetch("/api/wallet/summary", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data);
      }
    } catch (err) {
      console.error("Error fetching wallet info:", err);
    } finally {
      setCheckingBalance(false);
    }
  };

  const validateAmount = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setError(currentText.invalidNumber);
      return false;
    }
    if (numValue < MINIMUM_WITHDRAW) {
      setError(currentText.minWithdrawError);
      return false;
    }
    
    // Check if balance is locked
    if (walletInfo?.isBalanceLocked) {
      setError(currentText.withdrawalNotAllowed);
      return false;
    }
    
    // Check if enough balance
    if (walletInfo && numValue > (walletInfo.withdrawableBalance / 100)) {
      setError(currentText.insufficientBalance);
      return false;
    }
    
    setError("");
    return true;
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError("");
    }
  };

  const submit = async () => {
    setError("");

    if (!amount || !account) {
      setError(currentText.fillAllFields);
      return;
    }

    // Check if balance is locked
    if (walletInfo?.isBalanceLocked) {
      setError(currentText.withdrawalNotAllowed);
      return;
    }

    if (!validateAmount(amount)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError(currentText.unauthorized);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method, amount, account }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || data?.details?.message || currentText.withdrawFailed);
      }

      alert(currentText.withdrawSubmitted);
      onClose();
      // Reset form
      setAmount("");
      setAccount("");
    } catch (err) {
      setError(err.message || currentText.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  const methodDisplayNames = {
    bkash: currentText.bkash,
    nagad: currentText.nagad
  };

  const accountLabel = method === "bkash" ? currentText.bkashNumber : currentText.nagadNumber;

  // If checking balance, show loading
  if (checkingBalance) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md w-full bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl shadow-2xl">
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-center">{currentText.checkingBalance}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if balance is locked
  const isBalanceLocked = walletInfo?.isBalanceLocked;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs">💸</span>
              </div>
              {currentText.withdrawFunds}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Balance Information */}
          {walletInfo && (
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400">{currentText.currentBalance}</div>
                  <div className="text-lg font-bold text-white">
                    {(walletInfo.totalBalance / 100).toFixed(2)}৳
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">{currentText.availableForWithdraw}</div>
                  <div className={`text-lg font-bold ${
                    !isBalanceLocked ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {(walletInfo.withdrawableBalance / 100).toFixed(2)}৳
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Turnover Lock Warning */}
          {isBalanceLocked && (
            <div className="p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Lock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="text-yellow-300 font-bold text-sm mb-2">
                    {currentText.balanceLocked}
                  </div>
                  <div className="text-yellow-200/90 text-sm mb-3">
                    {currentText.balanceLockedInfo}
                  </div>
                  
                  {/* Turnover Progress if available */}
                  {walletInfo?.bonusSummary?.turnoverProgress && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-yellow-300 mb-1">
                        <span>{currentText.turnoverProgress}</span>
                        <span>{walletInfo.bonusSummary.turnoverProgress}%</span>
                      </div>
                      <div className="w-full bg-yellow-900/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${walletInfo.bonusSummary.turnoverProgress}%` }}
                        ></div>
                      </div>
                      {walletInfo.bonusSummary.remainingTurnover > 0 && (
                        <div className="text-xs text-yellow-400 mt-1 text-center">
                          {currentText.playMore}: {(walletInfo.bonusSummary.remainingTurnover / 100).toFixed(0)}৳
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="text-center">
                    <button
                      onClick={fetchWalletInfo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:opacity-90"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {currentText.refreshStatus}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Minimum Withdraw Notice */}
          <div className="p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl">
            <div className="text-sm text-purple-300 font-semibold flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {currentText.minWithdraw}: {MINIMUM_WITHDRAW} BDT
            </div>
            <div className="text-xs text-purple-200/80 mt-1">
              {currentText.minWithdrawDesc} {MINIMUM_WITHDRAW} BDT
            </div>
          </div>

          {/* Payment Method Dropdown */}
          <div className="relative w-full">
            <label className="text-sm text-white/80 font-medium mb-1 block">
              {currentText.paymentMethod}
            </label>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isBalanceLocked}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                isBalanceLocked 
                  ? "bg-gray-800/40 border-gray-700/50 cursor-not-allowed" 
                  : "bg-gray-800/80 border-white/10 hover:border-emerald-500 focus:outline-none"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${method === 'bkash' ? 'bg-[#E2136E]' : 'bg-[#E30B23]'}`}>
                  <span className="text-white text-xs font-bold">
                    {method === 'bkash' ? 'B' : 'N'}
                  </span>
                </div>
                <span className="text-white font-medium">{methodDisplayNames[method]}</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-white/60 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && !isBalanceLocked && (
              <div className="absolute mt-2 w-full bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-20 animate-slide-down backdrop-blur-lg">
                <button
                  onClick={() => { setMethod("bkash"); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-emerald-500/20 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-[#E2136E] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  <span className="text-white">{currentText.bkash}</span>
                </button>
                <button
                  onClick={() => { setMethod("nagad"); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-emerald-500/20 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-[#E30B23] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <span className="text-white">{currentText.nagad}</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="text-sm text-white/80 font-medium mb-1 block">
              {accountLabel}
            </label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={currentText.accountPlaceholder}
              disabled={isBalanceLocked}
              className={`w-full px-4 py-3 rounded-xl border-2 text-white outline-none font-mono text-lg transition-all duration-200 ${
                isBalanceLocked
                  ? "bg-gray-800/40 border-gray-700/50 cursor-not-allowed"
                  : "bg-gray-800/80 border-white/10 focus:border-emerald-500"
              }`}
            />
            <div className="text-xs text-gray-400 mt-1">
              {currentText.enterExactly} {methodDisplayNames[method]} {currentText.number}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-white/80 font-medium mb-1 block">
              {currentText.amount}
            </label>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder={currentText.amountPlaceholder}
              disabled={isBalanceLocked}
              className={`w-full px-4 py-3 rounded-xl border-2 text-white outline-none text-lg transition-all duration-200 ${
                isBalanceLocked
                  ? "bg-gray-800/40 border-gray-700/50 cursor-not-allowed"
                  : "bg-gray-800/80 border-white/10 focus:border-emerald-500"
              }`}
            />
            {amount && !isBalanceLocked && (
              <div className="text-xs mt-2">
                <span className="text-gray-400">{currentText.entered}: </span>
                <span className={Number(amount) >= MINIMUM_WITHDRAW ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                  {amount} BDT
                </span>
                {Number(amount) < MINIMUM_WITHDRAW && (
                  <span className="text-red-400 ml-2">
                    ({currentText.needMore} {MINIMUM_WITHDRAW - Number(amount)} {currentText.more})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className={`p-3 rounded-xl ${
              error.includes("Complete") || error.includes("টার্নওভার")
                ? "bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40"
                : "bg-gradient-to-r from-red-900/40 to-red-900/20 border border-red-500/40"
            }`}>
              <div className={`text-sm font-semibold flex items-center ${
                error.includes("Complete") || error.includes("টার্নওভার")
                  ? "text-yellow-300"
                  : "text-red-300"
              }`}>
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-xl">
            <div className="text-sm text-emerald-300 font-semibold mb-2 flex items-center">
              <span className="mr-2">📋</span>
              {currentText.important}:
            </div>
            <div className="text-xs text-emerald-200/90 space-y-1.5">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 mt-1 flex-shrink-0"></div>
                {currentText.copyNumber}
              </div>
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 mt-1 flex-shrink-0"></div>
                {currentText.processingTime}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={submit} 
            disabled={loading || isBalanceLocked || !amount || !account || Number(amount) < MINIMUM_WITHDRAW}
            className={`w-full py-3 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 ${
              isBalanceLocked
                ? "bg-gradient-to-r from-gray-700 to-gray-800 border-0 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border-0"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {currentText.submitting}
              </span>
            ) : isBalanceLocked ? (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                {currentText.completeTurnover}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💸</span>
                {currentText.submitWithdraw}
              </span>
            )}
          </Button>

          {/* Withdraw Summary */}
          {(amount || account) && !isBalanceLocked && (
            <div className="p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span>📊</span>
                {currentText.withdrawSummary}
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{currentText.methodLabel}:</span>
                  <span className="text-white font-semibold bg-gray-700/50 px-3 py-1 rounded-lg">
                    {methodDisplayNames[method]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{currentText.amountLabel}:</span>
                  <span className={`font-bold ${Number(amount) >= MINIMUM_WITHDRAW ? "text-green-400" : "text-yellow-400"}`}>
                    {amount} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{currentText.accountLabel}:</span>
                  <span className="text-white font-mono bg-gray-700/50 px-3 py-1 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400">{account}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Time Info */}
          <div className="text-center">
            <div className="text-xs text-gray-400 animate-pulse">
              ⏱️ {currentText.withdrawInfo}
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx>{`
        .animate-slide-down {
          animation: slideDown 0.2s ease-out forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Dialog>
  );
}