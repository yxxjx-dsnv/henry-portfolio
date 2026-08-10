import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useDisclosureRow } from '../hooks/useDisclosureRow';
import { durationLabel } from '../utils/duration';
import type { Activity } from '../types';

export function ActivityItem({ item }: { item: Activity }) {
  const { prefix, link, suffix, date, detail, slug, logo } = item;
  const { rowProps, detailId, pinned } = useDisclosureRow(!!detail && detail.length > 0);
  return (
    <div className={`activity-item${pinned ? ' is-open' : ''}`} {...rowProps}>
      <p>
        {slug ? <Link to={`/extra-curricular/${slug}`}>{prefix}</Link> : prefix}
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
          {date}
          {durationLabel(date) && <span className="date-rel"> · {durationLabel(date)}</span>}
        </p>
      </div>
      {detail && detail.length > 0 && (
        <div className="detail-wrap" id={detailId}>
          <div className="detail-box">
            {logo && <img className="activity-logo" src={logo} alt="" loading="lazy" />}
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
