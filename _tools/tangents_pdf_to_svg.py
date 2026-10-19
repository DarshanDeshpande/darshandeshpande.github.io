"""
Turns a handwritten notes PDF (exported from Apple Notes / any iPad app that
keeps ink as vectors) into SVGs for the Tangents page:

  tangent-N.svg   one slip per numbered idea, cut from the pages. An idea that
                  runs over a page break is joined back into one slip.
  page-N.svg      the original pages, whole, linked as "original pages".

    pip install pymupdf
    python3 _tools/tangents_pdf_to_svg.py "~/Downloads/Research Ideas II.pdf" assets/tangents/notebook-2

Ideas are found by the numbers you write at the start of each one ("1.", "2."
...), using the handwriting recognition iOS stores invisibly in the PDF. The
script prints where it cut; check the slips, then add the notebook to
_data/tangents.yml. No text from the PDF ends up in the SVGs: they hold only
the shapes of your strokes.

Your strokes stay vectors, so they are sharp at any zoom. The ink is
simplified only below what anyone can see (0.12 pt, a fiftieth of a
millimetre), which makes the files about a tenth of the naive size.
"""
import math
import os
import re
import sys

import fitz  # PyMuPDF

PAPER = "#FFFEFB"   # --paper, the same white as the letter
RULE = "#E2DFD7"    # --rule
INK = "#1F1E1C"     # --ink
TOLERANCE = 0.12    # pt; max distance a simplified outline may move
GRID = 5            # coordinates are stored in 1/5 pt integers
PAD_LINES = 1       # blank ruled lines kept above and below each slip
NUMBER = re.compile(r"^(\d{1,2})\s*\.")


def simplify(pts, eps):
    """Ramer-Douglas-Peucker on one closed outline."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy)
        best, bi = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if length > 1e-9:
                d = abs(dy * (px - ax) - dx * (py - ay)) / length
            else:
                d = math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, i
        if best > eps:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def outlines(items):
    """Path items -> list of point lists, one per subpath. Cubics are tiny
    (median 0.4 pt), so their end points plus midpoint describe them fully."""
    cur, subs = None, []
    for it in items:
        kind = it[0]
        if kind not in ("l", "c"):
            continue
        a, b = it[1], it[-1]
        if cur is None or abs(cur[-1][0] - a.x) > 1e-3 or abs(cur[-1][1] - a.y) > 1e-3:
            cur = [(a.x, a.y)]
            subs.append(cur)
        if kind == "c":
            p0, p1, p2, p3 = it[1], it[2], it[3], it[4]
            cur.append((
                (p0.x + 3 * p1.x + 3 * p2.x + p3.x) / 8,
                (p0.y + 3 * p1.y + 3 * p2.y + p3.y) / 8,
            ))
        cur.append((b.x, b.y))
    return subs


class Page:
    """One PDF page: its strokes (grouped as the PDF fills them), its ruled
    lines, and where each numbered idea starts."""

    def __init__(self, page):
        self.number = page.number + 1
        self.width = page.rect.width
        self.height = page.rect.height
        self.strokes = []      # [(subpaths, [center_y per subpath])]
        rules = []
        for d in page.get_drawings():
            f = d.get("fill")
            if f is None:
                continue
            if max(f) < 0.5:
                subs = [simplify(s, TOLERANCE) for s in outlines(d["items"])]
                subs = [s for s in subs if len(s) >= 3]
                if subs:
                    centers = [(min(y for _, y in s) + max(y for _, y in s)) / 2 for s in subs]
                    self.strokes.append((subs, centers))
            elif f[0] < 0.9 and d["rect"].height < 2 and d["rect"].width > 100:
                rules.append(d["rect"])
        rules.sort(key=lambda r: r.y0)
        if len(rules) >= 2:
            self.rule0 = (rules[0].y0 + rules[0].y1) / 2
            self.pitch = (rules[-1].y0 - rules[0].y0) / (len(rules) - 1)
            self.rule_width = rules[0].height
        else:
            self.rule0, self.pitch, self.rule_width = None, 17.5, 0.5
        self.starts = []       # [(idea number, y where it starts)]
        for b in page.get_text("dict")["blocks"]:
            for line in b.get("lines", []):
                text = "".join(s["text"] for s in line["spans"]).strip()
                m = NUMBER.match(text)
                if m and line["bbox"][0] < 60:
                    self.starts.append((int(m.group(1)), line["bbox"][1]))
        self.starts.sort(key=lambda s: s[1])

    def ink_bounds(self, pick):
        ys = [y for subs, _ in self.strokes for s, keep in zip(subs, pick(subs)) if keep for _, y in s]
        return (min(ys), max(ys)) if ys else None


def path_data(subs, dy=0.0):
    out = []
    for sub in subs:
        q = [(round(x * GRID), round((y + dy) * GRID)) for x, y in sub]
        seg = [f"M{q[0][0]} {q[0][1]}l"]
        px, py = q[0]
        steps = []
        for x, y in q[1:]:
            if (x, y) == (px, py):
                continue
            steps.append(f"{x - px}{' ' if y - py >= 0 else ''}{y - py}")
            px, py = x, y
        seg.append(" ".join(steps).replace(" -", "-"))
        seg.append("z")
        out.append("".join(seg))
    return "".join(out)


def svg(width, height, rules_at, rule_width, ink_paths):
    """ink_paths: list of path-data strings, one per original fill (keeping
    them separate preserves how overlapping strokes combine)."""
    w, h = round(width * GRID), round(height * GRID)
    lines = "".join(f"M0 {round(y * GRID, 1)}h{w}" for y in rules_at)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
        f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
        + (f'<path d="{lines}" stroke="{RULE}" stroke-width="{round(rule_width * GRID, 2)}" fill="none"/>' if lines else "")
        + f'<g fill="{INK}">' + "".join(f'<path d="{d}"/>' for d in ink_paths if d) + "</g></svg>\n"
    )


def page_svg(pg):
    rules = [pg.rule0 + k * pg.pitch for k in range(int((pg.height - pg.rule0) / pg.pitch) + 1)] if pg.rule0 else []
    return svg(pg.width, pg.height, rules, pg.rule_width, [path_data(subs) for subs, _ in pg.strokes])


def split_ideas(pages):
    """Assign every subpath to an idea. A subpath belongs to the last idea
    whose number starts above it; strokes above the first number on a page
    continue the previous page's idea. Returns {idea: [(page, mask per stroke)]}."""
    ideas, current = {}, None
    for pg in pages:
        owner = []
        for subs, centers in pg.strokes:
            row = []
            for c in centers:
                n = current
                for num, y in pg.starts:
                    if c >= y - 4:
                        n = num
                row.append(n)
            owner.append(row)
        for n in {n for row in owner for n in row if n is not None}:
            ideas.setdefault(n, []).append((pg, [[o == n for o in row] for row in owner]))
        if pg.starts:
            current = pg.starts[-1][0]
    return ideas


