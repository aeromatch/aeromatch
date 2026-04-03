"""Scope infographic.css selectors under #am-infographic."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "src" / "styles" / "infographic.raw.css"
CSS_PATH = ROOT / "src" / "styles" / "infographic.css"


def scope_css(css: str) -> str:
    out: list[str] = []
    i = 0
    n = len(css)

    def skip_ws(j: int) -> int:
        while j < n and css[j] in " \n\t\r":
            j += 1
        return j

    while i < n:
        i = skip_ws(i)
        if i >= n:
            break
        if css.startswith("/*", i):
            end = css.find("*/", i)
            if end == -1:
                out.append(css[i:])
                break
            end += 2
            out.append(css[i:end])
            i = end
            continue
        if css.startswith("@keyframes", i) or css.startswith("@media", i):
            depth = 0
            j = i
            while j < n:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
                j += 1
            out.append(css[i:j])
            i = j
            continue
        j = css.find("{", i)
        if j == -1:
            out.append(css[i:])
            break
        selector = css[i:j].strip()
        body_start = j
        depth = 0
        k = j
        while k < n:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
                if depth == 0:
                    k += 1
                    break
            k += 1
        rule_body = css[body_start:k]

        if not selector:
            i = k
            continue

        # Skip @charset etc
        if selector.startswith("@"):
            out.append(selector + rule_body)
            i = k
            continue

        parts = [s.strip() for s in selector.split(",")]
        new_parts: list[str] = []
        for part in parts:
            if part == ":root" or part.startswith(":root"):
                new_parts.append("#am-infographic")
            elif part.startswith("#am-infographic"):
                new_parts.append(part)
            else:
                new_parts.append(f"#am-infographic {part}")
        out.append(", ".join(new_parts) + rule_body)
        i = k

    return "".join(out)


def main() -> None:
    raw = RAW_PATH.read_text(encoding="utf-8")
    scoped = "/* Scoped for #am-infographic — do not use these classes outside */\n"
    scoped += "#am-infographic { isolation: isolate; }\n"
    scoped += scope_css(raw)
    CSS_PATH.write_text(scoped, encoding="utf-8")
    print("Wrote", CSS_PATH, "chars", len(scoped))


if __name__ == "__main__":
    main()
