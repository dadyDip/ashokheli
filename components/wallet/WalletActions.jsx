"use client";

import { useState } from "react";
import { Button } from "@/app/design/ui/button";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";

export default function WalletActions() {
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        <Button onClick={() => setOpenDeposit(true)}>Deposit</Button>
        <Button variant="outline" onClick={() => setOpenWithdraw(true)}>
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
