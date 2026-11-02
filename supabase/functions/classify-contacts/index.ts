// Edge Function: AI-раскладка контактов пользователя по разделам.
// Phone numbers are never sent to the model — only name and role (job/company).
//
// POST { action: "plan" }
//   Reads the whole book, asks Claude which personal groups this owner needs
//   (on top of the system ones), creates them. Returns { categories }.
// POST { action: "classify", ids: string[] }   (up to 150 ids)
//   Puts each contact into a section. Skips contacts the user sorted by hand.
//   Returns { done, sorted }.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ANTHROPIC_SORT_MODEL") ?? "claude-sonnet-5-5";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const PALETTE = ["#3CC9A0", "#6E7BFF", "#4AB4F0", "#FF8A3D", "#E85BC4", "#A57CFF", "#FFB547", "#FF7A59"];

const RULES = `Как понимать записи:
- Записи на армянском, русском, английском и в транслите. Владелец — армянин из Еревана, учитывай армянские привычки.
- «Семья» — только явное родство владельцу, отдельным словом: Mama, Papa, Папа, Мама, Papik, Tatik (бабушка/дедушка), Exbayr/Axper как «брат», Qur (сестра), Kuyrik, Qavor/Кавор (крёстный), Knqahayr, Knqamayr, Zokanch, Sves, Барекам/Barekam/բարեկամ (= РОДСТВЕННИК, это семья, а не друг).
- ВАЖНО: «Qeri», «Hopar», «Дядя», «Dzyadz», «Тётя», «Mor», «Akhper/Ахпер», «Jan» в Армении часто говорят из уважения чужим людям («дядя Армен», «Ашот ахпер»). Это НЕ доказательство родства. Без других подсказок → "unsorted".
- Подстроки не считаются родством: «Papaya», «Mamikonyan» — не семья.
- Если в записи непонятное слово (Ktor, Krug, @nker и т. п.) и ты не уверен — "unsorted". Не угадывай.
- Слово после имени часто компания или бренд: «Gor Papaya» = Гор из компании Papaya.
- «taxi», «такси», «Yandex», «GG» → такси/транспорт. Hotel, отель → путешествия.
- «varpet», «мастер», «сантехник», «электрик», «двери», «окна» → ремонт.
- Dr., бжишк (բժիշկ), стоматолог, клиника → медицина.
- Люди с названием компании владельца — его команда.
- Просто имя без подсказок → "unsorted". Лучше честно не знать, чем ошибиться.`;

