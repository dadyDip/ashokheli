// components/WithdrawWithBonusInfo.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function WithdrawWithBonusInfo({ user }) {
  const [withdrawableInfo, setWithdrawableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchWithdrawableInfo();
  }, [user]);
  
  const fetchWithdrawableInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/wallet/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWithdrawableInfo(response.data.bonusSummary);
    } catch (error) {
      console.error('Error fetching withdrawable info:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="withdraw-info-card">
      <h3>💰 Withdrawal Information</h3>
      
      {withdrawableInfo && (
        <div className="balance-breakdown">
          <div className="balance-item real">
            <span>Real Balance:</span>
            <strong>{user.balance} TK</strong>
            <small>Available for withdrawal</small>
          </div>
          
          <div className="balance-item bonus-withdrawable">
            <span>Bonus (Withdrawable):</span>
            <strong>{withdrawableInfo.withdrawableBonus || 0} TK</strong>
            <small>Turnover completed ✓</small>
          </div>
          
          <div className="balance-item bonus-locked">
            <span>Bonus (Locked):</span>
            <strong>{withdrawableInfo.nonWithdrawableBonus || 0} TK</strong>
            <small>
              {withdrawableInfo.remainingTurnover > 0 ? (
                <>
                  Play {withdrawableInfo.remainingTurnover} TK more to unlock
                </>
              ) : (
                'Complete turnover to withdraw'
              )}
            </small>
          </div>
          
          <div className="total-withdrawable">
            <span>Total Withdrawable:</span>
            <strong>{withdrawableInfo.withdrawableBalance} TK</strong>
          </div>
          
          {withdrawableInfo.hasLockedBonus && (
            <div className="turnover-progress">
              <div className="progress-label">
                <span>Turnover Progress:</span>
                <span>{withdrawableInfo.completionPercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${withdrawableInfo.completionPercentage}%` }}
                />
              </div>
              <div className="progress-details">
                <small>
                  Played: {withdrawableInfo.totalCompletedTurnover} / 
                  Required: {withdrawableInfo.totalRequiredTurnover} TK
                </small>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="withdraw-rules">
        <h4>📋 Withdrawal Rules:</h4>
        <ul>
          <li>✅ Real money can be withdrawn anytime</li>
          <li>✅ Bonus money requires 10x turnover</li>
          <li>✅ Minimum withdrawal: 200 TK</li>
          <li>⏱️ Pending withdrawals processed within 24 hours</li>
          <li>⚠️ Complete turnover before withdrawing bonus</li>
        </ul>
      </div>
    </div>
  );
}