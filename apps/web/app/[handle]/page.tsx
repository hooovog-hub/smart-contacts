import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase";

// Публичный профиль. Спецификация: docs/01-product/features/profile.md
export const revalidate = 60;

export default async function ProfilePage({ params }: { params: { handle: string } }) {
  const sb = supabasePublic();
  const { data: p } = await sb
    .from("profiles")
    .select("id, full_name, role, bio, city, plan, avatar_url, brands(name, sphere, links), memberships(org_name, status_title, verified)")
    .eq("handle", params.handle)
    .single();
  if (!p) notFound();
  const paid = p.plan !== "free";
  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>{p.full_name}</h1>
      <p style={{ color: "#8E8E93", marginTop: 0 }}>{p.role}</p>
      {paid && p.bio && <p>{p.bio}</p>}
      {paid && (p.brands ?? []).map((b: any) => <div key={b.name} style={{ background: "#161618", borderRadius: 18, padding: 14, marginBottom: 8 }}><b>{b.name}</b><div style={{ color: "#8E8E93" }}>{b.sphere}</div></div>)}
      <a href={`/${params.handle}/vcard`} style={{ display: "block", textAlign: "center", padding: 14, borderRadius: 999, background: "linear-gradient(100deg,#FFB547,#FF7A59,#E85BC4)", color: "#1a0d00", fontWeight: 600, textDecoration: "none", marginTop: 16 }}>Сохранить контакт</a>
      {/* TODO(web-engineer): «Открыть в приложении» (universal link), «Создать свой профиль», Open Graph превью */}
    </main>
  );
}