def written_lines(pg, mask):
    """Indices of the ruled lines this piece is written on (line k = text
    sitting on rule k), ignoring stray ascenders and descenders."""
    count = {}
    for (subs, centers), m in zip(pg.strokes, mask):
        for c, keep in zip(centers, m):
            if keep:
                k = math.ceil((c - pg.rule0) / pg.pitch)
                count[k] = count.get(k, 0) + 1
    floor = 0.2 * max(count.values())
    return sorted(k for k, v in count.items() if v >= floor)


def slip_svg(parts):
    """Stack the pieces of one idea (normally one, two across a page break).
    The outer edges are cropped halfway between ruled lines; at a page break
    the next page's first written line is placed on the line right after the
    previous page's last one, so the idea reads as if written on one sheet."""
    pieces, height = [], 0.0
    for i, (pg, mask) in enumerate(parts):
        lines = written_lines(pg, mask)
        if i == 0:
            ys = [y for (subs, _), m in zip(pg.strokes, mask) for s, keep in zip(subs, m) if keep for _, y in s]
            top_line = math.floor((min(ys) - pg.rule0) / pg.pitch) - PAD_LINES
            top = pg.rule0 + (top_line - 0.5) * pg.pitch      # halfway between two lines
        else:
            top = pg.rule0 + (lines[0] - 1) * pg.pitch        # the rule above its first written line
        if i == len(parts) - 1:
            ys = [y for (subs, _), m in zip(pg.strokes, mask) for s, keep in zip(subs, m) if keep for _, y in s]
            bottom_line = math.ceil((max(ys) - pg.rule0) / pg.pitch) + PAD_LINES
            bottom = pg.rule0 + (bottom_line + 0.5) * pg.pitch
        else:
            bottom = pg.rule0 + lines[-1] * pg.pitch          # the rule its last line sits on
        pieces.append((pg, mask, top, height))
        height += bottom - top
    pg0 = parts[0][0]
    rules = [(k + 0.5) * pg0.pitch for k in range(round(height / pg0.pitch))]
    ink = []
    for pg, mask, top, offset in pieces:
        for (subs, _), m in zip(pg.strokes, mask):
            kept = [s for s, keep in zip(subs, m) if keep]
            if kept:
                ink.append(path_data(kept, dy=offset - top))
    return svg(pg0.width, height, rules, pg0.rule_width, ink), height


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    pdf, out = os.path.expanduser(sys.argv[1]), sys.argv[2]
    os.makedirs(out, exist_ok=True)
    pages = [Page(p) for p in fitz.open(pdf)]
    blank = [p.number for p in pages if not p.strokes]
    pages = [p for p in pages if p.strokes]
    if blank:
        print("blank pages skipped:", ", ".join(map(str, blank)))

    for i, pg in enumerate(pages, 1):
        path = os.path.join(out, f"page-{i}.svg")
        with open(path, "w") as f:
            f.write(page_svg(pg))
        print(f"page {i} -> {path}")

    found = [n for pg in pages for n, _ in pg.starts]
    if found != list(range(1, len(found) + 1)):
        print(f"WARNING: idea numbers read as {found}; expected 1..{len(found)}. Check the slips.")
    heights = []
    for n, parts in sorted(split_ideas(pages).items(), key=lambda kv: (kv[0] is None, kv[0] or 0)):
        if n is None:
            print("WARNING: some ink comes before the first numbered idea and was left out.")
            continue
        text, height = slip_svg(parts)
        heights.append(round(height))
        path = os.path.join(out, f"tangent-{n}.svg")
        with open(path, "w") as f:
            f.write(text)
        where = " + ".join(f"page {pages.index(pg) + 1}" for pg, _ in parts)
        print(f"tangent {n} -> {path}  ({where}; {round(height)}x{round(pages[0].width)} pt, {len(text) // 1024} KB)")
    print("\nFor _data/tangents.yml:")
    print(f"  pages: {len(pages)}")
    print(f"  slips: [{', '.join(map(str, heights))}]")


if __name__ == "__main__":
    main()
