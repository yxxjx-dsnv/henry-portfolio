import { Fragment } from 'react';
import { durationLabel } from '../utils/duration';
import type { Project } from '../types';

// Reuses the .activity-item dot-timeline styling for visual consistency with
// the Extra-Curricular / Education sections. Stack tags ride in the muted date line.
export function ProjectItem({ project }: { project: Project }) {
  const { name, date, stack, link, detail } = project;
  const meta = stack && stack.length > 0 ? `${date} · ${stack.join(', ')}` : date;
  return (
    <div className="activity-item" tabIndex={detail && detail.length > 0 ? 0 : undefined}>
      <p>
        {name}
        {link && (
          <>
            {' — '}
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </>
        )}
      </p>
      <div className="date">
        <p>
          {meta}
          {durationLabel(date) && <span className="date-rel"> · {durationLabel(date)}</span>}
        </p>
      </div>
      {detail && detail.length > 0 && (
        <div className="detail-wrap">
          <div className="detail-box">
            {detail.map((para, i) => (
              <Fragment key={i}>
                <p>{para}</p>
                {i < detail.length - 1 && <br />}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
