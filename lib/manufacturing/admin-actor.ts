import { cookies } from "next/headers";

export async function getManufacturingActorName(): Promise<string> {
  const jar = await cookies();
  const u = jar.get("admin_username")?.value?.trim();
  return u && u.length > 0 ? u : "Admin";
}
