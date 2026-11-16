import { describe, expect, it } from "vitest";
import { birthdayMessage, upcomingBirthdays, whatsappUrl, whenLabel } from "./today.logic";

const c = (id: string, birthday: string | null) => ({ id, display_name: id, birthday });

describe("upcomingBirthdays", () => {
  it("finds today and the next 7 days, soonest first, with age when the year is known", () => {
    const out = upcomingBirthdays(
      [c("later", "1990-11-20"), c("today", "1985-11-17"), c("noyear", "1604-11-18"), c("far", "1990-12-30")],
      "2026-11-17",
    );
    expect(out.map((x) => x.contact.id)).toEqual(["today", "noyear", "later"]);
    expect(out[0]).toMatchObject({ inDays: 0, age: 41 });
    expect(out[1].age).toBeNull();
  });

  it("wraps around the new year", () => {
    const out = upcomingBirthdays([c("jan", "1990-01-02")], "2026-12-30");
    expect(out[0].inDays).toBe(3);
    expect(out[0].age).toBe(37);
  });

  it("handles Feb 29 in non-leap years and ignores empty dates", () => {
    expect(upcomingBirthdays([c("leap", "2000-02-29"), c("none", null)], "2027-02-28")[0].inDays).toBe(0);
  });
});

describe("helpers", () => {
  it("builds a WhatsApp link only for real numbers", () => {
    expect(whatsappUrl("+374 95 944 844", "Привет")).toBe(
      "https://wa.me/37495944844?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82",
    );
    expect(whatsappUrl("123", "x")).toBeNull();
  });
  it("greets by first name", () => {
    expect(birthdayMessage("Арман Петросян")).toMatch(/^Арман, с днём рождения/);
  });
  it("labels days in Russian", () => {
    expect([0, 1, 2, 5, 21].map(whenLabel)).toEqual([
      "Сегодня",
      "Завтра",
      "Через 2 дня",
      "Через 5 дней",
      "Через 21 день",
    ]);
  });
});
