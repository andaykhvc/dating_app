"""Generate the repository banner with Pillow; no network or app dependencies."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
SCALE = 2
PAPER = "#FAF7F2"
INK = "#16151C"
MUTED = "#605C6E"
INDIGO = "#3B2FE8"
SOFT = "#ECEBFE"
ORANGE = "#F2761F"
LINE = "#E6E0D6"


def font(size, bold=False):
    names = (
        ["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "C:/Windows/Fonts/arialbd.ttf"]
        if bold else
        ["/System/Library/Fonts/Supplemental/Arial.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "C:/Windows/Fonts/arial.ttf"]
    )
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size * SCALE)
    raise RuntimeError("Install Arial or DejaVu Sans to render the banner.")


image = Image.new("RGB", (1200 * SCALE, 460 * SCALE), PAPER)
draw = ImageDraw.Draw(image)


def box(bounds, fill, radius=20, outline=None, width=1):
    draw.rounded_rectangle(tuple(int(v * SCALE) for v in bounds),
                           radius=radius * SCALE, fill=fill,
                           outline=outline, width=width * SCALE)


def text(x, y, value, size=18, color=INK, bold=False):
    draw.text((x * SCALE, y * SCALE), value, font=font(size, bold), fill=color)


def line(points, color, width=2):
    draw.line([(x * SCALE, y * SCALE) for x, y in points],
              fill=color, width=width * SCALE, joint="curve")


def pill(x, y, label, fill=SOFT, color=INDIGO, width=98):
    box((x, y, x + width, y + 30), fill, radius=15)
    text(x + 13, y + 7, label, 12, color, True)


# Editorial title and product loop.
box((1, 1, 1199, 459), PAPER, radius=28, outline=LINE)
box((42, 42, 94, 87), INDIGO, radius=15)
box((54, 54, 82, 72), PAPER, radius=6)
draw.polygon([(62 * SCALE, 69 * SCALE), (62 * SCALE, 78 * SCALE),
              (71 * SCALE, 69 * SCALE)], fill=PAPER)
text(110, 53, "LANGUAGE. WITH PEOPLE.", 13, INDIGO, True)
text(42, 122, "Lingua Match", 60, INK, True)
text(45, 204, "Learn a language", 33, INK, True)
text(45, 246, "with someone real.", 33, INDIGO, True)
text(45, 307, "A conversation worth starting.", 18, MUTED)
text(45, 334, "A little progress, every day.", 18, MUTED)
pill(44, 394, "MEET", width=76)
pill(131, 394, "LEARN", width=82)
pill(224, 394, "TALK", width=74)
pill(309, 394, "GROW", "#FDEEE1", ORANGE, 84)

# Stylized chat, correction, and progress cards.
box((628, 30, 1150, 428), "#F1ECE3", radius=32)
box((657, 55, 1118, 348), "#FFFFFF", radius=26, outline=LINE)
pill(678, 74, "YOUR NEXT CONVERSATION", width=216)
text(680, 126, "What music do you like?", 21, INK, True)
box((731, 169, 1097, 221), INDIGO, radius=17)
text(750, 185, "Welche Musik magst du?", 19, "#FFFFFF")
box((680, 239, 1060, 307), SOFT, radius=17)
text(697, 252, "A LITTLE HELP FROM YOUR PARTNER", 10, INDIGO, True)
text(697, 273, "Ich mag Jazz. Und du?", 19, INK, True)
line([(692, 321), (1085, 321)], LINE, 1)
text(685, 327, "Practise together. Keep the conversation going.", 12, MUTED)
box((701, 365, 1123, 412), "#FFFFFF", radius=16)
box((715, 377, 746, 400), "#FDEEE1", radius=8)
text(722, 381, "+", 15, ORANGE, True)
text(758, 381, "REAL PRACTICE. SHARED PROGRESS.", 12, INK, True)

OUT.mkdir(parents=True, exist_ok=True)
image.resize((1200, 460), Image.Resampling.LANCZOS).save(
    OUT / "readme-banner.png", optimize=True
)
print(f"Wrote {OUT / 'readme-banner.png'}")
