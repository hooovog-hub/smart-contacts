import { groupAZ, orderSections } from "../sections";
const c = (displayName: string, categoryKey: string) => ({ id: displayName, displayName, categoryKey, source: "manual" as const, isTemporary: false });

test("порядок разделов: Семья, Работа, Друзья, Ремонт", () => {
  const list = [c("А", "repair"), c("Б", "work"), c("В", "family"), c("Г", "friends"), c("Д", "med"), c("Е", "med")];
  expect(orderSections(list).slice(0, 4)).toEqual(["family", "work", "friends", "repair"]);
});

test("А–Я группирует по первой букве", () => {
  const g = groupAZ([c("Карен", "repair"), c("Ашот", "repair"), c("Арам", "family")]);
  expect([...g.keys()]).toEqual(["А", "К"]);
});
