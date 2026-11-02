// Contact sections (spec: docs/01-product/features/contacts-book.md)
export const SECTIONS: { key: string; name: string; color: string }[] = [
  { key: "family", name: "Семья", color: "#3CC9A0" },
  { key: "work", name: "Работа", color: "#6E7BFF" },
  { key: "friends", name: "Друзья", color: "#4AB4F0" },
  { key: "repair", name: "Ремонт", color: "#FF8A3D" },
  { key: "med", name: "Медицина", color: "#E85BC4" },
  { key: "finance", name: "Финансы и право", color: "#A57CFF" },
  { key: "travel", name: "Путешествия", color: "#4AB4F0" },
  { key: "home", name: "Дом и быт", color: "#3CC9A0" },
  { key: "auto", name: "Авто", color: "#FF8A3D" },
  { key: "food", name: "Рестораны", color: "#A57CFF" },
  { key: "edu", name: "Образование", color: "#6E7BFF" },
  { key: "beauty", name: "Красота", color: "#E85BC4" },
  { key: "unsorted", name: "Не разобрано", color: "#8E8E93" },
];
export const sectionOf = (k: string) => SECTIONS.find((s) => s.key === k) ?? SECTIONS[SECTIONS.length - 1];

const RULES: [string, RegExp][] = [
  ["family", /(мама|папа|брат|сестр|бабушк|дедушк|дядя|тётя|тетя|mom|dad|mama|papa|մամա|պապա)/i],
  ["med", /(dr\.?\s|доктор|врач|стоматолог|клиник|педиатр|аптек|массаж|dental)/i],
  ["finance", /(бухгалт|налог|юрист|адвокат|нотар|банк|страхов|lawyer|accountant)/i],
  ["travel", /(taxi|такси|hotel|отел|гид|тур|трансфер|авиа)/i],
  ["auto", /(авто|сто\b|шиномонтаж|мойка|car)/i],
  ["repair", /(сантехник|электрик|мастер|ремонт|строит|плитк|кондиц|окна|мебел|маляр|двер)/i],
  ["home", /(курьер|достав|няня|уборк|клининг|химчист|ветеринар)/i],
  ["food", /(ресторан|кафе|кофе|пицц|доставка еды)/i],
  ["beauty", /(салон|барбер|маникюр|парикмах|косметолог)/i],
  ["work", /(ceo|founder|директор|основател|менеджер|бизнес|клиент|agency|агентств|маркетолог|smm|дизайнер|разработ|инвест)/i],
];
export const TEMP_RE = /(taxi|такси|курьер|трансфер)/i;

export function classify(text: string): string {
  const hit = RULES.find(([, re]) => re.test(text));
  return hit ? hit[0] : "unsorted";
}

/** Order: Семья, Работа, Друзья, Ремонт first, then by count; "unsorted" last. */
export function orderedSections(counts: Record<string, number>) {
  const prio = ["family", "work", "friends", "repair"];
  return SECTIONS.filter((s) => (counts[s.key] ?? 0) > 0).sort((a, b) => {
    if (a.key === "unsorted") return 1;
    if (b.key === "unsorted") return -1;
    const ra = prio.indexOf(a.key), rb = prio.indexOf(b.key);
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || (counts[b.key] ?? 0) - (counts[a.key] ?? 0);
  });
}
