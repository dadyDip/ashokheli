import SubAgentGuard from "@/components/SubAgentGuard";

export default function SubAgentDashboardLayout({ children }) {
  return <SubAgentGuard>{children}</SubAgentGuard>;
}