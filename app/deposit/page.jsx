"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/useLang";
import { 
  ChevronLeft, 
  Bell, 
  Copy,
  Clock,
  Check,
  ChevronDown,
  Home,
  X,
  AlertCircle
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
const MAXIMUM_DEPOSIT = 25000;

// Preset amounts with bonuses (10x turnover)
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
    description: "প্রতিদিন মাত্র ১ বার অংশগ্রহণ করা যাবে",
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

export default function DepositPage() {
  const { lang } = useLang();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedPresetBonus, setSelectedPresetBonus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState({});
  const [timer, setTimer] = useState(600);
  const [selectedChannel, setSelectedChannel] = useState("bkash-vip-2");
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [showProgramDetails, setShowProgramDetails] = useState(false);
  const [trxId, setTrxId] = useState("");
  const [activeBonusType, setActiveBonusType] = useState(null); // 'preset' or 'program' or null
  
  // Refs for input fields
  const amountInputRef = useRef(null);
  const trxIdInputRef = useRef(null);

  // Get current payment channel
  const currentChannel = PAYMENT_CHANNELS[method].find(ch => ch.id === selectedChannel) || PAYMENT_CHANNELS[method][0];

  // Language-specific text
  const texts = {
    en: {
      // Header
      deposit: "Deposit",
      back: "Back",
      home: "Home",
      
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
      warning: "You can only select one bonus type",
      
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
      nagad: "Nagad",
      
      // Bonus Info
      presetBonus: "Preset Bonus",
      programBonus: "Program Bonus",
      totalBonus: "Total Bonus",
      clearSelection: "Clear",
      turnover: "Turnover"
    },
    bn: {
      // Header
      deposit: "জমা দিন",
      back: "পেছনে",
      home: "হোম",
      
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
      warning: "আপনি শুধুমাত্র একটি বোনাস টাইপ নির্বাচন করতে পারেন",
      
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
      nagad: "নগদ",
      
      // Bonus Info
      presetBonus: "প্রিসেট বোনাস",
      programBonus: "প্রোগ্রাম বোনাস",
      totalBonus: "মোট বোনাস",
      clearSelection: "মুছুন",
      turnover: "টার্নওভার"
    }
  };

  const currentText = texts[lang] || texts.en;

  // Generate a stable reference ID
  useEffect(() => {
    const generateReference = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `DEP${timestamp}${random}`;
    };
    
    setReferenceId(generateReference());
  }, []);

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

  // Reset timer when step changes to 2
  useEffect(() => {
    if (step === 2) {
      setTimer(600);
    }
  }, [step]);

  // Focus amount input when preset is selected
  useEffect(() => {
    if (selectedPreset && amountInputRef.current) {
      amountInputRef.current.focus();
      setTimeout(() => {
        if (amountInputRef.current) {
          const value = amountInputRef.current.value;
          amountInputRef.current.value = '';
          amountInputRef.current.value = value;
        }
      }, 10);
    }
  }, [selectedPreset]);

  // Update activeBonusType when selection changes
  useEffect(() => {
    if (selectedPreset !== null) {
      setActiveBonusType('preset');
    } else if (selectedProgram !== null) {
      setActiveBonusType('program');
    } else {
      setActiveBonusType(null);
    }
  }, [selectedPreset, selectedProgram]);

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
    
    // Check if typed amount matches any preset
    const numValue = Number(value);
    const matchedPreset = PRESET_AMOUNTS.find(preset => preset.amount === numValue);
    
    if (matchedPreset && activeBonusType === 'preset') {
      // If user has preset selected and types a preset amount, update bonus
      setSelectedPresetBonus(matchedPreset.bonus);
    } else if (!matchedPreset && activeBonusType === 'preset') {
      // If user types a non-preset amount but preset is selected, clear preset
      setSelectedPreset(null);
      setSelectedPresetBonus(0);
      setActiveBonusType(null);
    }
    
    if (value) {
      validateAmount(value);
    } else {
      setError("");
    }
  };

  const handlePresetSelect = (preset) => {
    // If program is selected, ask user to clear it first
    if (activeBonusType === 'program') {
      setError(lang === 'bn' 
        ? 'আপনি ইতিমধ্যে প্রোগ্রাম বোনাস নির্বাচন করেছেন। প্রিসেট বোনাস নির্বাচন করতে প্রথমে প্রোগ্রাম বোনাস মুছুন।' 
        : 'You have already selected program bonus. To select preset bonus, first clear the program bonus.');
      return;
    }
    
    setAmount(preset.amount.toString());
    setSelectedPreset(preset.amount);
    setSelectedPresetBonus(preset.bonus);
    setSelectedProgram(null); // Clear any program selection
    setError(""); // Clear any previous errors
    validateAmount(preset.amount);
    
    setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        const value = amountInputRef.current.value;
        amountInputRef.current.value = '';
        amountInputRef.current.value = value;
      }
    }, 10);
  };

  const handleProgramSelect = (programId) => {
    // If preset is selected, ask user to clear it first
    if (activeBonusType === 'preset') {
      setError(lang === 'bn' 
        ? 'আপনি ইতিমধ্যে প্রিসেট বোনাস নির্বাচন করেছেন। প্রোগ্রাম বোনাস নির্বাচন করতে প্রথমে প্রিসেট বোনাস মুছুন।' 
        : 'You have already selected preset bonus. To select program bonus, first clear the preset bonus.');
      return;
    }
    
    setSelectedProgram(programId);
    setSelectedPreset(null); // Clear any preset selection
    setSelectedPresetBonus(0); // Clear preset bonus
    setError(""); // Clear any previous errors
    setShowProgramDetails(true);
  };

  const clearPresetSelection = () => {
    setSelectedPreset(null);
    setSelectedPresetBonus(0);
    setError("");
  };

  const clearProgramSelection = () => {
    setSelectedProgram(null);
    setShowProgramDetails(false);
    setError("");
  };

  const toggleProgramDetails = () => {
    if (selectedProgram === 1) {
      setShowProgramDetails(!showProgramDetails);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopySuccess({ ...copySuccess, [field]: true });
    setTimeout(() => {
      setCopySuccess({ ...copySuccess, [field]: false });
    }, 2000);
  };

  const calculateProgramBonus = () => {
    if (!selectedProgram || selectedProgram !== 1) return 0;
    
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) return 0;
    
    // Find applicable tier
    const applicableTier = DEPOSIT_PROGRAMS[0].tiers
      .slice()
      .reverse()
      .find(tier => numAmount >= tier.min);
    
    return applicableTier ? (numAmount * applicableTier.bonusPercent) / 100 : 0;
  };

  const getTotalBonus = () => {
    if (activeBonusType === 'preset') {
      return selectedPresetBonus;
    } else if (activeBonusType === 'program') {
      return calculateProgramBonus();
    }
    return 0;
  };

  const getTurnoverMultiplier = () => {
    if (activeBonusType === 'preset') return 10;
    if (activeBonusType === 'program') return 7;
    return 0;
  };

  const handleNext = () => {
    if (!amount || !validateAmount(amount)) {
      setError(currentText.fillAllFields);
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(1);
    }
  };

  const goHome = () => {
    router.push("/");
  };

  const submitDeposit = async () => {
    if (!trxId.trim()) {
      setError("Please enter Transaction ID");
      if (trxIdInputRef.current) {
        trxIdInputRef.current.focus();
      }
      return;
    }
    if (trxId.length < 10) {
      setError("Transaction ID must be at least 10 characters");
      if (trxIdInputRef.current) {
        trxIdInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      const totalBonus = getTotalBonus();

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
          programId: activeBonusType === 'program' ? DEPOSIT_PROGRAMS[0].id : null,
          presetBonus: activeBonusType === 'preset' ? selectedPresetBonus : null,
          paymentChannel: selectedChannel,
          referenceId: referenceId
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit deposit");
      }

      alert(lang === 'bn' ? "ডিপোজিট অনুরোধ পাঠানো হয়েছে। অনুমোদনের পর ব্যালেন্স পাবেন।" : "Deposit request sent. You will receive balance after approval.");
      router.push("/");
    } catch (err) {
      setError(err.message || "Failed to submit deposit");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Component
  const Step2Content = () => {
    const handleSubmit = () => {
      submitDeposit();
    };

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-700"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">{currentText.back}</span>
            </button>
            
            <button
              onClick={goHome}
              className="flex items-center text-gray-700"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
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

            {/* Bonus Display (if any) */}
            {getTotalBonus() > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">{currentText.totalBonus}</span>
                  <span className="text-green-600 font-bold">+৳{getTotalBonus()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    🎁 {activeBonusType === 'preset' ? currentText.presetBonus : currentText.programBonus}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getTurnoverMultiplier()}x {currentText.turnover}
                  </div>
                </div>
              </div>
            )}

            {/* Row 5: Timer */}
            <div className="flex justify-between items-center pt-2 border-t">
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
              ref={trxIdInputRef}
              type="text"
              placeholder={currentText.transactionIdPlaceholder}
              value={trxId}
              onChange={(e) => {
                setTrxId(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-black"
              autoFocus={step === 2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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

        {/* Fixed Bottom Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
          <div className="px-4 py-6">
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
          </div>
        </div>
      </div>
    );
  };

  // Step 1 Component
  const Step1Content = () => {
    const isButtonDisabled = !amount || Number(amount) < MINIMUM_DEPOSIT || Number(amount) > MAXIMUM_DEPOSIT;
    const totalBonus = getTotalBonus();

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#8B0000] px-4 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="text-white">
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
              <button onClick={goHome} className="text-white">
                <Home className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-32">
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
                <div key={preset.amount} className="relative">
                  <button
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full p-3 rounded-lg border ${
                      selectedPreset === preset.amount
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
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
                  
                  {/* Clear button for selected preset */}
                  {selectedPreset === preset.amount && (
                    <button
                      onClick={clearPresetSelection}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-black">
                <span>{currentText.minDeposit} ৳{MINIMUM_DEPOSIT}</span>
                <span>{currentText.maxDeposit} ৳{MAXIMUM_DEPOSIT}</span>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
                  ৳
                </div>
                <input
                  ref={amountInputRef}
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  onFocus={(e) => {
                    setTimeout(() => {
                      const target = e.target;
                      const value = target.value;
                      target.value = '';
                      target.value = value;
                    }, 0);
                  }}
                  placeholder={currentText.amountPlaceholder}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-black"
                  min={MINIMUM_DEPOSIT}
                  max={MAXIMUM_DEPOSIT}
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* Active Selection Display */}
              {activeBonusType && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🎁</span>
                      </div>
                      <span className="text-blue-700 font-medium">
                        {activeBonusType === 'preset' ? currentText.presetBonus : currentText.programBonus}
                      </span>
                    </div>
                    <span className="text-blue-600 font-bold">+৳{totalBonus}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-blue-600">
                      {getTurnoverMultiplier()}x {currentText.turnover}
                    </div>
                    <button
                      onClick={activeBonusType === 'preset' ? clearPresetSelection : clearProgramSelection}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {currentText.clearSelection}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 bg-gray-100 -mx-4"></div>

          {/* Section 4: Programs */}
          <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h2 className="font-bold text-gray-800 text-lg">
                  {currentText.programs}
                </h2>
              </div>
              <button 
                onClick={toggleProgramDetails}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center"
              >
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProgramDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Program Card - Collapsible */}
            <div className="relative">
              <div 
                onClick={() => handleProgramSelect(1)}
                className={`border-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                  selectedProgram === 1 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-pink-200 bg-white hover:border-pink-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                          selectedProgram === 1 ? 'border-green-500' : 'border-red-500'
                        }`}>
                          {selectedProgram === 1 && (
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {DEPOSIT_PROGRAMS[0].title}
                        </h3>
                        {showProgramDetails && (
                          <p className="text-gray-600 text-xs mt-1">
                            {DEPOSIT_PROGRAMS[0].description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-red-600 font-bold text-sm">
                        {DEPOSIT_PROGRAMS[0].requirement}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                {showProgramDetails && (
                  <div className="px-4 pb-4 border-t pt-4">
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
                    <div className="pt-2 border-t mt-2">
                      <p className="text-red-600 text-xs font-medium">
                        (অতিরিক্ত পুরস্কার)
                      </p>
                      <p className="text-gray-700 text-xs mt-1">
                        {DEPOSIT_PROGRAMS[0].extraReward}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clear button for selected program */}
              {selectedProgram === 1 && (
                <button
                  onClick={clearProgramSelection}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Warning about exclusive selection */}
            {activeBonusType && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  {currentText.warning}
                </p>
              </div>
            )}

            {/* No Program Option */}
            <button
              onClick={() => {
                clearPresetSelection();
                clearProgramSelection();
              }}
              className={`w-full p-4 rounded-xl border-2 ${
                !activeBonusType
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-200 bg-white"
              } flex items-center gap-3 transition-all duration-200`}
            >
              <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center">
                {!activeBonusType && (
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
        <div className=" bottom-9 left-0 right-0 p-4 bg-white border-t shadow-lg z-10">
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
    <div className="min-h-screen bg-white">
      {step === 1 ? <Step1Content /> : <Step2Content />}
    </div>
  );
}