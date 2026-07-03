import { Fragment } from 'react';
import { useCenterInView } from '../hooks/useCenterInView';
import type { Project } from '../types';

// Reuses the .activity-item dot-timeline styling for visual consistency with
// the Extra-Curricular / Education sections. Stack tags ride in the muted date line.
export function ProjectItem({ project }: { project: Project }) {
  const { name, date, stack, link, detail } = project;
  const meta = stack && stack.length > 0 ? `${date} · ${stack.join(', ')}` : date;
  const { ref, inView } = useCenterInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`activity-item${inView ? ' in-view' : ''}`} tabIndex={detail && detail.length > 0 ? 0 : undefined}>
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
        <p>{meta}</p>
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