type Cat = { key: string; name: string; color: string | null; is_system: boolean; position: number };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { data: me } = await sb.from("profiles").select("full_name, role, brands(name)").eq("id", user.id).single();
  const owner = [me?.full_name, me?.role, ...(me?.brands ?? []).map((b: any) => b.name)].filter(Boolean).join(", ");
  const { data: cats0 } = await sb.from("categories").select("key, name, color, is_system, position").order("position");
  let cats = (cats0 ?? []) as Cat[];

  try {
    if (body.action === "plan") {
      const all = await allContacts(sb, "display_name, role");
      const lines = all.map((c: any) => [c.display_name, c.role].filter(Boolean).join(" — ")).join("\n");
      const out = await claude(
        `Ты помогаешь бизнесмену (${owner}) разложить его записную книжку по разделам.
Уже есть разделы: ${cats.map((c) => `${c.key}=${c.name}`).join(", ")}.
${RULES}
Посмотри на ВСЮ книжку и реши, каких личных разделов не хватает именно этому человеку (например «Такси», «Клиенты», «Команда <его компания>», «Госорганы», «Поставщики», «Спорт»).
Предлагай раздел, только если в него попадёт хотя бы 8 человек и он не дублирует существующие. Максимум 6.
Верни ТОЛЬКО JSON: {"add":[{"key":"латиница_snake","name":"Название по-русски"}]}`,
        `Книжка (${all.length} записей):\n${lines}`,
        1500,
      );
      const add = ((out?.add ?? []) as { key: string; name: string }[])
        .map((a) => ({ key: String(a.key).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30), name: String(a.name).slice(0, 40) }))
        .filter((a) => a.key && a.name && a.key !== "unsorted" && !cats.some((c) => c.key === a.key || c.name.toLowerCase() === a.name.toLowerCase()))
        .slice(0, 6);
      if (add.length) {
        const start = cats.length;
        await sb.from("categories").insert(add.map((a, i) => ({
          owner_id: user.id, key: a.key, name: a.name, color: PALETTE[(start + i) % PALETTE.length], position: start + i, is_system: false,
        })));
        const { data } = await sb.from("categories").select("key, name, color, is_system, position").order("position");
        cats = (data ?? []) as Cat[];
      }
      return Response.json({ categories: cats, added: add.map((a) => a.name) });
    }

    if (body.action === "classify") {
      const ids: string[] = (body.ids ?? []).slice(0, 150);
      if (!ids.length) return Response.json({ done: 0, sorted: 0 });
      const { data: rows } = await sb.from("contacts").select("id, display_name, role, note, category_locked").in("id", ids);
      const todo = (rows ?? []).filter((r: any) => !r.category_locked);
      if (!todo.length) return Response.json({ done: 0, sorted: 0 });
      const list = todo.map((r: any, i: number) => `${i}\t${r.display_name}${r.role ? ` — ${r.role}` : ""}${r.note ? ` (заметка: ${r.note})` : ""}`).join("\n");
      const keys = new Set(cats.map((c) => c.key));
      // The owner's own manual choices teach the model his personal vocabulary.
      const { data: taught } = await sb.from("contacts").select("display_name, role, category_key").eq("category_locked", true).limit(80);
      const lessons = (taught ?? []).map((t: any) => `${t.display_name}${t.role ? ` — ${t.role}` : ""} → ${t.category_key}`).join("\n");
      const out = await claude(
        `Ты раскладываешь записную книжку бизнесмена (${owner}) по разделам.
Разделы (key=название): ${cats.map((c) => `${c.key}=${c.name}`).join(", ")}, unsorted=Без раздела.
${RULES}
${lessons ? `\nВладелец сам разложил эти контакты. Это его личный словарь — для похожих записей следуй ЕГО логике, она важнее общих правил:\n${lessons}\n` : ""}
Подумай над каждой записью: кто это скорее всего такой для владельца книжки.
Верни ответ через инструмент save: для КАЖДОЙ строки объект {i: номер строки, k: "key"}.`,
        list,
        6000,
        SAVE_TOOL,
      );
      const byKey = new Map<string, string[]>();
      for (const item of (out?.r ?? []) as { i: number; k: string }[]) {
        const row = todo[Number(item?.i)];
        if (!row) continue;
        const k = keys.has(item.k) ? item.k : "unsorted";
        byKey.set(k, [...(byKey.get(k) ?? []), row.id]);
      }
      // Rows the model skipped are marked as processed too, as "unsorted".
      const answered = new Set([...byKey.values()].flat());
      const missed = todo.filter((r: any) => !answered.has(r.id)).map((r: any) => r.id);
      if (missed.length) byKey.set("unsorted", [...(byKey.get("unsorted") ?? []), ...missed]);
      const now = new Date().toISOString();
      let sorted = 0;
      for (const [k, list] of byKey) {
        await sb.from("contacts").update({ category_key: k, ai_sorted_at: now }).in("id", list).eq("category_locked", false);
        if (k !== "unsorted") sorted += list.length;
      }
      return Response.json({ done: todo.length, sorted });
    }

    return new Response("Unknown action", { status: 400 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
});

async function allContacts(sb: any, cols: string) {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("contacts").select(cols).eq("archived", false).range(from, from + 999);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

const SAVE_TOOL = {
  name: "save",
  description: "Save the section for every contact line.",
  input_schema: {
    type: "object",
    properties: { r: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, k: { type: "string" } }, required: ["i", "k"] } } },
    required: ["r"],
  },
};

async function claude(system: string, user: string, maxTokens: number, tool?: typeof SAVE_TOOL) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }],
      ...(tool ? { tools: [tool], tool_choice: { type: "tool", name: tool.name } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  if (tool) return j.content?.find((b: any) => b.type === "tool_use")?.input ?? null;
  const text: string = j.content?.find((b: any) => b.type === "text")?.text ?? "";
  try { return JSON.parse(text); } catch { /* fallthrough */ }
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}
