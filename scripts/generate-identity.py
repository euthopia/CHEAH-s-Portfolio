"""Generate CHEAH CHERN EU identity textures (career stones, project & lab cards, share image).
Run: python3 scripts/generate-identity.py   (requires Pillow; uses Inter fonts if installed)"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os, random

ROOT = os.path.join(os.path.dirname(__file__), '..', 'static')
FONT_DIRS = ['/usr/share/fonts/opentype/inter/', '/usr/share/fonts/truetype/dejavu/']

def font(weight, size):
    names = {'bold': ['Inter-Bold.otf', 'DejaVuSans-Bold.ttf'], 'black': ['Inter-Black.otf', 'Inter-Bold.otf', 'DejaVuSans-Bold.ttf'],
             'regular': ['Inter-Regular.otf', 'DejaVuSans.ttf'], 'medium': ['Inter-Medium.otf', 'DejaVuSans.ttf']}[weight]
    for d in FONT_DIRS:
        for n in names:
            if os.path.exists(d + n):
                return ImageFont.truetype(d + n, size)
    return ImageFont.load_default()

# ---------------------------------------------------------------- Career stones
# Shader reads: R = text, G = label box. Same canvas sizes as the original meshes expect.
CAREER = {
    # Slot (fixed position in the 3D world)   size        lines            # years shown with year.start = 2012
    'careerHetic':           ((316, 60), ['SCHOOL YEARS', 'UPSR 6A · PT3 7A']),            # 2012 → 2016
    'careerUzik':            ((168, 60), ['SPM', '10 A\'S']),                            # 2017 → 2019
    'careerImmersiveGarden': ((340, 60), ['AI ENGINEER', 'MODELS TO PRODUCTION']),       # 2020 → 2022
    'careerOnlineTeacher':   ((332, 92), ['HUAWEI MALAYSIA', 'CLOUD & AI', 'SOLUTION ARCHITECT']),  # 2023 → now
    'careerFreelancer':      ((240, 60), ['AI × CLOUD', 'ALWAYS LEARNING']),             # 2015 → now
    'careerIRLTeacher':      ((268, 92), ['LEVELLING UP', 'DATA · CODE · CLOUD', '23 A\'S MINDSET']),  # 2017 → 2025
}

def career(name, size, lines):
    w, h = size
    img = Image.new('RGBA', size, (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    row = h / len(lines)
    for i, text in enumerate(lines):
        f_size = 26
        while True:
            f = font('bold' if i == 0 else 'regular', f_size)
            tw = d.textlength(text, font=f)
            if tw + 4 <= w or f_size <= 12:
                break
            f_size -= 1
        y0 = round(i * row)
        y1 = round(i * row + row) - 4
        d.rectangle([0, y0, min(w - 1, tw + 3), y1], fill=(0, 255, 0, 255))
        bbox = d.textbbox((0, 0), text, font=f)
        ty = y0 + ((y1 - y0) - (bbox[3] - bbox[1])) / 2 - bbox[1]
        d.text((1, ty), text, font=f, fill=(255, 0, 0, 255))
    img.save(os.path.join(ROOT, 'career', name + '.png'))

for k, (s, l) in CAREER.items():
    career(k, s, l)

# ---------------------------------------------------------------- Cards
PALETTES = {
    'huawei':  ((24, 6, 10), (230, 30, 50), (255, 140, 120)),
    'cloud':   ((6, 14, 34), (60, 130, 255), (150, 220, 255)),
    'ai':      ((14, 6, 30), (170, 80, 255), (255, 120, 220)),
    'school':  ((8, 22, 16), (60, 210, 140), (230, 255, 160)),
    'stack':   ((18, 18, 22), (255, 160, 60), (255, 230, 150)),
}

def background(w, h, pal, seed, motif):
    rnd = random.Random(seed)
    bg, a, b = pal
    img = Image.new('RGB', (w, h), bg)
    glow = Image.new('RGB', (w, h), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for _ in range(3):
        x, y, r = rnd.randint(0, w), rnd.randint(0, h), rnd.randint(w // 4, w // 2)
        gd.ellipse([x - r, y - r, x + r, y + r], fill=tuple(int(c * 0.45) for c in a))
    glow = glow.filter(ImageFilter.GaussianBlur(w // 8))
    img = Image.blend(img, Image.eval(Image.merge('RGB', [Image.eval(c, lambda v: v) for c in glow.split()]), lambda v: v), 0.0)
    img = Image.composite(glow, img, glow.convert('L').point(lambda v: min(255, v * 3)))
    d = ImageDraw.Draw(img, 'RGBA')
    s = w / 960
    if motif == 'network':
        nodes = [(rnd.randint(0, w), rnd.randint(0, h)) for _ in range(38)]
        for i, p in enumerate(nodes):
            for q in nodes[i + 1:]:
                if math.dist(p, q) < 190 * s:
                    d.line([p, q], fill=a + (90,), width=max(1, int(2 * s)))
        for p in nodes:
            r = rnd.randint(3, 8) * s
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=b + (230,))
    elif motif == 'grid':
        step = int(48 * s)
        for x in range(0, w, step):
            d.line([(x, 0), (x, h)], fill=a + (40,))
        for y in range(0, h, step):
            d.line([(0, y), (w, y)], fill=a + (40,))
        for _ in range(16):
            x, y = rnd.randrange(0, w, step), rnd.randrange(0, h, step)
            d.rectangle([x, y, x + step, y + step], fill=a + (rnd.randint(40, 140),))
    elif motif == 'clouds':
        for _ in range(9):
            x, y, r = rnd.randint(0, w), rnd.randint(int(h * .2), h), rnd.randint(40, 120) * s
            for k in range(4):
                ox = (k - 1.5) * r * .7
                d.ellipse([x + ox - r, y - r * (0.7 + (k % 2) * .3), x + ox + r, y + r * .6], fill=a + (45,))
    elif motif == 'stars':
        for _ in range(140):
            x, y, r = rnd.randint(0, w), rnd.randint(0, h), rnd.random() * 3 * s
            d.ellipse([x - r, y - r, x + r, y + r], fill=b + (rnd.randint(80, 255),))
    return img

def card(path, w, h, pal, seed, motif, kicker, title, sub, big=None):
    img = background(w, h, pal, seed, motif)
    d = ImageDraw.Draw(img, 'RGBA')
    s = w / 960
    _, a, b = pal
    if big:
        f = font('black', int(300 * s))
        bb = d.textbbox((0, 0), big, font=f)
        d.text((w - (bb[2] - bb[0]) - 40 * s - bb[0], h - (bb[3] - bb[1]) - 30 * s - bb[1]), big, font=f, fill=a + (60,))
    pad = 56 * s
    if kicker:
        f = font('bold', int(26 * s))
        d.rounded_rectangle([pad, pad, pad + d.textlength(kicker, font=f) + 28 * s, pad + 44 * s], radius=22 * s, fill=a + (255,))
        d.text((pad + 14 * s, pad + 8 * s), kicker, font=f, fill=(255, 255, 255))
    f = font('black', int(76 * s))
    y = h * 0.42
    for line in title.split('\n'):
        d.text((pad, y), line, font=f, fill=(255, 255, 255))
        y += 84 * s
    if sub:
        d.text((pad, y + 10 * s), sub, font=font('medium', int(30 * s)), fill=b)
    d.text((w - pad - d.textlength('CHEAH CHERN EU', font=font('bold', int(20 * s))), pad + 10 * s), 'CHEAH CHERN EU', font=font('bold', int(20 * s)), fill=(255, 255, 255, 150))
    img.save(path)

P = os.path.join(ROOT, 'projects', 'images')
projects = [
    ('cheah-huawei', 'huawei', 'grid',    [('NOW', 'Huawei Malaysia', 'Cloud & AI Solution Architect'), ('ROLE', 'Design.\nArchitect. Deliver.', 'From customer problem to cloud blueprint'), ('FOCUS', 'Enterprise\nCloud', 'Scalable, secure, cost-aware architectures')]),
    ('cheah-ai',     'ai',     'network', [('BEFORE', 'AI Engineer', 'Taking models from notebook to production'), ('CRAFT', 'Data → Model\n→ Product', 'Training, evaluation, deployment'), ('LOVE', 'Generative AI', 'LLMs, RAG and intelligent assistants')]),
    ('cheah-cloud',  'cloud',  'clouds',  [('BRIDGE', 'Cloud × AI', 'Where infrastructure meets intelligence'), ('BUILD', 'AI on Cloud', 'Platforms that let AI scale'), ('MINDSET', 'Architect\nThinking', 'Trade-offs, reliability, simplicity')]),
    ('cheah-school', 'school', 'stars',   [('UPSR', 'UPSR', '6 A\'s', '6A'), ('PT3', 'PT3', '7 A\'s', '7A'), ('SPM', 'SPM', '10 A\'s — straight A student', '10A')]),
]
for i, (key, pal, motif, slides) in enumerate(projects):
    for j, sl in enumerate(slides):
        card(os.path.join(P, f'{key}-{j + 1}.png'), 960, 540, PALETTES[pal], i * 10 + j, motif, sl[0], sl[1], sl[2], sl[3] if len(sl) > 3 else None)

L = os.path.join(ROOT, 'lab', 'images')
lab = [
    ('cheah-gpt', 'ai', 'network', 'CHEAH-GPT', 'Ask my in-world AI'),
    ('cheah-neural-sky', 'cloud', 'stars', 'Neural Sky', 'Look up while you drive'),
    ('cheah-huawei-cloud', 'huawei', 'clouds', 'Huawei Cloud', 'The platform I architect on'),
    ('cheah-modelarts', 'ai', 'grid', 'ModelArts', 'AI development platform'),
    ('cheah-python', 'stack', 'grid', 'Python', 'My first language for AI'),
    ('cheah-pytorch', 'stack', 'network', 'PyTorch', 'Deep learning framework'),
    ('cheah-kubernetes', 'cloud', 'grid', 'Kubernetes', 'Containers at scale'),
    ('cheah-report-card', 'school', 'stars', 'Report Card', '23 A\'s and counting'),
]
for i, (key, pal, motif, title, sub) in enumerate(lab):
    card(os.path.join(L, f'{key}.png'), 960, 540, PALETTES[pal], 100 + i, motif, 'LAB', title, sub)
    card(os.path.join(L, f'{key}-mini.png'), 240, 136, PALETTES[pal], 100 + i, motif, None, title, None)

card(os.path.join(ROOT, 'social', 'share-image.png'), 1200, 630, PALETTES['ai'], 7, 'network', 'PORTFOLIO', 'CHEAH CHERN EU', 'Cloud & AI Solution Architect · Huawei Malaysia')
print('done')

# ---------------------------------------------------------------- Time machine screens (140x124 pixel-art)
def screen(name, top, big, bottom, bg, fg):
    img = Image.new('RGBA', (140, 124), bg + (255,))
    d = ImageDraw.Draw(img)
    for y in range(0, 124, 3):
        d.line([(0, y), (140, y)], fill=tuple(max(0, c - 18) for c in bg) + (255,))
    for text, f, y in [(top, font('bold', 13), 14), (big, font('black', 40), 38), (bottom, font('bold', 12), 94)]:
        w = d.textlength(text, font=f)
        d.text(((140 - w) / 2, y), text, font=f, fill=fg + (255,))
    img.save(os.path.join(ROOT, 'timeMachine', name + '.png'))

screen('timeMachineScreenFolio', 'UPSR · PT3 · SPM', '23A', 'BACK TO 2012', (30, 70, 50), (190, 255, 170))
screen('timeMachineScreenMGS', 'NOW PLAYING', '2026', 'HUAWEI · CLOUD & AI', (60, 10, 20), (255, 170, 160))
