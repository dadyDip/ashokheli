import DepositTable from "@/components/admin/DepositTable";

export default function AdminDepositsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deposit Requests</h1>
      <DepositTable />
    </div>
  );
}
