// Team Management Page
// Client Component: View and manage team members (Enterprise tier)

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Team member from API
 */
interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-purple-500/10 text-purple-600",
  admin: "bg-blue-500/10 text-blue-600",
  member: "bg-emerald-500/10 text-emerald-600",
  viewer: "bg-slate-500/10 text-slate-600",
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeamPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/team");
      if (!response.ok) throw new Error("Failed to fetch team members");
      const result = await response.json();
      setMembers(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMembers();
    }
  }, [status, fetchMembers]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        setInviteError(data.error || "Failed to invite");
        return;
      }

      setInviteEmail("");
      setInviteRole("member");
      setShowInviteForm(false);
      fetchMembers();
    } catch {
      setInviteError("Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update role");
        return;
      }

      fetchMembers();
    } catch {
      alert("Failed to update role");
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.user.email} from the team?`)) return;

    try {
      const response = await fetch(`/api/team?userId=${encodeURIComponent(member.userId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to remove");
        return;
      }

      fetchMembers();
    } catch {
      alert("Failed to remove member");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">{t("nav.dashboard")}            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Team</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage team members for collaborative compliance
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm((s) => !s)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          </svg>
          {showInviteForm ? "Cancel" : "Invite Member"}
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <form
          onSubmit={handleInvite}
          className="mt-6 rounded-lg border border-border bg-background p-4"
        >
          <h3 className="text-sm font-semibold">Invite Team Member</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
                placeholder="colleague@company.com"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {inviteError && (
            <p className="mt-3 text-xs text-destructive">{inviteError}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isInviting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isInviting ? "Inviting..." : "Send Invite"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Members Table */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">
            Team Members {members.length > 0 && `(${members.length})`}
          </h3>
        </div>

        {members.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium">No team members yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Invite colleagues to collaborate on compliance tasks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name / Email</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{member.user.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{member.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {member.role === "owner" ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES.owner}`}>
                          Owner
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(member.joinedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {member.role !== "owner" && (
                        <button
                          onClick={() => handleRemove(member)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Explanation */}
      <div className="mt-6 rounded-md border border-border bg-muted/30 p-4">
        <h4 className="text-xs font-semibold text-foreground">Role Permissions</h4>
        <ul className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 inline-block h-2 w-2 rounded-full bg-purple-500`} />
            <span>
              <strong className="text-foreground">Owner</strong> — Full access to all settings, billing, and team management.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 inline-block h-2 w-2 rounded-full bg-blue-500`} />
            <span>
              <strong className="text-foreground">Admin</strong> — Can manage systems, documents, and invite members.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-500`} />
            <span>
              <strong className="text-foreground">Member</strong> — Can create and edit compliance content.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 inline-block h-2 w-2 rounded-full bg-slate-500`} />
            <span>
              <strong className="text-foreground">Viewer</strong> — Read-only access to reports and documentation.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
