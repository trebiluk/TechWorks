#!/usr/bin/env python3
"""Teacher click-by-click PDF for TechWorks Cloudflare live-save."""
from pathlib import Path
from fpdf import FPDF

OUT = Path("/workspace/docs/TechWorks-Cloudflare-Live-Save-Directions.pdf")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONTB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

NAVY = (6, 18, 43)
ORANGE = (232, 88, 32)
ROYAL = (30, 75, 175)
MUTED = (70, 80, 100)
WHITE = (255, 255, 255)
PALE = (245, 247, 252)
GREEN = (20, 120, 70)
GOLD = (160, 110, 20)


class Doc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 216, 12, "F")
        self.set_font("B", size=9)
        self.set_text_color(*WHITE)
        self.set_xy(12, 3.5)
        self.cell(140, 5, "TechWorks  |  Cloudflare live-save  |  Path A")
        self.cell(0, 5, f"p. {self.page_no()}", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-12)
        self.set_font("R", size=8)
        self.set_text_color(*MUTED)
        self.cell(
            0,
            5,
            "Private teacher copy  |  (c) 2026 Richard Kulibert  |  Do not share vault files  |  v1.80.97",
            align="C",
        )

    def heading(self, text, size=16):
        self.ln(2)
        self.set_font("B", size=size)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 8, text)
        self.set_draw_color(*ORANGE)
        self.set_line_width(0.7)
        y = self.get_y()
        self.line(12, y, 62, y)
        self.ln(3)

    def p(self, text, bold=False):
        self.set_font("B" if bold else "R", size=12)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 6.4, text)
        self.ln(1.2)

    def note(self, title, body, color=ORANGE):
        if self.get_y() > 240:
            self.add_page()
        x, y = 12, self.get_y()
        w = 192
        self.set_xy(x + 5, y + 3)
        self.set_font("B", size=11)
        self.set_text_color(*NAVY)
        self.multi_cell(w - 10, 5.6, title)
        self.set_x(x + 5)
        self.set_font("R", size=11)
        self.multi_cell(w - 10, 5.6, body)
        h = self.get_y() + 3 - y
        self.set_draw_color(*color)
        self.set_line_width(0.9)
        self.rect(x, y, w, h)
        self.set_fill_color(*color)
        self.rect(x, y, 2.4, h, "F")
        self.set_y(y + h + 3)

    def step(self, n, title, body):
        if self.get_y() > 245:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(*ROYAL)
        self.ellipse(13, y + 0.4, 8.2, 8.2, "F")
        self.set_font("B", size=11)
        self.set_text_color(*WHITE)
        self.set_xy(13, y + 2)
        self.cell(8.2, 5, str(n), align="C")
        self.set_xy(24, y + 0.8)
        self.set_text_color(*NAVY)
        self.set_font("B", size=13)
        self.multi_cell(168, 6, title)
        self.set_x(24)
        self.set_font("R", size=12)
        self.multi_cell(168, 6.2, body)
        self.ln(3)

    def bullet(self, text):
        self.set_font("R", size=12)
        self.set_text_color(*NAVY)
        self.set_x(16)
        self.cell(6, 6.2, "-")
        self.multi_cell(174, 6.2, text)
        self.ln(0.3)

    def check(self, text):
        y = self.get_y()
        self.set_draw_color(*NAVY)
        self.set_line_width(0.35)
        self.rect(14, y + 1.1, 4.4, 4.4)
        self.set_xy(21, y)
        self.set_font("R", size=12)
        self.set_text_color(*NAVY)
        self.multi_cell(173, 6.2, text)
        self.ln(0.8)

    def row(self, a, b, header=False):
        self.set_font("B" if header else "R", size=10)
        if header:
            self.set_fill_color(*NAVY)
            self.set_text_color(*WHITE)
        else:
            self.set_fill_color(*PALE)
            self.set_text_color(*NAVY)
        x = self.get_x()
        y = self.get_y()
        h = 8
        # wrap right cell if needed
        self.set_xy(x + 62, y)
        # measure
        self.cell(58, h, a, border=1, fill=True)
        self.cell(134, h, b, border=1, fill=True, ln=1)


