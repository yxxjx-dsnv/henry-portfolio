import { useEffect } from 'react';

/** An old address whose page now lives on another site: go there, with a link in case. */
export function GoTo({ href }: { href: string }) {
  useEffect(() => window.location.replace(href), [href]);
  return (
    <section className="section">
      <p className="story-back">
        Moved to <a href={href}>{href.replace(/^https?:\/\//, '')}</a>
      </p>
    </section>
  );
}
