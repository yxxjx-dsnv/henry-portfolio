import { Hero } from '../components/Hero';
import { ProjectItem } from '../components/ProjectItem';
import { projects } from '../data/projects';
import { profile } from '../data/profile';

export function Projects() {
  return (
    <section className="section">
      <Hero title="Projects" subtitle={`last updated: ${profile.lastUpdated.projects}`} />
      {/* Reuses .extra-curricular-section so the dot-timeline matches the rest of the site. */}
      <section className="extra-curricular-section">
        <div className="text">
          {projects.map((project, i) => (
            <ProjectItem key={i} project={project} />
          ))}
        </div>
      </section>
    </section>
  );
}
