"use client";

import { useState, useEffect, useRef } from "react";
import { X, RefreshCw, CheckCircle } from "lucide-react";

export default function DailyBonusModal({ 
  isOpen, 
  onClose, 
  onClaimBonus,
  lang,
  claimLoading,
  remainingAttempts = 2,
  maxAmount = 5.00
}) {
  const [envelopes, setEnvelopes] = useState([]);
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  const [spinResult, setSpinResult] = useState(null);
  const [isFalling, setIsFalling] = useState(false);
  const modalRef = useRef(null);

  // Create envelopes with proper taka distribution
  const createEnvelopes = () => {
    const newEnvelopes = [];
    const values = [];
    
    // 15 envelopes total
    for (let i = 0; i < 15; i++) {
      // 90% chance 0.50-2.00 TK, 10% chance 2.10-5.00 TK
      let amount;
      const random = Math.random() * 100;
      
      if (random < 90) {
        amount = Number((Math.floor(Math.random() * 16) * 0.10 + 0.50).toFixed(2));
      } else {
        amount = Number((Math.floor(Math.random() * 30) * 0.10 + 2.10).toFixed(2));
      }
      
      values.push(amount);
    }
    
    // Shuffle values
    values.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 15; i++) {
      newEnvelopes.push({
        id: i,
        value: values[i],
        left: Math.random() * 90,
        speed: 3 + Math.random() * 2,
        delay: Math.random() * 2,
        clicked: false,
        falling: true
      });
    }
    
    setEnvelopes(newEnvelopes);
    setSelectedEnvelope(null);
    setSpinResult(null);
    setIsFalling(true);
  };

  useEffect(() => {
    if (isOpen) {
      createEnvelopes();
    } else {
      setEnvelopes([]);
      setSelectedEnvelope(null);
      setSpinResult(null);
      setIsFalling(false);
    }
  }, [isOpen]);

  const handleEnvelopeClick = (envelopeId) => {
    if (selectedEnvelope !== null || !isFalling) return;
    
    const selectedEnvelopeData = envelopes.find(e => e.id === envelopeId);
    if (!selectedEnvelopeData) return;
    
    setSelectedEnvelope(envelopeId);
    setIsFalling(false);
    
    const updatedEnvelopes = envelopes.map(env => ({
      ...env,
      clicked: env.id === envelopeId,
      falling: false
    }));
    setEnvelopes(updatedEnvelopes);
    
    setTimeout(() => {
      setSpinResult({
        amount: selectedEnvelopeData.value,
        message: `🎉 ${selectedEnvelopeData.value}৳ জিতেছেন!`
      });
    }, 1000);
  };

  const handleClaim = () => {
    if (spinResult && onClaimBonus) {
      onClaimBonus(spinResult.amount);
    }
  };

  const handleClose = () => {
    setEnvelopes([]);
    setSelectedEnvelope(null);
    setSpinResult(null);
    setIsFalling(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/95" onClick={handleClose} />
      
      {/* Falling envelopes - 🧧 RED ENVELOPE */}
      {envelopes.map((envelope) => (
        <div
          key={envelope.id}
          className={`absolute cursor-pointer z-40 transition-all duration-300 ${
            envelope.falling ? 'animate-fall' : envelope.clicked ? 'animate-bounce' : 'opacity-0'
          }`}
          style={{
            left: `${envelope.left}%`,
            top: '-100px',
            animationDuration: `${envelope.speed}s`,
            animationDelay: `${envelope.delay}s`,
            animationFillMode: envelope.falling ? 'forwards' : 'none',
          }}
          onClick={() => handleEnvelopeClick(envelope.id)}
        >
          <div className={`text-7xl transition-transform duration-300 ${
            envelope.clicked ? 'scale-150' : 'hover:scale-110'
          }`}>
            {envelope.clicked ? (
              <div className="relative">
                <span className="text-7xl">🧧</span>
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-pink-600 px-3 py-1.5 rounded-lg shadow-xl min-w-[80px] border-2 border-white">
                  <span className="text-base font-bold text-white">{envelope.value}৳</span>
                </div>
              </div>
            ) : (
              <span className="text-7xl filter drop-shadow-lg">🧧</span>
            )}
          </div>
        </div>
      ))}
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative z-50 bg-gradient-to-br from-white to-pink-50 rounded-2xl p-6 mx-4 max-w-sm w-full border-2 border-pink-200 shadow-2xl"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-pink-100 rounded-full transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        {isFalling ? (
          <div className="text-center py-4">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                ডেইলি রেড কার্ড
              </h3>
              <div className="flex justify-center items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">
                  {remainingAttempts}/২ বাকি
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-center gap-2 text-red-600 text-lg font-bold">
                <span className="text-3xl">🧧</span>
                খাম ক্লিক করুন
              </div>
            </div>
          </div>
        ) : spinResult ? (
          <div className="text-center py-4">
            <div className="w-28 h-28 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-5xl">🧧</span>
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {spinResult.amount}৳
            </h3>
            <p className="text-lg text-pink-600 mb-2">
              অভিনন্দন!
            </p>
            <p className="text-xs text-green-600 font-bold mb-4 bg-green-50 px-3 py-1.5 rounded-full inline-block border border-green-200">
              কোন টার্নওভার নেই
            </p>
            
            <button
              onClick={handleClaim}
              disabled={claimLoading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-red-500/30"
            >
              {claimLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  নিচ্ছেন...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {spinResult.amount}৳ বোনাস নিন
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-7xl mb-4 animate-bounce">🧧</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              খাম ক্লিক করুন
            </h3>
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all text-sm"
            >
              বন্ধ করুন
            </button>
          </div>
        )}
        
        {isFalling && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">আজ বাকি:</span>
              <span className="text-lg font-bold text-red-600">{remainingAttempts}/২</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${(remainingAttempts/2)*100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 200px)) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) translateX(-50%);
          }
          50% {
            transform: translateY(-30px) translateX(-50%);
          }
        }
        .animate-bounce {
          animation: bounce 0.6s ease infinite;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
  );
}