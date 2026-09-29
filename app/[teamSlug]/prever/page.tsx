import { redirect } from "next/navigation";

export default async function Old({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ jornada?: string }>;
}) {
  const [{ teamSlug }, { jornada }] = await Promise.all([params, searchParams]);
  redirect(`/${teamSlug}/jornada${jornada ? `?jornada=${encodeURIComponent(jornada)}` : ""}`);
}
