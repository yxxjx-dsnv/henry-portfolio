import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { CLab } from '../components/CLab';
import { aps105Labs } from '../data/aps105Labs';
import { useLang } from '../i18n';

// APS105 coding labs, each with its C submission running in an in-page IDE.
// A full C compiler (clang, built to WebAssembly) runs client-side, so the
// code compiles and executes here with no server.
export function Aps105Labs() {
  const { t } = useLang();
  const [labId, setLabId] = useState(aps105Labs[0].id);
  const lab = aps105Labs.find((l) => l.id === labId) ?? aps105Labs[0];
  const [progId, setProgId] = useState(lab.programs[0].id);
  const program = lab.programs.find((p) => p.id === progId) ?? lab.programs[0];

  const selectLab = (id: string) => {
    const next = aps105Labs.find((l) => l.id === id) ?? aps105Labs[0];
    setLabId(next.id);
    setProgId(next.programs[0].id);
  };

  return (
    <section className="section">
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="APS105 — Coding Labs" subtitle="Introduction to Programming (C) · weekly labs" />
      <section className="essay-section">
        <div className="text">
          <div className="section-body">
            <p>{t("APS105 is U of T Engineering's introduction to programming, taught in C. Every week had a lab. This page has the code I submitted for each one, running in your browser. Edit any of it and press Run, and it is compiled and executed on the page. A full C compiler (clang, built to WebAssembly) runs client-side, so there is no server. The first Run downloads the compiler once (about 40 MB, then cached); after that it is instant. Press Reset to put my original code back.")}</p>

            <div className="labs-nav" role="tablist" aria-label="Labs">
              {aps105Labs.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="tab"
                  aria-selected={l.id === labId}
                  className={`labs-chip${l.id === labId ? ' is-active' : ''}`}
                  onClick={() => selectLab(l.id)}
                >
                  {l.title.replace(/\s+—.*/, '')}
                </button>
              ))}
            </div>

            <h2 className="labs-title">{lab.title}</h2>
            <p className="labs-objective">{t(lab.objective)}</p>

            {(lab.task || lab.approach) && (
              <div className="labs-writeup">
                {lab.task && (
                  <>
                    <p className="labs-wu-head">The task</p>
                    <p className="labs-wu-body">{t(lab.task)}</p>
                  </>
                )}
                {lab.approach && (
                  <>
                    <p className="labs-wu-head">My approach</p>
                    <p className="labs-wu-body">{t(lab.approach)}</p>
                  </>
                )}
              </div>
            )}

            {lab.programs.length > 1 && (
              <div className="labs-progtabs" role="tablist" aria-label={`${lab.title} programs`}>
                {lab.programs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={p.id === progId}
                    className={`labs-progtab${p.id === progId ? ' is-active' : ''}`}
                    onClick={() => setProgId(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            <CLab key={program.id} program={program} />
          </div>
        </div>
      </section>
    </section>
  );
}
