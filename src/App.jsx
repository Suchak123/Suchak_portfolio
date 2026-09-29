import React, { useState, useEffect, useCallback } from "react";
import Nav from "./components/Nav/Nav";
import RubberSegment from "./components/RubberSegment/RubberSegment";
import AdminGate from "./components/Admin/AdminGate";
import { useTheme } from "./hooks/useTheme";
import { loadPortfolio } from "./data/portfolio";
import { downloadResume } from "./lib/resume";
import styles from "./App.module.css";
import "./styles/globals.css";

// Path-based route: /admin shows the admin panel, anything else the site.
function usePathRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return path.replace(/\/+$/, "") || "/";
}

// Client-side navigate without a full reload (pushState + notify listeners).
function navigate(to) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Re-read portfolio data and reload when the admin panel saves.
function usePortfolio() {
  const [data, setData] = useState(() => loadPortfolio());
  useEffect(() => {
    const reload = () => setData(loadPortfolio());
    window.addEventListener("portfolio:change", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("portfolio:change", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);
  return data;
}

function Section({ id, label, title, children }) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>{label}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Hero({ profile, contact, onDownload }) {
  return (
    <header className={styles.hero}>
      <p className={styles.heroKicker}>{profile.title}</p>
      <h1 className={styles.heroName}>{profile.name}</h1>
      {profile.tagline && <p className={styles.heroTagline}>{profile.tagline}</p>}
      {profile.location && (
        <p className={styles.heroMeta}>{profile.location}</p>
      )}
      <div className={styles.heroActions}>
        {contact.email && (
          <a className={styles.btnPrimary} href={`mailto:${contact.email}`}>
            Get in touch
          </a>
        )}
        <button className={styles.btnGhost} onClick={onDownload}>
          Download résumé
        </button>
      </div>
    </header>
  );
}

function About({ bio }) {
  if (!bio || !bio.length) return null;
  // bio is an array of lines; blank strings separate paragraphs.
  const paragraphs = bio
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
  return (
    <Section id="about" label="01 — About" title="Who I am">
      <div className={styles.prose}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}

function Skills({ skills }) {
  const groups = Object.entries(skills || {});
  const names = groups.map(([group]) => group);
  const [active, setActive] = useState(names[0]);
  // Keep the active group valid if the data changes underneath (admin edits).
  useEffect(() => {
    if (names.length && !names.includes(active)) setActive(names[0]);
  }, [names.join("|"), active]);

  if (!groups.length) return null;

  const shown =
    groups.find(([group]) => group === active) ?? groups[0];
  const [, shownItems] = shown;

  return (
    <Section id="skills" label="02 — Skills" title="What I work with">
      {names.length > 1 && (
        <div className={styles.skillFilter}>
          <RubberSegment
            items={names}
            value={active}
            onChange={setActive}
            aria-label="Filter skills by group"
            trackColor="var(--bg-2)"
            thumbColor="var(--amber)"
            textColor="var(--ink)"
            activeTextColor="var(--cta-fg)"
            radius={4}
            inset={3}
          />
        </div>
      )}
      <ul className={styles.tagList}>
        {(shownItems || []).map((s) => (
          <li key={s.name} className={styles.tag}>
            {s.name}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Projects({ projects }) {
  if (!projects || !projects.length) return null;
  return (
    <Section id="projects" label="03 — Projects" title="Things I've built">
      <div className={styles.cardGrid}>
        {projects.map((p) => {
          const href = p.url
            ? p.url.startsWith("http")
              ? p.url
              : `https://${p.url}`
            : null;
          const Card = href ? "a" : "div";
          return (
            <Card
              key={p.id || p.name}
              className={styles.card}
              {...(href
                ? { href, target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{p.name}</h3>
                {p.year && <span className={styles.cardYear}>{p.year}</span>}
              </div>
              {p.description && (
                <p className={styles.cardDesc}>{p.description}</p>
              )}
              {p.tech && p.tech.length > 0 && (
                <ul className={styles.tagList}>
                  {p.tech.map((t) => (
                    <li key={t} className={styles.tagSm}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function Experience({ companies }) {
  if (!companies || !companies.length) return null;
  return (
    <Section id="experience" label="04 — Experience" title="Where I've worked">
      <ol className={styles.timeline}>
        {companies.map((c) => (
          <li key={c.id || c.company} className={styles.timelineItem}>
            <div className={styles.timelineHead}>
              <h3 className={styles.roleTitle}>
                {c.role} <span className={styles.at}>@ {c.company}</span>
              </h3>
              {c.period && <span className={styles.period}>{c.period}</span>}
            </div>
            {c.location && <p className={styles.jobMeta}>{c.location}</p>}
            {c.description && <p className={styles.jobDesc}>{c.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CurrentlyReading({ reading }) {
  if (!reading || !reading.book) return null;
  return (
    <Section id="reading" label="05 — Currently Reading" title="On my desk">
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <h3 className={styles.cardTitle}>{reading.book}</h3>
        </div>
        {reading.author && (
          <p className={styles.cardYear}>by {reading.author}</p>
        )}
        {reading.note && <p className={styles.cardDesc}>{reading.note}</p>}
      </div>
    </Section>
  );
}

function Contact({ contact }) {
  const links = [
    contact.email && { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.github && { label: "GitHub", value: contact.github, href: `https://${contact.github.replace(/^https?:\/\//, "")}` },
    contact.linkedin && { label: "LinkedIn", value: contact.linkedin, href: `https://${contact.linkedin.replace(/^https?:\/\//, "")}` },
    contact.twitter && { label: "Twitter / X", value: contact.twitter, href: `https://x.com/${contact.twitter.replace(/^@/, "")}` },
    contact.website && { label: "Website", value: contact.website, href: `https://${contact.website.replace(/^https?:\/\//, "")}` },
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <Section id="contact" label="06 — Contact" title="Let's talk">
      <ul className={styles.contactList}>
        {links.map((l) => (
          <li key={l.label}>
            <span className={styles.contactLabel}>{l.label}</span>
            <a
              className={styles.contactValue}
              href={l.href}
              target={l.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {l.value}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function App() {
  const route = usePathRoute();
  const { theme, toggle: toggleTheme } = useTheme();
  const p = usePortfolio();

  const closeAdmin = useCallback(() => navigate("/"), []);
  const onDownload = useCallback(() => downloadResume(p), [p]);

  if (route === "/admin") {
    return <AdminGate onClose={closeAdmin} />;
  }

  return (
    <div className={styles.app} id="top">
      <Nav theme={theme} onToggleTheme={toggleTheme} />

      <main className={styles.main}>
        <Hero profile={p.profile} contact={p.contact} onDownload={onDownload} />
        <About bio={p.profile.bio} />
        <Skills skills={p.skills} />
        <Projects projects={p.projects} />
        <Experience companies={p.companies} />
        <CurrentlyReading reading={p.reading} />
        <Contact contact={p.contact} />
      </main>

      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} {p.profile.name}
        </span>
        <a className={styles.adminLink} href="/admin" onClick={(e) => { e.preventDefault(); navigate("/admin"); }}>
          admin
        </a>
      </footer>
    </div>
  );
}
