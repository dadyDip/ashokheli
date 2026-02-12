"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/design/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/design/ui/dialog";
import { useLang } from "@/app/i18n/useLang";
import { 
  ChevronLeft, 
  Bell, 
  MessageCircle,
  Copy,
  Clock,
  Check,
  ChevronDown
} from "lucide-react";

const PAYMENT_CHANNELS = {
  bkash: [
    { id: "bkash-vip-1", name: "Bkash-vip-1", number: "01635-073307" },
    { id: "bkash-vip-2", name: "Bkash-vip-2", number: "01712-345678" },
    { id: "bkash-premium", name: "Bkash Premium", number: "01876-543210" }
  ],
  nagad: [
    { id: "nagad-vip-1", name: "Nagad-vip-1", number: "01861-633561" },
    { id: "nagad-vip-2", name: "Nagad-vip-2", number: "01912-345678" },
    { id: "nagad-premium", name: "Nagad Premium", number: "01776-543210" }
  ]
};

const MINIMUM_DEPOSIT = 100;
const MAXIMUM_DEPOSIT = 50000;

// Preset amounts with bonuses
const PRESET_AMOUNTS = [
  { amount: 100, bonus: 60 },
  { amount: 200, bonus: 120 },
  { amount: 500, bonus: 300 },
  { amount: 1000, bonus: 600 },
  { amount: 2000, bonus: 1200 },
  { amount: 5000, bonus: 3000 },
];

// Deposit programs
const DEPOSIT_PROGRAMS = [
  {
    id: 1,
    title: "দৈনিক প্রথম রিচার্জ সর্বোচ্চ ৭৫০০ বোনাস পান",
    requirement: "≥ ৳ 100.00",
    description: "প্রতিদিন মাত্র ১ বার অংশগ্রহণ করা যাবে, টার্নওভার X7",
    tiers: [
      { min: 100, bonusPercent: 20, bonusAmount: 20 },
      { min: 200, bonusPercent: 20, bonusAmount: 40 },
      { min: 500, bonusPercent: 20, bonusAmount: 100 },
      { min: 1000, bonusPercent: 20, bonusAmount: 200 },
      { min: 2000, bonusPercent: 20, bonusAmount: 400 },
      { min: 5000, bonusPercent: 25, bonusAmount: 1250 },
      { min: 10000, bonusPercent: 25, bonusAmount: 2500, highlight: true },
      { min: 15000, bonusPercent: 30, bonusAmount: 4500, highlight: true },
      { min: 20000, bonusPercent: 30, bonusAmount: 6000, highlight: true },
      { min: 25000, bonusPercent: 35, bonusAmount: 8750, highlight: true },
    ],
    extraReward: "5,000 নগদ এক্সট্রা ভাউচার"
  }
];

