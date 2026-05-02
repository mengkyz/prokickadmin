export type PortalRole = "admin" | "coach";

export interface PortalUser {
  id: string;
  email: string;
  display_name: string | null;
  role: PortalRole;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
  last_login_at: string | null;
}
