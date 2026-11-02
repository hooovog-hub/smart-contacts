// Edge Function: раскладка импортированных контактов по разделам
// Вход: { contacts: [{ tmpId, name, company?, jobTitle? }] } (до 200)
// Выход: { results: [{ tmpId, category, isTemporary }] }
// TODO(ai-engineer): 1) правила по ключевым словам (быстро и бесплатно) 2) остаток — одним запросом в Claude (модель quick-класса)
Deno.serve(async (req) => {
  const { contacts } = await req.json();
  const rules: [string, RegExp][] = [
    ["med", /(dr\.?\s|доктор|врач|стоматолог|клиник|педиатр)/i],
    ["finance", /(бухгалт|налог|юрист|адвокат|нотар|банк)/i],
    ["travel", /(taxi|такси|hotel|отел|гид|трансфер)/i],
    ["repair", /(сантехник|электрик|мастер|ремонт|плитк|кондиц|окна)/i],
    ["family", /(мама|папа|брат|сестр|бабушк|дедушк|дядя|тётя|тетя)/i],
  ];
  const results = contacts.map((c: any) => {
    const text = [c.name, c.company, c.jobTitle].filter(Boolean).join(" ");
    const hit = rules.find(([, re]) => re.test(text));
    return { tmpId: c.tmpId, category: hit?.[0] ?? "unsorted", isTemporary: /(taxi|такси|курьер|трансфер)/i.test(text) };
  });
  return Response.json({ results });
});
