import { describe, expect, it, vi } from "vitest";
import { handleFromQr } from "./qr";

vi.mock("./config", () => ({ SITE_URL: "https://becontact.app" }));

describe("handleFromQr", () => {
  it("reads a handle from the current address", () => {
    expect(handleFromQr("https://becontact.app/Hovhannes")).toBe("hovhannes");
    expect(handleFromQr(" https://www.becontact.app/ani.flowers/ ")).toBe("ani.flowers");
    expect(handleFromQr("HTTPS://BECONTACT.APP/X_Y")).toBe("x_y");
    expect(handleFromQr("http://becontact.app/hovhannes")).toBe("hovhannes");
  });

  it("still reads old QRs and Wallet cards", () => {
    expect(handleFromQr("https://smart-contacts.vercel.app/hovhannes")).toBe("hovhannes");
    expect(handleFromQr("https://www.smart-contacts.vercel.app/hovhannes")).toBe("hovhannes");
  });

  it("ignores other sites and non-profile paths", () => {
    expect(handleFromQr("https://evil.example/hovhannes")).toBeNull();
    expect(handleFromQr("https://becontact.app.evil.example/hovhannes")).toBeNull();
    expect(handleFromQr("https://becontact.app@evil.example/hovhannes")).toBeNull();
    expect(handleFromQr("https://becontact.app/hovhannes?utm=1")).toBeNull();
    expect(handleFromQr("https://becontact.app/r/ab12cd34")).toBeNull();
    expect(handleFromQr("https://becontact.app/i/ab12cd34")).toBeNull();
    expect(handleFromQr("https://becontact.app/ab")).toBeNull();
    expect(handleFromQr("hello")).toBeNull();
  });
});
