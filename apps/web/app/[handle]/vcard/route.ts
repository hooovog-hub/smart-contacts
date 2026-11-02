import { supabasePublic } from "@/lib/supabase";

export async function GET(_: Request, props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const { data: p } = await supabasePublic().from("profiles").select("full_name, role, phone, links").eq("handle", params.handle).single();
  if (!p) return new Response("Not found", { status: 404 });
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${params.handle}`;
  const vcf = ["BEGIN:VCARD", "VERSION:3.0", `FN:${p.full_name}`, p.role ? `TITLE:${p.role}` : "", p.phone ? `TEL;TYPE=CELL:${p.phone}` : "", `URL:${url}`, `NOTE:Профиль: ${url}`, "END:VCARD"].filter(Boolean).join("\r\n");
  return new Response(vcf, { headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${params.handle}.vcf"` } });
}
