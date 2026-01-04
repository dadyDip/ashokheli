import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/admin/deposits"
          className="rounded-xl bg-gray-900 p-6 border border-emerald-500/30 hover:bg-gray-800 transition"
        >
          <h2 className="text-xl font-semibold">💰 Deposit Requests</h2>
          <p className="text-sm text-gray-400">Review & approve deposits</p>
        </Link>

        <Link
          href="/admin/withdrawals"
          className="rounded-xl bg-gray-900 p-6 border border-red-500/30 hover:bg-gray-800 transition"
        >
          <h2 className="text-xl font-semibold">🏦 Withdrawal Requests</h2>
          <p className="text-sm text-gray-400">Review & process withdrawals</p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-xl bg-gray-900 p-6 border border-blue-500/30 hover:bg-gray-800 transition"
        >
          <h2 className="text-xl font-semibold">👥 Manage Users</h2>
          <p className="text-sm text-gray-400">View & manage all players</p>
        </Link>

        <Link
          href="/admin/blog"
          className="rounded-xl bg-gray-900 p-6 border border-emerald-500/30
          hover:bg-gray-800 transition"
        >
          <h2 className="text-xl font-semibold">📝 Manage Blog</h2>
          <p className="text-sm text-gray-400">
            Create, edit & publish blog posts
          </p>
        </Link>

      </div>
    </div>
  );
}
