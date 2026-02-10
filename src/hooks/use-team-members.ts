import useSWR from "swr";

export interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "invited";
  created_at: string;
  invitation_id?: string;
}

interface ApiMember {
  id: string;
  memberId: string;
  email: string;
  name: string;
  status: "active";
  createdAt: string;
}

interface ApiInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  status: "pending";
  expiresAt: string;
  createdAt: string;
}

interface TeamMembersResponse {
  members: ApiMember[];
  invitations: ApiInvitation[];
}

function transformMembers(data: TeamMembersResponse): TeamMember[] {
  const activeMembers: TeamMember[] = (data.members || []).map((m) => {
    const nameParts = m.name.split(" ");
    return {
      id: m.id,
      email: m.email,
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      status: "active" as const,
      created_at: m.createdAt,
    };
  });

  const invitedMembers: TeamMember[] = (data.invitations || []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    first_name: inv.firstName || "",
    last_name: inv.lastName || "",
    status: "invited" as const,
    created_at: inv.createdAt,
    invitation_id: inv.id,
  }));

  return [...activeMembers, ...invitedMembers];
}

export function useTeamMembers() {
  const { data, error, isLoading, mutate } = useSWR<TeamMembersResponse>(
    "/api/team/members",
    {
      // Don't throw on 403 - we handle it specially
      shouldRetryOnError: (err) => err?.status !== 403,
    }
  );

  // Check if 403 (not owner)
  const isNotOwner = error?.status === 403;

  const members = data ? transformMembers(data) : [];

  const deleteMember = async (member: TeamMember): Promise<boolean> => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        if (member.status === "invited") {
          return {
            ...current,
            invitations: current.invitations.filter((i) => i.id !== member.id),
          };
        } else {
          return {
            ...current,
            members: current.members.filter((m) => m.id !== member.id),
          };
        }
      },
      { revalidate: false }
    );

    try {
      const body =
        member.status === "invited"
          ? { invitationId: member.invitation_id }
          : { memberId: member.id };

      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        mutate();
        return false;
      }

      return true;
    } catch {
      mutate();
      return false;
    }
  };

  return {
    members,
    isLoading,
    isError: !!error && !isNotOwner,
    isNotOwner,
    refresh: mutate,
    deleteMember,
  };
}
