"use client";

import { useState } from "react";
import { Button } from "@/app/design/ui/button";
import { DepositModal } from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";

export default function WalletActions() {
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        <Button
          onClick={() => setOpenDeposit(true)}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          Deposit
        </Button>

        <Button
          variant="outline"
          onClick={() => setOpenWithdraw(true)}
          className="border-white/20 text-white"
        >
          Withdraw
        </Button>
      </div>

      <DepositModal
        open={openDeposit}
        onClose={() => setOpenDeposit(false)}
      />

      <WithdrawModal
        open={openWithdraw}
        onClose={() => setOpenWithdraw(false)}
      />
    </>
  );
}
