// ─────────────────────────────────────────────────────────────
// Portfolio data — single source of truth for the whole site.
//
// DEFAULT_PORTFOLIO is the committed content. The admin panel writes
// overrides to localStorage; loadPortfolio() merges them on top so the
// terminal, neofetch, and every command reflect edits without a rebuild.
// Export from the admin panel to get JSON you can paste back here to make
// changes permanent.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "portfolio.data.v1";

export const DEFAULT_PORTFOLIO = {
  profile: {
    user: "suchak",
    host: "portfolio",
    shell: "fish",
    name: "Suchak Niraula",
    title: "Full Stack Developer",
    location: "Lalitpur, Nepal 🇳🇵",
    tagline: "Building things end to end, from UI to database.",
    bio: [
      "Full-stack developer working across the stack — React and Next.js",
      "front ends backed by Node.js, Express, FastAPI, Django, and Gin.",
      "I enjoy shipping ecommerce features, admin panels, and automation,",
      "with a habit of building secure auth and access control along the way.",
      "",
      "BSc in Computer Science & IT from Samriddhi College (TU affiliation).",
      "Currently a Full Stack Developer at Nexbil Software Solutions.",
    ],
  },

  skills: {
    Languages: [
      { name: "JavaScript", level: 90 },
      { name: "TypeScript", level: 88 },
      { name: "Python", level: 80 },
      { name: "Go", level: 65 },
    ],
    Frontend: [
      { name: "React", level: 90 },
      { name: "Next.js", level: 88 },
      { name: "Tailwind CSS", level: 85 },
    ],
    Backend: [
      { name: "Node.js", level: 88 },
      { name: "Express.js", level: 85 },
      { name: "FastAPI", level: 75 },
      { name: "Django", level: 72 },
      { name: "Gin", level: 65 },
    ],
    Databases: [
      { name: "PostgreSQL", level: 82 },
      { name: "MongoDB", level: 82 },
      { name: "MySQL", level: 78 },
    ],
    Tools: [
      { name: "Git", level: 90 },
      { name: "GitHub", level: 90 },
      { name: "Docker", level: 78 },
      { name: "Linux", level: 78 },
    ],
  },

  projects: [
    {
      id: "bookverse",
      name: "BookVerse — Online Bookstore",
      year: "2024",
      description:
        "Full-stack MERN bookstore with an intuitive React front end and scalable Node/Express backend, integrating ERC-20 token smart contracts for a blockchain-based discount system.",
      tech: ["React", "Node.js", "Express", "MongoDB", "ERC-20"],
      url: "github.com/Suchak123/bookStore_2",
    },
    {
      id: "unix-shell-emulator",
      name: "UNIX Shell Emulator",
      year: "2024",
      description:
        "Custom Read-Eval-Print Loop (REPL) for continuous command input, implementing core built-ins including cd, pwd, echo, type, and exit.",
      tech: ["Node.js"],
      url: "github.com/Suchak123/UNIX-Shell-Emulator",
    },
    {
      id: "feedback-board",
      name: "Feedback Board",
      year: "2024",
      description:
        "Full-stack feedback app with CRUD APIs, upvotes, sorting and filtering, and state management via Zustand and TanStack Query.",
      tech: ["Next.js", "Zustand", "TanStack Query"],
      url: "feedback-board-henna.vercel.app",
    },
  ],

  companies: [
    {
      id: "nexbil",
      company: "Nexbil Software Solutions",
      role: "Full Stack Developer",
      period: "Nov 2025 — Oct 2026",
      location: "Nepal",
      description:
        "Building frontend and backend for the Dermedic ecommerce webapp — cart, authentication, filtering, sorting, pagination, and admin panels. Built a full-stack laptop comparison platform (TypeScript monorepo) with an LLM-based web-scraping pipeline and a deterministic strength-weighted spec-comparison engine, revamped the company site in Next.js with Payload CMS, and strengthened security with secure auth, input validation, and role-based access control.",
    },
    {
      id: "yirifi",
      company: "Yirifi.ai",
      role: "Data Operations",
      period: "Feb 2025 — May 2025",
      location: "Singapore",
      description:
        "Built intuitive interfaces for monitoring and managing workflows for non-technical teams, wrote Python and JavaScript automation to streamline frontend data handling, and optimized data workflows and visualizations for clarity and responsiveness across QA and regulatory platforms.",
    },
  ],

  contact: {
    email: "niraulasuchak@gmail.com",
    github: "github.com/Suchak123",
  },
};

// Deep-ish clone so callers never mutate the frozen defaults.
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadPortfolio() {
  if (typeof localStorage === "undefined") return clone(DEFAULT_PORTFOLIO);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_PORTFOLIO);
    const saved = JSON.parse(raw);
    // Shallow-merge top-level sections so new default sections still appear
    // for users who saved an older shape.
    return { ...clone(DEFAULT_PORTFOLIO), ...saved };
  } catch {
    return clone(DEFAULT_PORTFOLIO);
  }
}

export function savePortfolio(data) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Notify same-tab listeners (storage event only fires cross-tab).
  window.dispatchEvent(new Event("portfolio:change"));
}

export function resetPortfolio() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("portfolio:change"));
}

export { STORAGE_KEY };
