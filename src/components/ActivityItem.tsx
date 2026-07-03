import { Fragment } from 'react';
import { durationLabel } from '../utils/duration';
import type { ResumeLine } from '../types';

export function ActivityItem({ item }: { item: ResumeLine }) {
  const { prefix, link, suffix, date, detail } = item;
  return (
    <div className="activity-item" tabIndex={detail && detail.length > 0 ? 0 : undefined}>
      <p>
        {prefix}
        {link &&
          (link.url ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ) : (
            <a target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        {suffix}
      </p>
      <div className="date">
        <p>
          <span className="date-abs">{date}</span>
          {durationLabel(date) && <span className="date-rel">{durationLabel(date)}</span>}
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
