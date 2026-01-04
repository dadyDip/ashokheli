import WithdrawTable from "@/components/admin/WithdrawTable";

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
      <WithdrawTable />
    </div>
  );
}
