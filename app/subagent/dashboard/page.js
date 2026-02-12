"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function SubAgentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [availableCommission, setAvailableCommission] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Cooldown states
  const [isClaimCooldown, setIsClaimCooldown] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [cooldownHours, setCooldownHours] = useState(0);
  const [cooldownPercentage, setCooldownPercentage] = useState(0);
  const [claiming, setClaiming] = useState(false);

  // Helper function to convert paisa to taka
  const paisaToTaka = (paisa) => {
    return paisa ? (paisa / 100).toFixed(2) : "0.00";
  };

  // Helper function to format taka with commas
  const formatTaka = (taka) => {
    return parseFloat(taka).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Combine both functions for display
  const displayPaisaAsTaka = (paisa) => {
    return formatTaka(paisaToTaka(paisa));
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  useEffect(() => {
    if (!loading && user) {
      if (user.role !== "sub-agent") {
        router.replace("/");
        return;
      }
      fetchDashboardData();
    }
  }, [user, loading, router]);

  // Calculate cooldown timer
  useEffect(() => {
    if (lastClaimDate) {
      const lastClaim = new Date(lastClaimDate);
      const now = new Date();
      const daysSinceLastClaim = Math.floor((now - lastClaim) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastClaim < 7) {
        setIsClaimCooldown(true);
        setCooldownDays(7 - daysSinceLastClaim);
        
        // Calculate hours remaining
        const hoursSinceLastClaim = Math.floor((now - lastClaim) / (1000 * 60 * 60));
        const totalHoursInWeek = 7 * 24;
        const hoursRemaining = totalHoursInWeek - hoursSinceLastClaim;
        setCooldownHours(hoursRemaining % 24);
        
        // Calculate percentage for progress bar
        const percentage = (hoursSinceLastClaim / totalHoursInWeek) * 100;
        setCooldownPercentage(Math.min(100, percentage));
      } else {
        setIsClaimCooldown(false);
      }
    }
  }, [lastClaimDate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const [refRes, comRes] = await Promise.all([
        fetch(`/api/subagent/referrals`, { headers }),
        fetch(`/api/subagent/commissions`, { headers })
      ]);

      const refData = await refRes.json();
      const comData = await comRes.json();

      if (refData.success) {
        setReferrals(refData.referrals || []);
      } else {
        showMessage(refData.error || "Failed to load referrals", "error");
      }

      if (comData.success) {
        setCommissions(comData.commissions || []);
        // Convert paisa to taka for display
        setTotalCommission(paisaToTaka(comData.totalCommission || 0));
        setAvailableCommission(paisaToTaka(comData.availableCommission || 0));
        setLastClaimDate(comData.lastClaimDate || null);
      } else {
        showMessage(comData.error || "Failed to load commissions", "error");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showMessage("Failed to load dashboard data", "error");
    } finally {
      setDashboardLoading(false);
    }
  };

  const claimCommission = async () => {
    if (availableCommission <= 0) {
        showMessage("No commission available to claim", "error");
        return;
  }

    if (isClaimCooldown) {
        showMessage(`You can claim again in ${cooldownDays} days, ${cooldownHours} hours`, "error");
        return;
    }

    setClaiming(true);

    try {
        // Convert taka to paisa (multiply by 100)
        const amountInPaisa = Math.round(parseFloat(availableCommission) * 100);
        
        console.log("Claiming:", {
        displayAmount: availableCommission,
        apiAmount: amountInPaisa
        });
        
        const res = await fetch("/api/subagent/claim", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({ amount: amountInPaisa }),
        });

        const data = await res.json();
        console.log("Claim response:", data);
        
        if (data.success) {
        showMessage(`Successfully claimed ${formatTaka(availableCommission)} TK commission!`);
        
        // Immediately update the UI state
        setAvailableCommission(0); // Set to 0 since we just claimed everything
        setLastClaimDate(new Date().toISOString()); // Update last claim date to now
        
        // Refresh the data to get updated commissions list
        setTimeout(() => {
            fetchDashboardData();
        }, 1000);
        
        } else {
        showMessage(data.error || "Failed to claim commission", "error");
        }
    } catch (error) {
        console.error("Error claiming commission:", error);
        showMessage("Something went wrong", "error");
    } finally {
        setClaiming(false);
    }
    };

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg ${message.type === "error" ? "bg-red-500/20 border border-red-500/30" : message.type === "info" ? "bg-blue-500/20 border border-blue-500/30" : "bg-green-500/20 border border-green-500/30"}`}>
              <p className={message.type === "error" ? "text-red-700" : message.type === "info" ? "text-blue-700" : "text-green-700"}>
                {message.text}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.firstName || "Sub-Agent"}!
              </h1>
              <p className="text-gray-600 mt-1">Sub-Agent Dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Promo Code:</p>
              <p className="text-xl font-bold text-orange-600">
                {user?.promoCode || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-3xl font-bold mt-2">{referrals.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-7.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-3xl font-bold mt-2">{formatTaka(totalCommission)} TK</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available to Claim</p>
                <p className="text-3xl font-bold mt-2">{formatTaka(availableCommission)} TK</p>
              </div>
              <button
                onClick={claimCommission}
                disabled={availableCommission <= 0 || isClaimCooldown || claiming}
                className={`${availableCommission > 0 && !isClaimCooldown && !claiming ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'} text-white font-semibold px-6 py-3 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {claiming ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Claiming...
                  </span>
                ) : isClaimCooldown ? (
                  `Wait ${cooldownDays}d`
                ) : (
                  'Claim Now'
                )}
              </button>
            </div>
            
            {lastClaimDate && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">
                  Last claimed: {new Date(lastClaimDate).toLocaleDateString('en-BD', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                
                {isClaimCooldown && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-yellow-700 font-medium">
                        ⏰ Next claim in: {cooldownDays}d {cooldownHours}h
                      </p>
                      <span className="text-xs font-bold text-yellow-700">
                        {cooldownPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${cooldownPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Your Referrals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Total Deposited</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Your Commission</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length > 0 ? referrals.map((referral) => (
                  <tr key={referral.id} className="border-b hover:bg-orange-50/50">
                    <td className="py-4 px-6">
                      {referral.firstName} {referral.lastName}
                    </td>
                    <td className="py-4 px-6">{referral.phone || "N/A"}</td>
                    <td className="py-4 px-6">{displayPaisaAsTaka(referral.totalDeposited || 0)} TK</td>
                    <td className="py-4 px-6 font-semibold text-orange-600">
                      {displayPaisaAsTaka(Math.floor((referral.totalDeposited || 0) * 0.09))} TK
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(referral.createdAt).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No referrals yet. Share your promo code to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commission History */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Commission History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Referral</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Deposit Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Commission (9%)</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length > 0 ? commissions.map((commission) => (
                  <tr key={commission.id} className="border-b hover:bg-orange-50/50">
                    <td className="py-4 px-6">
                      {new Date(commission.createdAt).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      {commission.referralName}
                    </td>
                    <td className="py-4 px-6">{displayPaisaAsTaka(commission.depositAmount)} TK</td>
                    <td className="py-4 px-6 font-semibold text-orange-600">
                      {displayPaisaAsTaka(commission.commissionAmount)} TK
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${commission.status === 'claimed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {commission.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No commission history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Share Your Promo Code</h2>
          <p className="mb-6">Share this code with others to earn 9% commission on their deposits!</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm mb-1">Your Promo Code:</p>
              <p className="text-2xl font-bold tracking-wider">{user?.promoCode || "N/A"}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user?.promoCode || "");
                showMessage("Promo code copied to clipboard!");
              }}
              className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition shadow-md"
            >
              Copy Code
            </button>
          </div>
          
          {/* Commission Rules */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <h3 className="font-semibold mb-2">📋 Commission Rules:</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Earn 9% commission on every deposit made by your referrals</li>
              <li>• Commissions are calculated in real-time</li>
              <li>• You can claim accumulated commissions once every 7 days</li>
              <li>• Minimum claim amount: 1 TK</li>
              <li>• Commission is credited directly to your main balance</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}