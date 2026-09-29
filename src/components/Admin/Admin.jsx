import React, { useState } from "react";
import {
  loadPortfolio,
  savePortfolio,
  resetPortfolio,
  DEFAULT_PORTFOLIO,
} from "../../data/portfolio";
import styles from "./Admin.module.css";

// ── shape converters (data <-> editable form state) ──
// skills are stored as { GroupName: [{name, level}] } but edited as an
// ordered array so groups can be renamed / reordered / added.
function skillsToForm(skills) {
  return Object.entries(skills).map(([group, items]) => ({
    group,
    items: items.map((i) => ({ ...i })),
  }));
}
function formToSkills(groups) {
  const out = {};
  for (const g of groups) {
    if (!g.group.trim()) continue;
    out[g.group.trim()] = g.items.map((i) => ({
      name: i.name,
      level: Number(i.level) || 0,
    }));
  }
  return out;
}

const uid = (prefix) =>
  `${prefix}-${Math.floor(performance.now())}-${Math.floor(Math.random() * 1e4)}`;

export default function Admin({ onClose, onLogout }) {
  const [data, setData] = useState(loadPortfolio);
  const [skillGroups, setSkillGroups] = useState(() => skillsToForm(loadPortfolio().skills));
  const [toast, setToast] = useState("");

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  // ── generic setters ──
  const setProfile = (key, val) =>
    setData((d) => ({ ...d, profile: { ...d.profile, [key]: val } }));
  const setContact = (key, val) =>
    setData((d) => ({ ...d, contact: { ...d.contact, [key]: val } }));
  const setReading = (key, val) =>
    setData((d) => ({ ...d, reading: { ...d.reading, [key]: val } }));

  const updateItem = (section, idx, key, val) =>
    setData((d) => ({
      ...d,
      [section]: d[section].map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    }));
  const removeItem = (section, idx) =>
    setData((d) => ({ ...d, [section]: d[section].filter((_, i) => i !== idx) }));

  const addProject = () =>
    setData((d) => ({
      ...d,
      projects: [
        ...d.projects,
        { id: uid("proj"), name: "new-project", year: "2025", description: "", tech: [], url: "" },
      ],
    }));
  const addCompany = () =>
    setData((d) => ({
      ...d,
      companies: [
        ...d.companies,
        { id: uid("co"), company: "New Company", role: "", period: "", location: "", description: "" },
      ],
    }));

  // ── skills editing ──
  const setSkill = (gi, si, key, val) =>
    setSkillGroups((gs) =>
      gs.map((g, i) =>
        i !== gi ? g : { ...g, items: g.items.map((it, j) => (j === si ? { ...it, [key]: val } : it)) }
      )
    );
  const addSkill = (gi) =>
    setSkillGroups((gs) =>
      gs.map((g, i) => (i !== gi ? g : { ...g, items: [...g.items, { name: "", level: 50 }] }))
    );
  const removeSkill = (gi, si) =>
    setSkillGroups((gs) =>
      gs.map((g, i) => (i !== gi ? g : { ...g, items: g.items.filter((_, j) => j !== si) }))
    );
  const setGroupName = (gi, name) =>
    setSkillGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, group: name } : g)));
  const addGroup = () => setSkillGroups((gs) => [...gs, { group: "New Group", items: [] }]);
  const removeGroup = (gi) => setSkillGroups((gs) => gs.filter((_, i) => i !== gi));

  // ── actions ──
  const collect = () => ({ ...data, skills: formToSkills(skillGroups) });

  const handleSave = () => {
    savePortfolio(collect());
    flash("Saved. Changes are live in the terminal.");
  };

  const handleReset = () => {
    if (!confirm("Discard all edits and restore the default portfolio?")) return;
    resetPortfolio();
    const fresh = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO));
    setData(fresh);
    setSkillGroups(skillsToForm(fresh.skills));
    flash("Restored defaults.");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(collect(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setData(parsed);
        setSkillGroups(skillsToForm(parsed.skills || {}));
        flash("Imported. Review, then click Save.");
      } catch {
        flash("Import failed: invalid JSON.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className={styles.admin}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Portfolio Admin</h1>
          <p className={styles.sub}>Edit your content. Save writes to this browser; Export to commit permanently.</p>
        </div>
        <div className={styles.headerBtns}>
          <label className={styles.ghost}>
            Import
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
          <button className={styles.ghost} onClick={handleExport}>Export</button>
          <button className={styles.danger} onClick={handleReset}>Reset</button>
          <button className={styles.primary} onClick={handleSave}>Save</button>
          <button className={styles.ghost} onClick={onClose}>← Back to site</button>
          {onLogout && <button className={styles.danger} onClick={onLogout}>Log out</button>}
        </div>
      </header>

      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.grid}>
        {/* Profile */}
        <section className={styles.card}>
          <h2 className={styles.h2}>Profile</h2>
          <div className={styles.row2}>
            <Field label="User" value={data.profile.user} onChange={(v) => setProfile("user", v)} />
            <Field label="Host" value={data.profile.host} onChange={(v) => setProfile("host", v)} />
          </div>
          <div className={styles.row2}>
            <Field label="Name" value={data.profile.name} onChange={(v) => setProfile("name", v)} />
            <Field label="Shell" value={data.profile.shell} onChange={(v) => setProfile("shell", v)} />
          </div>
          <Field label="Title" value={data.profile.title} onChange={(v) => setProfile("title", v)} />
          <Field label="Location" value={data.profile.location} onChange={(v) => setProfile("location", v)} />
          <Field label="Tagline" value={data.profile.tagline} onChange={(v) => setProfile("tagline", v)} />
          <label className={styles.label}>Bio (one line per row)</label>
          <textarea
            className={styles.textarea}
            rows={5}
            value={data.profile.bio.join("\n")}
            onChange={(e) => setProfile("bio", e.target.value.split("\n"))}
          />
        </section>

        {/* Contact */}
        <section className={styles.card}>
          <h2 className={styles.h2}>Contact</h2>
          {Object.keys(data.contact).map((key) => (
            <Field
              key={key}
              label={key}
              value={data.contact[key]}
              onChange={(v) => setContact(key, v)}
            />
          ))}
        </section>

        {/* Currently Reading */}
        <section className={styles.card}>
          <h2 className={styles.h2}>Currently Reading</h2>
          <Field label="Book" value={data.reading?.book} onChange={(v) => setReading("book", v)} />
          <Field label="Author" value={data.reading?.author} onChange={(v) => setReading("author", v)} />
          <Field label="Note (optional)" value={data.reading?.note} onChange={(v) => setReading("note", v)} />
        </section>

        {/* Skills */}
        <section className={`${styles.card} ${styles.span2}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Skills</h2>
            <button className={styles.add} onClick={addGroup}>+ group</button>
          </div>
          {skillGroups.map((g, gi) => (
            <div key={gi} className={styles.skillGroup}>
              <div className={styles.skillGroupHead}>
                <input
                  className={styles.groupInput}
                  value={g.group}
                  onChange={(e) => setGroupName(gi, e.target.value)}
                />
                <button className={styles.remove} onClick={() => removeGroup(gi)}>remove group</button>
              </div>
              {g.items.map((s, si) => (
                <div key={si} className={styles.skillRow}>
                  <input
                    className={styles.input}
                    placeholder="skill"
                    value={s.name}
                    onChange={(e) => setSkill(gi, si, "name", e.target.value)}
                  />
                  <input
                    className={styles.range}
                    type="range"
                    min="0"
                    max="100"
                    value={s.level}
                    onChange={(e) => setSkill(gi, si, "level", Number(e.target.value))}
                  />
                  <span className={styles.pct}>{s.level}%</span>
                  <button className={styles.remove} onClick={() => removeSkill(gi, si)}>×</button>
                </div>
              ))}
              <button className={styles.add} onClick={() => addSkill(gi)}>+ skill</button>
            </div>
          ))}
        </section>

        {/* Projects */}
        <section className={`${styles.card} ${styles.span2}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Projects</h2>
            <button className={styles.add} onClick={addProject}>+ project</button>
          </div>
          {data.projects.map((proj, i) => (
            <div key={proj.id || i} className={styles.entry}>
              <div className={styles.row2}>
                <Field label="Name" value={proj.name} onChange={(v) => updateItem("projects", i, "name", v)} />
                <Field label="Year" value={proj.year} onChange={(v) => updateItem("projects", i, "year", v)} />
              </div>
              <Field label="Description" value={proj.description} onChange={(v) => updateItem("projects", i, "description", v)} />
              <div className={styles.row2}>
                <Field
                  label="Tech (comma separated)"
                  value={Array.isArray(proj.tech) ? proj.tech.join(", ") : proj.tech}
                  onChange={(v) => updateItem("projects", i, "tech", v.split(",").map((t) => t.trim()).filter(Boolean))}
                />
                <Field label="URL" value={proj.url} onChange={(v) => updateItem("projects", i, "url", v)} />
              </div>
              <button className={styles.remove} onClick={() => removeItem("projects", i)}>Delete project</button>
            </div>
          ))}
        </section>

        {/* Companies */}
        <section className={`${styles.card} ${styles.span2}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Experience / Companies</h2>
            <button className={styles.add} onClick={addCompany}>+ company</button>
          </div>
          {data.companies.map((c, i) => (
            <div key={c.id || i} className={styles.entry}>
              <div className={styles.row2}>
                <Field label="Company" value={c.company} onChange={(v) => updateItem("companies", i, "company", v)} />
                <Field label="Role" value={c.role} onChange={(v) => updateItem("companies", i, "role", v)} />
              </div>
              <div className={styles.row2}>
                <Field label="Period" value={c.period} onChange={(v) => updateItem("companies", i, "period", v)} />
                <Field label="Location" value={c.location} onChange={(v) => updateItem("companies", i, "location", v)} />
              </div>
              <Field label="Description" value={c.description} onChange={(v) => updateItem("companies", i, "description", v)} />
              <button className={styles.remove} onClick={() => removeItem("companies", i)}>Delete company</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
