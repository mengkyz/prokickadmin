export type PortalRole = "admin" | "view_only";

export const ALL_VIEWONLY_PAGES = ["dashboard", "classes", "users", "packages", "payments"] as const;
export type ViewOnlyPage = (typeof ALL_VIEWONLY_PAGES)[number];

export interface PortalUser {
  id: string;
  email: string;
  display_name: string | null;
  role: PortalRole;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
  last_login_at: string | null;
  allowed_pages: string[];
}
