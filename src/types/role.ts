import type { Permission } from "@/config/permissions";

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

export type RolePayload = Omit<Role, "id" | "userCount">;

export interface RoleListResponse {
  data: Role[];
  total: number;
}

export interface RoleDetailResponse {
  data: Role;
}
