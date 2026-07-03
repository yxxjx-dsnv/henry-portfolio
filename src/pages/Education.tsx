import { Hero } from '../components/Hero';
import { education } from '../data/education';
import { profile } from '../data/profile';

export function Education() {
  return (
    <section className="section">
      <Hero title="Education" subtitle={`last updated: ${profile.lastUpdated.education}`} />
      <section className="extra-curricular-section">
        <div className="text">
          {education.map((group, i) => (
            <div className="activity-item edu-group" key={i}>
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
                    <div className="edu-entry" key={j}>
                      <div className="edu-entry-head">
                        <p>{entry.program}</p>
                        <span className="edu-term">{entry.date}</span>
                      </div>
                      {entry.term && (
                        <div className="date">
                          <p>{entry.term}</p>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