def main():
    pdf = Doc(format="Letter", unit="mm")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_left_margin(12)
    pdf.set_right_margin(12)
    pdf.add_font("R", "", FONT)
    pdf.add_font("B", "", FONTB)
    pdf.add_page()

    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 216, 44, "F")
    pdf.set_fill_color(*ORANGE)
    pdf.rect(0, 44, 216, 3.2, "F")
    pdf.set_font("B", size=22)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(12, 11)
    pdf.cell(0, 10, "TechWorks live-save")
    pdf.set_font("R", size=13)
    pdf.set_xy(12, 23)
    pdf.cell(0, 7, "Cloudflare + Name.com  |  click-by-click for the classroom PC")
    pdf.set_font("R", size=10)
    pdf.set_xy(12, 32)
    pdf.cell(0, 7, "Teacher copy  |  kulibert.net  |  Cnyguy815  |  September 8, 2026")

    pdf.set_y(54)
    pdf.note(
        "Read this first  (then ignore extra Cloudflare menus)",
        "You are not buying hosting. Name.com keeps the domain. Cloudflare is a free mailbox "
        "the app will write to.\n\n"
        "TWO Cloudflare screens look similar:\n"
        "  1. Website (kulibert.net) = DNS, SSL, Workers Routes. You were here. Do not create the app here.\n"
        "  2. Account -> Workers & Pages = the factory. Create the site and the API here.\n\n"
        "Until the pipe is built in TechWorks, scores live in TWO TABS on ONE classroom PC. "
        "The iPad cannot score yet.",
        ORANGE,
    )

    pdf.heading("What you are building")
    pdf.p("Three addresses. Only the first two matter in class.")
    pdf.row("Address", "Job", True)
    pdf.row("tw.kulibert.net", "App + projector wall (aliases only)")
    pdf.row("workers.dev API", "Live save: vault + crew-pad scores")
    pdf.row("Google Drive folder", "Overnight backup (still do this)")
    pdf.ln(2)
    pdf.p("Students never sign into Google. Crew lead = room code + PIN 2222.", bold=True)

    pdf.heading("Classroom tomorrow  (even if Cloudflare is unfinished)")
    pdf.step(
        1,
        "One Chrome profile on the projector PC",
        "Open TechWorks once. Duplicate the TAB (Ctrl+T, or drag the tab to a second window). "
        "Do not use Incognito. Do not use a second Google profile.",
    )
    pdf.step(
        2,
        "Window A = projector",
        "Full screen on the HDMI display. Stay on DASH. Leave it locked. Nobody types a PIN on this window.",
    )
    pdf.step(
        3,
        "Window B = your screen",
        "CREW (PIN 2222) when the crew lead scores. ADMIN (your PIN) when you score. "
        "Same computer = same data. The projector updates.",
    )
    pdf.step(
        4,
        "iPad stays in the cart",
        "An iPad is a second brain. It will not see the projector copy until the Cloudflare pipe is in the app. "
        "If a student must tap, they use window B at your desk.",
    )

    pdf.add_page()
    pdf.heading("Part A  -  Open the right Cloudflare screen")
    pdf.p("Log in at dash.cloudflare.com as Cnyguy815@gmail.com")
    pdf.note(
        "If the left menu shows DNS, SSL, Caching, Workers Routes...",
        "You are inside the WEBSITE. That is the wrong factory.\n\n"
        "Click the orange cloud (top left), or the email name Cnyguy815, or Manage account at the bottom.\n"
        "You want the account home (websites as cards).\n\n"
        "Direct link (paste in the address bar while logged in):\n"
        "https://dash.cloudflare.com/?to=/:account/workers-and-pages",
        ROYAL,
    )
    pdf.p("You should now see Workers & Pages with a Create button, not a list of DNS records.")

    pdf.heading("Part B  -  Make the projector site (Pages)")
    pdf.p(
        'On "Make something new" you will see GitHub, Hello World, templates, Upload, '
        "and a tiny link at the bottom."
    )
    pdf.step(
        1,
        "Click the tiny link, not GitHub",
        "Need to use the legacy Pages workflow?  ->  Continue to Pages\n"
        "Do not click Continue with GitHub tonight. Do not click Select a template.",
    )
    pdf.step(
        2,
        "Create with Upload assets",
        "Choose Upload / Direct upload. Project name: kulibert-desk\n"
        "Do NOT name it techworks. That pages.dev address is already someone else's blog.",
    )
    pdf.step(
        3,
        "Placeholder is fine",
        "On your computer, make a file named index.html containing:  <h1>TechWorks</h1>\n"
        "Zip it if the screen wants a zip, then Deploy.",
    )
    pdf.step(
        4,
        "Copy YOUR pages.dev URL",
        "It will look like kulibert-desk.pages.dev  (or kulibert-desk-xxxx.pages.dev).\n"
        "Write it here: ______________________________________",
    )

    pdf.heading("Part C  -  Point tw.kulibert.net at YOUR site")
    pdf.p("Name.com -> My Domains -> kulibert.net -> DNS records.")
    pdf.ln(1)
    pdf.row("Record", "Do this", True)
    pdf.row("A  kulibert.net", "LEAVE IT  (your main site)")
    pdf.row("CNAME  baboo", "LEAVE IT  (Vercel project)")
    pdf.row("CNAME  tw", "EDIT  Answer = your kulibert-desk.pages.dev")
    pdf.row("CNAME  api", "DELETE for now  (workers.dev CNAME 503s)")
    pdf.ln(3)
    pdf.step(
        5,
        "Add the custom domain in Cloudflare Pages",
        "Open the kulibert-desk project -> Custom domains -> Set up a domain -> "
        "type tw.kulibert.net -> Continue.\n"
        "Wait until it says Active. Often 5-30 minutes. https://tw.kulibert.net will 503 until then. That is normal.",
    )

    pdf.add_page()
    pdf.heading("Part D  -  Live-save API (Worker)")
    pdf.p("You may already have this. Check first:")
    pdf.p("https://techworks-api.cnyguy815.workers.dev", bold=True)
    pdf.p("If that page loads (hello text is fine), skip creating a new Worker. Go to step 3.")
    pdf.step(
        1,
        "Only if it does not exist: Hello World Worker",
        "Workers & Pages -> Create -> Start with Hello World! -> name it techworks-api -> Deploy.",
    )
    pdf.step(
        2,
        "Open the Worker -> Settings",
        "Variables / Secrets -> Add  TEACHER_TOKEN  = a long random string (not 1111, not 2222). "
        "Save it in a password manager.\n"
        "Bindings -> KV -> add VAULT bound to a new namespace techworks-kv.\n"
        "Bindings -> R2 -> add SNAPSHOTS bound to a new bucket techworks-vault. Do NOT make the bucket public.",
    )
    pdf.step(
        3,
        "Do not CNAME api.kulibert.net yet",
        "On the free plan, a Name.com CNAME to workers.dev usually 503s. "
        "The app will use the workers.dev URL until we attach a pretty name later.",
    )

    pdf.heading("Part E  -  FERPA  (set now)")
    pdf.bullet("R2 bucket stays private. Never enable a public r2.dev link.")
    pdf.bullet("Projector wall = aliases only. Legal names stay in the encrypted vault.")
    pdf.bullet("Do not put this app in a public GitHub repo.")
    pdf.bullet("Students do not log into Google. Google Drive is YOUR overnight copy only.")
    pdf.bullet("Leave Cloudflare AI Crawl / public analytics off for this project.")

    pdf.heading("Part F  -  After class / Drive")
    pdf.p(
        "Until auto-upload exists: ADMIN -> Backups -> Download full -> drop the JSON in your "
        "private Drive folder TechWorks Vault / vault. Name it desk-YYYY-MM-DD.json. Never share that folder."
    )

    pdf.heading("Done when...")
    pdf.check("Workers & Pages list shows project kulibert-desk")
    pdf.check("https://YOUR.pages.dev loads (placeholder OK)")
    pdf.check("Name.com tw CNAME = YOUR pages.dev (not techworks.pages.dev)")
    pdf.check("Pages custom domain tw.kulibert.net = Active")
    pdf.check("https://techworks-api.cnyguy815.workers.dev loads")
    pdf.check("Worker has TEACHER_TOKEN + KV VAULT + R2 SNAPSHOTS (private)")
    pdf.check("Apex and baboo DNS records untouched")
    pdf.check("Classroom = two tabs, one PC")
    pdf.ln(2)
    pdf.note(
        "Then tell Grok:  build pipe",
        "Paste: (1) your pages.dev URL   (2) confirmation the Worker hello page loads.\n"
        "Do not paste TEACHER_TOKEN in chat.\n"
        "Grok will then wire TechWorks to save the vault and accept iPad crew scores.",
        GREEN,
    )

    pdf.add_page()
    pdf.heading("Cheat sheet  -  wrong click vs right click")
    pdf.row("You see this", "Do this", True)
    pdf.row("DNS / SSL / Workers Routes", "Wrong place. Orange cloud -> account home")
    pdf.row("Make something new + GitHub", "Bottom link: Continue to Pages")
    pdf.row("Continue with GitHub", "Skip tonight")
    pdf.row("Start with Hello World!", "Only for the API Worker")
    pdf.row("Project name techworks", "Use kulibert-desk instead")
    pdf.row("CNAME to techworks.pages.dev", "Wrong blog. Use YOUR pages.dev")
    pdf.row("api CNAME 503", "Delete CNAME; use workers.dev URL")
    pdf.row("iPad + projector, two browsers", "Split brain. Use two tabs, one PC")
    pdf.ln(5)
    pdf.heading("Who does what next")
    pdf.row("You tonight", "Grok after you say build pipe", True)
    pdf.row("Pages project kulibert-desk", "Real app uploaded to Pages")
    pdf.row("Fix tw CNAME + custom domain", "Connect Cloudflare in Admin")
    pdf.row("Worker token + KV + R2", "Encrypt vault, then auto-PUT")
    pdf.row("Two-tab classroom", "Pad room-code + 2222 live scores")
    pdf.ln(6)
    pdf.note(
        "Support notes",
        "Domain registrar: name.com  (do not buy their hosting).\n"
        "Cloudflare plan: Free.\n"
        "Teacher Google: personal Gmail for Drive vault - not Classroom, not students.\n"
        "Crew PIN: 2222    Teacher PIN: yours (not 1111 if you already changed it).\n"
        "App version this sheet matches: TechWorks 1.80.97.",
        GOLD,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print("wrote", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
