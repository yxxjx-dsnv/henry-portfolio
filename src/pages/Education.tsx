import { Fragment } from 'react';
import { Hero } from '../components/Hero';
import { PdfDeck } from '../components/PdfDeck';
import { useDisclosureRow } from '../hooks/useDisclosureRow';
import { education } from '../data/education';
import { profile } from '../data/profile';
import type { EducationEntry } from '../types';
import { useLang } from '../i18n';

// A program row. When it has more to say (a lead line, courses, projects), it
// reveals a detail box on hover or focus — the same quiet disclosure the
// Projects and Extra-Curricular timelines use — so the list stays clean.
function EduEntry({ entry }: { entry: EducationEntry }) {
  const { t } = useLang();
  const hasDetail = !!entry.lead || !!entry.detail?.length || !!entry.projects;
  const { rowProps, detailId, pinned } = useDisclosureRow(hasDetail);
  return (
    <div className={`edu-entry${hasDetail ? ' edu-has-detail' : ''}${pinned ? ' is-open' : ''}`} {...rowProps}>
      <div className="edu-entry-head">
        <p>{entry.program}</p>
        <span className="edu-term">{entry.date}</span>
      </div>
      {entry.term && (
        <div className="date">
          <p>{entry.term}</p>
        </div>
      )}
      {hasDetail && (
        <div className="edu-reveal" id={detailId}>
          <div className="edu-reveal-inner">
            <div className="edu-reveal-box">
              {entry.lead && <p className="edu-lead">{entry.lead}</p>}
              {entry.detail?.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {entry.projects && <p className="edu-proj">{t(entry.projects)}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Education() {
  const { t } = useLang();
  return (
    <section className="section">
      <Hero title="Education" subtitle={`last updated: ${profile.lastUpdated.education}`} />
      <section className="extra-curricular-section">
        <div className="text">
          {education.map((group, i) => (
            <div
              className={`activity-item edu-group${group.docs?.length ? ' edu-has-docs' : ''}`}
              key={i}
            >
              <div className="edu-school-head">
                <p className="edu-school">
                  <a href={group.school.url} target="_blank" rel="noopener noreferrer">
                    {group.school.name}
                  </a>
                  {group.degree && <span className="edu-degree"> — {group.degree}</span>}
                </p>
                {group.years && <span className="edu-years">{group.years}</span>}
              </div>
              <div className="edu-entries">
                {group.entries.map((entry, j) =>
                  entry.muted ? (
                    <div className="edu-entry edu-break" key={j}>
                      <span className="edu-break-line">
                        {entry.program} · {entry.date}
                      </span>
                    </div>
                  ) : (
                    <EduEntry entry={entry} key={j} />
                  ),
                )}
              </div>
              {group.docs && group.docs.length > 0 && (
                <div className="edu-docs-reveal">
                  <div className="edu-docs-inner">
                    <div className="edu-docs-row">
                      {group.docs.map((d) => (
                        <div className="edu-doc" key={d.file}>
                          <p className="edu-doc-cap">
                            {d.title} <span>· {d.meta}</span>
                          </p>
                          <PdfDeck src={`/media/education/${d.file}`} title={d.title} />
                        </div>
                      ))}
                    </div>
                    <p className="doc-note">
                      {t('The student numbers and home address are redacted from the published copy.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="edu-logos" aria-label="School crests">
            {education
              .filter((g) => g.school.logo)
              .map((g, i) => (
                <Fragment key={g.school.name}>
                  {i > 0 && <span className="edu-logo-sep" aria-hidden="true" />}
                  <a
                    className={`edu-logo${g.school.roundLogo ? ' edu-logo-round' : ''}`}
                    href={g.school.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={g.school.name}
                  >
                    <img src={g.school.logo} alt={`${g.school.name} crest`} loading="lazy" />
                  </a>
                </Fragment>
              ))}
          </div>
        </div>
      </section>
    </section>
  );
}