export function DepositModal({ open, onClose }) {
  const { t, lang } = useLang();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = main page, 2 = confirmation page
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState({});
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [selectedChannel, setSelectedChannel] = useState("bkash-vip-2");
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);

  // Get current payment channel
  const currentChannel = PAYMENT_CHANNELS[method].find(ch => ch.id === selectedChannel) || PAYMENT_CHANNELS[method][0];

  // Language-specific text
  const texts = {
    en: {
      // Header
      deposit: "Deposit",
      back: "Back",
      
      // Section 1 - Deposit Mode
      depositMode: "Our Mode",
      selectMode: "Select payment method",
      
      // Section 2 - Payment Channel
      paymentChannel: "Payment Channel",
      selectChannel: "Select payment channel",
      
      // Section 3 - Deposit Amount
      depositAmount: "Deposit Amount",
      minDeposit: "Minimum deposit:",
      maxDeposit: "Maximum deposit:",
      enterAmount: "Enter amount (BDT)",
      amountPlaceholder: "500 - 1,000",
      
      // Section 4 - Programs
      programs: "Programs",
      participate: "Participate",
      noProgram: "Do not participate in any program",
      
      // Warning
      warningTitle: "Important Notice",
      warningText: "Use the latest account for each deposit. If transaction fails, don't save account info.",
      
      // Button
      next: "Next",
      submit: "Submit Deposit",
      submitting: "Submitting...",
      
      // Errors
      fillAllFields: "Please fill all fields",
      invalidNumber: "Please enter a valid number",
      minDepositError: `Minimum deposit is ${MINIMUM_DEPOSIT} BDT`,
      maxDepositError: `Maximum deposit is ${MAXIMUM_DEPOSIT} BDT`,
      
      // Step 2 Texts
      step2Title: "Complete Payment",
      instruction1: "Please transfer the exact amount and submit correct Transaction ID to avoid failure",
      instruction2: "Fill Transaction ID",
      instruction3: "Please send to the account number below",
      sendMoney: "Send Money",
      colNo: "Col. No",
      walletChoice: "Wallet Choice",
      amountLabel: "Amount",
      timeLimit: "Time Limit",
      importantNote: "Important Note:",
      noteText: "Before clicking confirm payment, ensure the Transaction ID is correct",
      transactionIdPlaceholder: "Submit 10-digit Transaction ID",
      confirmPayment: "Confirm Payment",
      paymentRules: "Correct procedure to send money from bKash:",
      nagadPaymentRules: "Correct procedure to send money from Nagad:",
      bKashRules: [
        "Dial *247#",
        "Select 'Send Money'",
        "Enter receiver number",
        "Enter exact amount",
        "Enter reference if asked",
        "Enter your PIN",
        "Save the Transaction ID"
      ],
      nagadRules: [
        "Dial *167#",
        "Select 'Send Money'",
        "Enter receiver number",
        "Enter exact amount",
        "Enter reference if asked",
        "Enter your PIN",
        "Save the Transaction ID"
      ],
      copy: "Copy",
      copied: "Copied!",
      
      // Payment Methods
      bkash: "bKash",
      nagad: "Nagad"
    },
    bn: {
      // Header
      deposit: "জমা দিন",
      back: "পেছনে",
      
      // Section 1 - Deposit Mode
      depositMode: "আমাদের মোড",
      selectMode: "পেমেন্ট পদ্ধতি নির্বাচন করুন",
      
      // Section 2 - Payment Channel
      paymentChannel: "পেমেন্ট চ্যানেল",
      selectChannel: "পেমেন্ট চ্যানেল নির্বাচন করুন",
      
      // Section 3 - Deposit Amount
      depositAmount: "জমা পরিমাণ",
      minDeposit: "সর্বনিম্ন জমা:",
      maxDeposit: "সর্বোচ্চ জমা:",
      enterAmount: "পরিমাণ লিখুন (টাকা)",
      amountPlaceholder: "500 - 1,000",
      
      // Section 4 - Programs
      programs: "কার্যক্রম",
      participate: "অংশগ্রহণ করুন",
      noProgram: "কোনও প্রচারে অংশ নেওয়া যায় না",
      
      // Warning
      warningTitle: "গুরুত্বপূর্ণ নোটিশ",
      warningText: "প্রতিটি ডিপোজিটের জন্য সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। লেনদেন ব্যর্থ হলে অ্যাকাউন্ট তথ্য সংরক্ষণ করবেন না।",
      
      // Button
      next: "পরবর্তী",
      submit: "ডিপোজিট সাবমিট করুন",
      submitting: "সাবমিট হচ্ছে...",
      
      // Errors
      fillAllFields: "দয়া করে সব তথ্য দিন",
      invalidNumber: "দয়া করে একটি সঠিক সংখ্যা দিন",
      minDepositError: `সর্বনিম্ন জমা ${MINIMUM_DEPOSIT} টাকা`,
      maxDepositError: `সর্বোচ্চ জমা ${MAXIMUM_DEPOSIT} টাকা`,
      
      // Step 2 Texts
      step2Title: "পেমেন্ট সম্পূর্ণ করুন",
      instruction1: "সঠিক ট্রানজেকশন আইডি জমা দিতে এবং ব্যর্থতা এড়াতে সঠিক পরিমাণ স্থানান্তর করুন",
      instruction2: "Transaction ID পূরণ করুন",
      instruction3: "অনুগ্রহ করে নিচের প্রদত্ত একাউন্ট নম্বরে",
      sendMoney: "Send Money",
      colNo: "Col. No",
      walletChoice: "ওয়ালেট পছন্দ",
      amountLabel: "পরিমাণ",
      timeLimit: "সময়সীমা",
      importantNote: "গুরুত্বপূর্ণ নোট:",
      noteText: "পেমেন্ট নিশ্চিত করার আগে, ট্রানজেকশন আইডি সঠিক কিনা নিশ্চিত করুন",
      transactionIdPlaceholder: "Submit 10-সংখ্যার Transaction ID",
      confirmPayment: "পেমেন্ট নিশ্চিত করুন",
      paymentRules: "বিকাশ (bKash) থেকে সেন্ড মানি করার সঠিক নিয়ম:",
      nagadPaymentRules: "নগদ (Nagad) থেকে সেন্ড মানি করার সঠিক নিয়ম:",
      bKashRules: [
        "ডায়াল করুন *247#",
        "'সেন্ড মানি' নির্বাচন করুন",
        "রিসিভার নম্বর দিন",
        "সঠিক পরিমাণ দিন",
        "রেফারেন্স প্রয়োজন হলে দিন",
        "আপনার পিন দিন",
        "ট্রানজেকশন আইডি সংরক্ষণ করুন"
      ],
      nagadRules: [
        "ডায়াল করুন *167#",
        "'সেন্ড মানি' নির্বাচন করুন",
        "রিসিভার নম্বর দিন",
        "সঠিক পরিমাণ দিন",
        "রেফারেন্স প্রয়োজন হলে দিন",
        "আপনার পিন দিন",
        "ট্রানজেকশন আইডি সংরক্ষণ করুন"
      ],
      copy: "কপি",
      copied: "কপি হয়েছে!",
      
      // Payment Methods
      bkash: "বিকাশ",
      nagad: "নগদ"
    }
  };

  const currentText = texts[lang] || texts.en;

  // Timer effect for step 2
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Reset timer when modal opens
  useEffect(() => {
    if (open) {
      setTimer(600);
    }
  }, [open]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateAmount = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setError(currentText.invalidNumber);
      return false;
    }
    if (numValue < MINIMUM_DEPOSIT) {
      setError(currentText.minDepositError);
      return false;
    }
    if (numValue > MAXIMUM_DEPOSIT) {
      setError(currentText.maxDepositError);
      return false;
    }
    setError("");
    return true;
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setSelectedPreset(null);
    if (value) {
      validateAmount(value);
    } else {
      setError("");
    }
  };

  const handlePresetSelect = (preset) => {
    setAmount(preset.amount.toString());
    setSelectedPreset(preset.amount);
    validateAmount(preset.amount);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopySuccess({ ...copySuccess, [field]: true });
    setTimeout(() => {
      setCopySuccess({ ...copySuccess, [field]: false });
    }, 2000);
  };

  const generateReference = () => {
    return `DEP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  const handleNext = () => {
    if (!amount || !validateAmount(amount)) {
      setError(currentText.fillAllFields);
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const submitDeposit = async (trxId) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/deposit/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          method, 
          amount: Number(amount), 
          trxId,
          programId: selectedProgram === 1 ? DEPOSIT_PROGRAMS[0].id : null,
          paymentChannel: selectedChannel
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit deposit");
      }

      // If program is selected, calculate and add bonus
      if (selectedProgram === 1) {
        const selectedTier = DEPOSIT_PROGRAMS[0].tiers.find(
          tier => Number(amount) >= tier.min
        );
        
        if (selectedTier) {
          // Calculate bonus based on amount
          const bonusAmount = (Number(amount) * selectedTier.bonusPercent) / 100;
          
          // Claim bonus through API
          await fetch("/api/bonus/claim", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              type: "deposit_bonus",
              amount: bonusAmount,
              depositAmount: Number(amount),
              programId: DEPOSIT_PROGRAMS[0].id
            }),
          });
        }
      }

      alert(lang === 'bn' ? "ডিপোজিট অনুরোধ পাঠানো হয়েছে। অনুমোদনের পর ব্যালেন্স পাবেন।" : "Deposit request sent. You will receive balance after approval.");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to submit deposit");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Component
  const Step2Content = () => {
    const [trxId, setTrxId] = useState("");
    const referenceId = generateReference();

    const handleSubmit = () => {
      if (!trxId.trim()) {
        setError("Please enter Transaction ID");
        return;
      }
      if (trxId.length < 10) {
        setError("Transaction ID must be at least 10 characters");
        return;
      }
      submitDeposit(trxId);
    };

    return (
      <div className="bg-white min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-700"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">{currentText.back}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Instructions */}
          <div className="text-center space-y-4">
            <h1 className="text-red-600 font-bold text-xl leading-tight">
              {currentText.instruction1}
            </h1>
            <h2 className="text-red-600 font-bold text-lg">
              {currentText.instruction2}
            </h2>
            <p className="text-black text-sm">
              {currentText.instruction3}
            </p>
          </div>

          {/* Send Money Title */}
          <div className="text-center">
            <span className="text-red-600 font-bold text-3xl">
              {method === 'bkash' ? 'Send Money' : 'Cash In'}
            </span>
            <span className="text-black text-lg ml-2">
              {lang === 'bn' ? 'করুন :' : 'Do :'}
            </span>
          </div>

          {/* Main Info Card */}
          <div className="border-2 border-gray-300 rounded-lg p-4 space-y-4">
            {/* Row 1: Reference ID */}
            <div className="flex justify-between items-center">
              <span className="text-black font-medium">{currentText.colNo}</span>
              <span className="text-black font-mono">{referenceId}</span>
            </div>

            {/* Row 2: Wallet Choice */}
            <div className="flex justify-between items-center">
              <span className="text-black">{currentText.walletChoice}</span>
              <div className="border border-gray-300 rounded px-3 py-1">
                <span className="font-bold text-black">
                  {method === 'bkash' ? 'bKash' : 'Nagad'}
                </span>
              </div>
            </div>

            {/* Row 3: Phone Number */}
            <div className="flex justify-between items-center">
              <span className="text-black">
                {lang === 'bn' ? 'নম্বর' : 'Number'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-black font-mono">
                  {currentChannel.number}
                </span>
                <button
                  onClick={() => copyToClipboard(currentChannel.number.replace('-', ''), 'number')}
                  className="border border-gray-300 rounded p-1 hover:bg-gray-50"
                >
                  {copySuccess.number ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 4: Amount */}
            <div className="flex justify-between items-center">
              <span className="text-black">{currentText.amountLabel}</span>
              <div className="flex items-center gap-2">
                <span className="text-black font-bold">৳{amount}</span>
                <button
                  onClick={() => copyToClipboard(amount, 'amount')}
                  className="border border-gray-300 rounded p-1 hover:bg-gray-50"
                >
                  {copySuccess.amount ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 5: Timer */}
            <div className="flex justify-between items-center">
              <span className="text-black">{currentText.timeLimit}</span>
              <span className="text-red-600 font-bold">{formatTime(timer)}</span>
            </div>
          </div>

          {/* Important Note */}
          <div className="space-y-2">
            <h3 className="text-black font-bold">{currentText.importantNote}</h3>
            <p className="text-red-600 text-sm">{currentText.noteText}</p>
          </div>

          {/* Transaction ID Input */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder={currentText.transactionIdPlaceholder}
              value={trxId}
              onChange={(e) => {
                setTrxId(e.target.value);
                setError("");
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="sticky bottom-0 bg-white border-t pt-4 px-4 pb-6 space-y-6 shrink-0">
          {/* Confirm Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !trxId.trim()}
            className={`w-full py-4 rounded-lg font-bold text-white ${
              loading || !trxId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? currentText.submitting : currentText.confirmPayment}
          </button>

          {/* Payment Instructions */}
          <div className="pt-4 border-t">
            <h4 className="text-gray-600 text-sm mb-3">
              {method === 'bkash' ? currentText.paymentRules : currentText.nagadPaymentRules}
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              {(method === 'bkash' ? currentText.bKashRules : currentText.nagadRules).map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  };

  // Step 1 Component
  const Step1Content = () => {
    const isButtonDisabled = !amount || Number(amount) < MINIMUM_DEPOSIT || Number(amount) > MAXIMUM_DEPOSIT;

    return (
      <div className="bg-white min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#8B0000] px-4 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <h1 className="text-white font-bold text-xl">
              {currentText.deposit}
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  1
                </span>
              </div>
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {/* Section 1: Deposit Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h2 className="font-bold text-gray-800 text-lg">
                {currentText.depositMode}
              </h2>
            </div>
            
            <p className="text-gray-600 text-sm">{currentText.selectMode}</p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* bKash Card */}
              <button
                onClick={() => {
                  setMethod("bkash");
                  setSelectedChannel("bkash-vip-2");
                }}
                className={`p-4 rounded-xl border-2 ${
                  method === "bkash"
                    ? "border-red-500 shadow-lg"
                    : "border-gray-200"
                } bg-white relative transition-all duration-200`}
              >
                {method === "bkash" && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-red-500 rounded-tr-xl">
                    <Check className="w-4 h-4 text-white absolute -top-8 right-1" />
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-pink-600">bK</span>
                  </div>
                  <span className="font-medium text-gray-800">bKash</span>
                </div>
              </button>

              {/* Nagad Card */}
              <button
                onClick={() => {
                  setMethod("nagad");
                  setSelectedChannel("nagad-vip-1");
                }}
                className={`p-4 rounded-xl border-2 ${
                  method === "nagad"
                    ? "border-red-500 shadow-lg"
                    : "border-gray-200"
                } bg-white relative transition-all duration-200`}
              >
                {method === "nagad" && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-red-500 rounded-tr-xl">
                    <Check className="w-4 h-4 text-white absolute -top-8 right-1" />
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-orange-600">N</span>
                  </div>
                  <span className="font-medium text-gray-800">Nagad</span>
                </div>
              </button>
            </div>
          </div>

          {/* Warning Text */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              ⚠️ {currentText.warningText}
            </p>
          </div>

          {/* Divider */}
          <div className="h-6 bg-gray-100 -mx-4"></div>

          {/* Section 2: Payment Channel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <h2 className="font-bold text-gray-800 text-lg">
                {currentText.paymentChannel}
              </h2>
            </div>
            
            <p className="text-gray-600 text-sm">{currentText.selectChannel}</p>
            
            {/* Payment Channel Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                className="w-full p-4 rounded-xl border-2 border-red-500 bg-white flex justify-between items-center"
              >
                <span className="text-red-600 font-bold">{currentChannel.name}</span>
                <ChevronDown className={`w-5 h-5 text-red-600 transition-transform ${showChannelDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showChannelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-red-500 rounded-xl shadow-lg z-10">
                  {PAYMENT_CHANNELS[method].map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel.id);
                        setShowChannelDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-red-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="font-medium text-gray-800">{channel.name}</div>
                      <div className="text-sm text-gray-600">{channel.number}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Deposit Amount */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h2 className="font-bold text-gray-800 text-lg">
                {currentText.depositAmount}
              </h2>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.amount}
                  onClick={() => handlePresetSelect(preset)}
                  className={`relative p-3 rounded-lg border ${
                    selectedPreset === preset.amount
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white"
                  } transition-all duration-200`}
                >
                  {/* Bonus Ribbon */}
                  <div className="absolute -top-1 -left-1 bg-gradient-to-r from-pink-400 to-orange-400 text-white text-xs px-2 py-0.5 rounded-tl rounded-br">
                    +{preset.bonus}
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-800">
                      ৳{preset.amount}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{currentText.minDeposit} ৳{MINIMUM_DEPOSIT}</span>
                <span>{currentText.maxDeposit} ৳{MAXIMUM_DEPOSIT}</span>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ৳
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={currentText.amountPlaceholder}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  min={MINIMUM_DEPOSIT}
                  max={MAXIMUM_DEPOSIT}
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 bg-gray-100 -mx-4"></div>

          {/* Section 4: Programs */}
          <div className="space-y-4 pb-24"> {/* Extra padding for bottom button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h2 className="font-bold text-gray-800 text-lg">
                  {currentText.programs}
                </h2>
              </div>
              <button className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Program Card */}
            <div className="border-2 border-pink-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <div className="w-5 h-5 border-2 border-red-500 rounded-full flex items-center justify-center">
                      {selectedProgram === 1 && (
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">
                      {DEPOSIT_PROGRAMS[0].title}
                    </h3>
                    <p className="text-gray-600 text-xs mt-1">
                      {DEPOSIT_PROGRAMS[0].description}
                    </p>
                  </div>
                </div>
                <span className="text-red-600 font-bold text-sm">
                  {DEPOSIT_PROGRAMS[0].requirement}
                </span>
              </div>

              {/* Tiers List */}
              <div className="space-y-1">
                {DEPOSIT_PROGRAMS[0].tiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`flex justify-between text-xs ${
                      tier.highlight
                        ? "font-bold text-gray-800"
                        : "text-gray-600"
                    }`}
                  >
                    <span>ডিপোজিট ≥ {tier.min}, বোনাস {tier.bonusPercent}%, পরিমাণ {tier.bonusAmount}</span>
                    {tier.bonusPercent === 30 && (
                      <span className="text-red-600">{tier.bonusPercent}%</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Extra Reward */}
              <div className="pt-2 border-t">
                <p className="text-red-600 text-xs font-medium">
                  (অতিরিক্ত পুরস্কার)
                </p>
                <p className="text-gray-700 text-xs mt-1">
                  {DEPOSIT_PROGRAMS[0].extraReward}
                </p>
              </div>
            </div>

            {/* No Program Option */}
            <button
              onClick={() => setSelectedProgram(null)}
              className={`w-full p-4 rounded-xl border-2 ${
                selectedProgram === null
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-200 bg-white"
              } flex items-center gap-3 transition-all duration-200`}
            >
              <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center">
                {selectedProgram === null && (
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                )}
              </div>
              <span className="font-bold text-gray-800">
                {currentText.noProgram}
              </span>
            </button>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg shrink-0">
          <button
            onClick={handleNext}
            disabled={isButtonDisabled}
            className={`w-full py-4 rounded-xl font-bold text-lg ${
              isButtonDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 transition-colors"
            }`}
          >
            {currentText.next}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-full sm:max-w-full h-screen sm:h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {step === 1 ? <Step1Content /> : <Step2Content />}
        </div>
      </DialogContent>
    </Dialog>
  );
}