import { redirect } from "next/navigation";
import { resolveRestaurant } from "@/lib/resolve-restaurant";

export const dynamic = "force-dynamic";

export default async function GenericMenuRedirect({ searchParams }) {
  const restaurant = await resolveRestaurant("default");
  const targetId = restaurant?.id || "sapphire";

  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  redirect(`/r/${targetId}/menu${query}`);
}
