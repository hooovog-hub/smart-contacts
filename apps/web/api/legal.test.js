import { describe, expect, it } from "vitest";
import { render } from "../../../scripts/build-legal.mjs";

describe("legal markdown renderer", () => {
  it("renders headings with anchors, lists, links and tables", () => {
    const html = render(
      "# Политика\n\nТекст **важно** и [почта](mailto:a@b.c).\n\n- один\n- два\n\n| Данные | Зачем |\n|---|---|\n| Имя | Профиль |",
    );
    expect(html).toContain('<h1 id="политика">Политика</h1>');
    expect(html).toContain("<b>важно</b>");
    expect(html).toContain('<a href="mailto:a@b.c">почта</a>');
    expect(html).toContain("<ul><li>один</li><li>два</li></ul>");
    expect(html).toContain("<td>Имя</td>");
  });

  it("escapes HTML and ignores unsafe link schemes", () => {
    const html = render("<script>x</script> [a](javascript:alert(1))");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
  });
});
