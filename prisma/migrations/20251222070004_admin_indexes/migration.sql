-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_idx" ON "WithdrawRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_createdAt_idx" ON "WithdrawRequest"("createdAt");
