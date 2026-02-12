"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/app/i18n/useLang";
import { 
  Gift, DollarSign, TrendingUp, Target,
  Sparkles, Share2, CheckCircle, MessageCircle,
  Phone, Copy, Clock, RefreshCw, Zap, Users,
  Award, Medal, Star, Rocket, Flame, Crown,
  Gem, Diamond, Infinity, Coins
} from "lucide-react";
import axios from "axios";
import DailyBonusModal from "@/components/DailyBonusModal";

export default function SharePage() {
  const { lang } = useLang();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bonusStatus, setBonusStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [redCardUsedToday, setRedCardUsedToday] = useState(0);
  const [activeBonuses, setActiveBonuses] = useState([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
    eligibleFriends: []
  });
  
  // Daily bonus modal state
  const [showDailyBonusModal, setShowDailyBonusModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const [userResponse, bonusResponse, referralResponse] = await Promise.all([
        axios.get('/api/wallet/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/bonus/status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/referral/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser(userResponse.data);
      setBonusStatus(bonusResponse.data);
      setActiveBonuses(bonusResponse.data.bonuses?.active || []);
      setReferralStats(referralResponse.data);
      
      // Check how many red cards used today (MAX 2 TIMES)
      const today = new Date().toDateString();
      const redCardCount = localStorage.getItem(`redCardCount_${today}`);
      setRedCardUsedToday(redCardCount ? parseInt(redCardCount) : 0);

      // Calculate real stats
      const userStats = [
        { 
          number: userResponse.data.totalBonusGiven ? (userResponse.data.totalBonusGiven / 100).toFixed(0) : '0', 
          label: 'মোট বোনাস', 
          suffix: '৳',
          icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
        },
        { 
          number: referralResponse.data?.totalReferrals || '0', 
          label: 'মোট রেফারেল',
          icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        },
        { 
          number: referralResponse.data?.totalEarned ? (referralResponse.data.totalEarned).toFixed(0) : '0', 
          label: 'রেফারেল বোনাস', 
          suffix: '৳',
          icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />
        },
        { 
          number: bonusResponse.data.bonuses?.summary?.withdrawableBonusBalance ? 
            (bonusResponse.data.bonuses.summary.withdrawableBonusBalance).toFixed(0) : '0', 
          label: 'তোলা যাবে',
          suffix: '৳',
          icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        },
      ];

      setStats(userStats);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startDailyBonus = () => {
    // Check if user has made first deposit
    if (!user?.totalDeposited || user.totalDeposited < 30000) {
      setMessage('প্রথমে ৩০০৳ ডিপোজিট করুন ৫,০০০৳ ডেইলি বোনাস পাওয়ার জন্য!');
      setMessageType('error');
      return;
    }
    
    // Check if already used max 2 times today
    if (redCardUsedToday >= 2) {
      setMessage('আপনি আজকের ২টি বোনাসই নিয়েছেন! কাল আবার চেষ্টা করুন');
      setMessageType('error');
      return;
    }
    
    setShowDailyBonusModal(true);
  };

  const claimDailyBonus = async (amount) => {
    setClaimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bonus/claim', {
        type: 'red_card',
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`🎉 ${amount}৳ বোনাস যোগ হয়েছে!`);
      setMessageType('success');
      
      // Increment red card count for today (MAX 2)
      const today = new Date().toDateString();
      const currentCount = parseInt(localStorage.getItem(`redCardCount_${today}`) || '0');
      const newCount = currentCount + 1;
      localStorage.setItem(`redCardCount_${today}`, newCount.toString());
      setRedCardUsedToday(newCount);
      
      // Refresh data
      fetchUserData();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowDailyBonusModal(false);
        setClaimLoading(false);
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'বোনাস ক্লেইম করতে সমস্যা হয়েছে');
      setMessageType('error');
      setClaimLoading(false);
    }
  };

  const claimFirstDepositBonus = async () => {
    // Check if user has made deposit between 300-500 TK
    if (!user?.totalDeposited) {
      setMessage('১০০% - ১০০০% ওয়েলকাম বোনাস পেতে আজই ডিপোজিট করুন!');
      setMessageType('error');
      return;
    }

    const depositAmount = user.totalDeposited / 100;
    
    if (depositAmount < 300) {
      setMessage(`আরও ${300 - depositAmount}৳ ডিপোজিট করে ১০০০% বোনাস নিন!`);
      setMessageType('error');
      return;
    }

    if (depositAmount > 500) {
      setMessage('বোনাস শুধুমাত্র ৩০০-৫০০৳ ডিপোজিটে পাওয়া যাবে!');
      setMessageType('error');
      return;
    }
    
    // Check if already claimed
    if (user?.isFirstDepositBonusClaimed) {
      setMessage('আপনি ইতিমধ্যে ওয়েলকাম বোনাস নিয়েছেন!');
      setMessageType('error');
      return;
    }
    
    setClaimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bonus/claim', {
        type: 'first_deposit_300'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`🎊 অভিনন্দন! ${response.data.bonus.amount}৳ বোনাস যোগ হয়েছে!`);
      setMessageType('success');
      fetchUserData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'বোনাস ক্লেইম করতে সমস্যা হয়েছে');
      setMessageType('error');
    } finally {
      setClaimLoading(false);
    }
  };

  const claimReferralReward = async (friendId) => {
    setClaimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bonus/claim', {
        type: 'referral_reward',
        friendId: friendId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`💰 ২৫০৳ রেফারেল বোনাস যোগ হয়েছে!`);
      setMessageType('success');
      
      // Refresh all data
      await fetchUserData();
      
      // Refresh referral stats
      const referralResponse = await axios.get('/api/referral/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralStats(referralResponse.data);
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'রিওয়ার্ড ক্লেইম করতে সমস্যা হয়েছে');
      setMessageType('error');
    } finally {
      setClaimLoading(false);
    }
  };

  const copyCode = () => {
    const codeToCopy = user?.promoCode || "SHARE123";
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMessage(`📋 রেফারেল কোড কপি হয়েছে!`);
    setMessageType('success');
  };

  const handleRefresh = () => {
    fetchUserData();
    setMessage(`✨ বোনাস সিস্টেম আপডেট হয়েছে!`);
    setMessageType('success');
  };

  const closeDailyBonusModal = () => {
    setShowDailyBonusModal(false);
    setClaimLoading(false);
  };

  // Calculate turnover progress
  const turnoverProgress = bonusStatus?.bonuses?.summary || {
    completionPercentage: 0,
    remainingTurnover: 0,
    totalCompletedTurnover: 0,
    totalRequiredTurnover: 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 flex items-center justify-center px-4">
        <div className="text-center w-full max-w-md mx-auto">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🎰</span>
            </div>
          </div>
          <p className="text-gray-600 text-base sm:text-lg font-medium mt-4">বোনাস সিস্টেম লোড হচ্ছে...</p>
          <p className="text-pink-500 text-sm sm:text-base mt-2">১০০০% বোনাস আপনার জন্য অপেক্ষা করছে!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 py-6 sm:py-8 px-4 sm:px-6">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-1/4 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="w-full sm:w-auto">
              <div className="inline-flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  বোনাস সেন্টার
                </h1>
              </div>
              <p className="text-base sm:text-lg text-white/90">
                {user?.firstName ? `স্বাগতম, ${user.firstName}!` : "স্বাগতম!"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all hover:scale-105 self-end sm:self-auto"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
          
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">
            বোনাস নিন এবং টার্নওভার সম্পূর্ণ করে তুলুন!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white to-pink-50 rounded-xl p-3 sm:p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg border border-pink-100"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="text-pink-500">
                  {stat.icon}
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {stat.number}<span className="text-xs sm:text-sm">{stat.suffix || ''}</span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-700 font-medium break-words">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* MAIN BONUS CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* 100-1000% WELCOME BONUS - HYPE */}
          <div className={`bg-white rounded-xl p-4 sm:p-6 border-2 ${
            user?.isFirstDepositBonusClaimed 
              ? 'border-green-300' 
              : 'border-pink-200 hover:border-pink-400'
          } transition-all duration-300 hover:shadow-lg relative overflow-hidden`}>
            
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                user?.isFirstDepositBonusClaimed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
              }`}>
                {user?.isFirstDepositBonusClaimed ? 'নিয়েছেন ✓' : '১০০-১০০০% বোনাস'}
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100">
                <span className="text-2xl sm:text-3xl">🚀</span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  ১০,০০০৳
                </div>
                <div className="text-xs text-gray-500">সর্বোচ্চ বোনাস</div>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
              ১০০% - ১০০০% ওয়েলকাম বোনাস
            </h3>
            
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              ৩০০-৫০০৳ ডিপোজিট করুন ও ১০,০০০৳ পর্যন্ত বোনাস পান!
            </p>

            <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-pink-200">
              <div className="flex items-center gap-1 sm:gap-2 text-pink-600 mb-1 sm:mb-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-bold">আপনার টাকা ১০ গুণ করুন এখনই!</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                সর্বনিম্ন: ৩০০৳ | সর্বোচ্চ: ৫০০৳ | বোনাস: ১০০% - ১০০০%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                🎁 বিশেষ অফার: আজই ডিপোজিট করুন দ্বিগুণ থেকে দশগুণ বোনাস!
              </p>
            </div>

            <button
              onClick={claimFirstDepositBonus}
              disabled={claimLoading || user?.isFirstDepositBonusClaimed}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                user?.isFirstDepositBonusClaimed
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90 animate-pulse'
              }`}
            >
              {claimLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  প্রক্রিয়াকরণ...
                </span>
              ) : user?.isFirstDepositBonusClaimed ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  নিয়েছেন ✓
                </span>
              ) : (
                '১০০০% বোনাস নিন'
              )}
            </button>
            
            {(!user?.totalDeposited || user.totalDeposited/100 < 300) && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800 text-center font-bold">
                  ⚡ ৩০০৳ ডিপোজিট করে ১০,০০০৳ বোনাস নিন! অফার শেষের পথে!
                </p>
              </div>
            )}
          </div>

          {/* DAILY BONUS - UP TO 5000৳ HYPE */}
          <div className={`bg-white rounded-xl p-4 sm:p-6 border-2 ${
            redCardUsedToday >= 2 
              ? 'border-gray-300' 
              : 'border-purple-200 hover:border-purple-400'
          } transition-all duration-300 hover:shadow-lg relative overflow-hidden`}>
            
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                redCardUsedToday >= 2 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              }`}>
                {redCardUsedToday >= 2 ? 'নিয়েছেন' : '৫,০০০৳ পর্যন্ত'}
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                <span className="text-2xl sm:text-3xl">🧧</span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  ৫,০০০৳
                </div>
                <div className="text-xs text-gray-500">প্রতিদিন সর্বোচ্চ</div>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
              ডেইলি রেড কার্ড
            </h3>
            
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              তাৎক্ষণিক ৫,০০০৳ পর্যন্ত বোনাস! দৈনিক ২ বার সুযোগ
            </p>

            <div className="bg-purple-50/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm text-gray-700 font-medium">আজ বাকি:</span>
                <span className="text-lg sm:text-xl font-bold text-purple-600">{redCardUsedToday}/২</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-2.5 rounded-full transition-all"
                  style={{ width: `${(redCardUsedToday/2)*100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>🎯 ৯০%: ০.৫০-২.০০৳</span>
                <span>💎 ১০%: ২.১০-৫.০০৳</span>
              </div>
              <p className="text-purple-600 font-bold text-xs sm:text-sm mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                কোন টার্নওভার নেই!
              </p>
            </div>

            <button
              onClick={startDailyBonus}
              disabled={redCardUsedToday >= 2 || claimLoading}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                redCardUsedToday >= 2
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
              }`}
            >
              {claimLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  প্রক্রিয়াকরণ...
                </span>
              ) : redCardUsedToday >= 2 ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  নিয়েছেন
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🧧</span>
                  ৫,০০০৳ বোনাস নিন ({2 - redCardUsedToday} বাকি)
                </span>
              )}
            </button>
            
            {(!user?.totalDeposited || user.totalDeposited/100 < 300) && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800 text-center font-medium">
                  ⚡ ৩০০৳ ডিপোজিট করে ৫,০০০৳ ডেইলি বোনাস নিন!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* REFERRAL CHALLENGE - 250৳ PER FRIEND */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-purple-200 hover:border-purple-300 transition-all">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                <span className="text-2xl sm:text-3xl">👥</span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ২৫০৳
                </div>
                <div className="text-xs text-gray-500">প্রতি বন্ধুর জন্য</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 rounded-lg border border-purple-200 flex-1 sm:flex-none text-center">
                <span className="text-xs sm:text-sm font-medium text-purple-800">
                  {referralStats.totalReferrals || 0} বন্ধু
                </span>
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-pink-100 rounded-lg border border-pink-200 flex-1 sm:flex-none text-center">
                <span className="text-xs sm:text-sm font-medium text-pink-800">
                  {referralStats.totalEarned ? (referralStats.totalEarned).toFixed(0) : 0}৳ আয়
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            রেফারেল বোনাস
          </h3>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            প্রতিটি বন্ধুর জন্য ২৫০ৃ বোনাস! বন্ধু ৩০০৳ ডিপোজিট ও ৩০০০৳ বাজি ধরলেই পাবেন!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span className="font-bold text-sm sm:text-base text-gray-800">২৫০৳ বোনাস</span>
              </div>
              <p className="text-xs text-gray-600">
                বন্ধু ৩০০৳ ডিপোজিট + ৩০০০৳ বাজি
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                <span className="font-bold text-sm sm:text-base text-gray-800">তোলার জন্য প্রস্তুত</span>
              </div>
              <p className="text-xs text-gray-600">
                টার্নওভার সম্পূর্ণ হলে তুলতে পারবেন
              </p>
            </div>
          </div>

          {/* Referral Code Display */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-dashed border-purple-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">আপনার রেফারেল কোড</span>
              </div>
              
              {user?.promoCode ? (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <span className="font-mono text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {user.promoCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    {copied ? 'কপি হয়েছে!' : 'কোড কপি করুন'}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 bg-yellow-100 text-yellow-800 font-medium rounded-lg border border-yellow-300 text-xs sm:text-sm w-full sm:w-auto text-center">
                  ৩০০৳ ডিপোজিটের পর রেফারেল কোড দেখাবে
                </div>
              )}
            </div>
            
            <p className="text-center text-gray-500 text-xs mt-3 sm:mt-4">
              বন্ধু ৩০০৳ ডিপোজিট ও ৩০০০৳ বাজি ধরলে = আপনি পাবেন ২৫০৳!
            </p>
          </div>

          {/* PENDING REFERRAL REWARDS */}
          {referralStats.eligibleFriends?.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                রেডি টু ক্লেইম - ২৫০৳
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {referralStats.eligibleFriends.map((friend) => (
                  <div key={friend.id} className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <p className="text-sm sm:text-base font-medium text-gray-800">{friend.firstName || 'বন্ধু'} {friend.lastName || ''}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ডিপোজিট: {friend.totalDeposited/100}৳ | বাজি: {friend.totalTurnover/100}৳
                      </p>
                    </div>
                    <button
                      onClick={() => claimReferralReward(friend.id)}
                      disabled={claimLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {claimLoading ? (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <>
                          <span>💰</span>
                          ২৫০৳ নিন
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE BONUSES WITH TURNOVER PROGRESS */}
        {activeBonuses.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                সক্রিয় বোনাস
              </h3>
              <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                {activeBonuses.length} টি
              </span>
            </div>
            
            {/* Turnover Progress Summary */}
            {turnoverProgress.totalRequiredTurnover > 0 && (
              <div className="mb-6 bg-white/60 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">টার্নওভার প্রগ্রেস</span>
                  <span className="text-sm font-bold text-blue-600">{turnoverProgress.completionPercentage}% সম্পূর্ণ</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${turnoverProgress.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>খেলা হয়েছে: {turnoverProgress.totalCompletedTurnover}৳</span>
                  <span>প্রয়োজন: {turnoverProgress.totalRequiredTurnover}৳</span>
                </div>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              {activeBonuses.map((bonus) => {
                // Determine bonus type display
                let bonusIcon = '🎁';
                let bonusTitle = 'বোনাস';
                let bonusColor = 'blue';
                
                if (bonus.type === 'first_deposit_300') {
                  bonusIcon = '🚀';
                  bonusTitle = 'ওয়েলকাম বোনাস (১০০%)';
                  bonusColor = 'pink';
                } else if (bonus.type === 'red_card') {
                  bonusIcon = '🧧';
                  bonusTitle = 'ডেইলি রেড কার্ড';
                  bonusColor = 'purple';
                } else if (bonus.type === 'referral_reward') {
                  bonusIcon = '👥';
                  bonusTitle = 'রেফারেল বোনাস (২৫০৳)';
                  bonusColor = 'green';
                }
                
                // Calculate individual bonus progress
                const bonusProgress = bonus.turnoverAmount > 0 
                  ? Math.round((bonus.currentTurnover / bonus.turnoverAmount) * 100) 
                  : 0;
                
                return (
                  <div key={bonus.id} className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xl sm:text-2xl">{bonusIcon}</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-800">
                            {bonusTitle}
                          </span>
                          <span className={`text-sm sm:text-base font-bold text-${bonusColor}-600 ml-auto sm:ml-0`}>
                            {bonus.amount / 100}৳
                          </span>
                        </div>
                        
                        {/* Individual Turnover Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>টার্নওভার:</span>
                            <span>{bonus.currentTurnover / 100}৳ / {bonus.turnoverAmount / 100}৳</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`bg-gradient-to-r from-${bonusColor}-500 to-${bonusColor}-600 h-1.5 rounded-full`}
                              style={{ width: `${bonusProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto text-right">
                        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium mb-2 inline-block ${
                          bonus.isWithdrawable || bonus.currentTurnover >= bonus.turnoverAmount
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bonus.isWithdrawable || bonus.currentTurnover >= bonus.turnoverAmount
                            ? 'তোলা যাবে ✓'
                            : 'টার্নওভার প্রয়োজন'}
                        </div>
                        {bonus.expiresAt && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(bonus.expiresAt).toLocaleDateString('bn-BD')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-3 sm:p-4 rounded-lg shadow-lg ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : messageType === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              {messageType === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : messageType === 'error' ? (
                <span className="text-lg">⚠️</span>
              ) : (
                <span className="text-lg">ℹ️</span>
              )}
              <span className="break-words">{message}</span>
            </div>
          </div>
        )}

        {/* Bottom Note */}
        <div className="text-center pt-6 sm:pt-8 border-t border-gray-200">
          <div className="inline-flex items-center gap-1 sm:gap-2 text-gray-500 bg-gray-50 px-3 sm:px-4 py-2 rounded-full">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">
              বোনাস তুলতে টার্নওভার প্রয়োজনীয়তা সম্পূর্ণ করুন
            </span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* Daily Bonus Modal */}
      <DailyBonusModal
        isOpen={showDailyBonusModal}
        onClose={closeDailyBonusModal}
        onClaimBonus={claimDailyBonus}
        lang="bn"
        claimLoading={claimLoading}
        remainingAttempts={2 - redCardUsedToday}
        maxAmount={5.00}
      />
    </div>
  );
}