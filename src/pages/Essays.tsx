import { Hero } from '../components/Hero';
import { profile } from '../data/profile';

export function Essays() {
  return (
    <section className="section">
      <Hero title="Learnings from past three years" subtitle={`written: ${profile.lastUpdated.essays}`} />
      <section className="essay-section">
        <div className="text">
          <div className="section-title">
            <p>
              Prompt: Discuss an accomplishment, event, or realization that sparked a period of personal
              growth and a new understanding of yourself or others.
            </p>
            <br />
          </div>
          <div className="section-body">
            <p>
              In August 2022, I stood alone at Incheon International Airport, poised to board a flight to
              Canada. It was a leap into the unknown. As the plane climbed, Neil Armstrong's words
              resonated in my brain: "That's one small step for a man, one giant leap for mankind." For
              me, this flight symbolized more than just changing my address. It was a transforming start,
              an opportunity to grow and reshape my future.
            </p>
            <br />
            <p>
              My first few days in Canada were a whirlwind of challenges. Taking classes in a foreign
              language, adjusting to new cultures, and living independently challenged me in ways I never
              imagined. Despite this whirlwind, I saw an opportunity to stretch beyond my comfort zone and
              get closer to my goals. Being an entrepreneur in a global marketplace, a vision I've long
              had, necessitated resilience and leadership. When I joined Unity 4 Charity (U4C), a
              non-profit that supports climate refugees and Indigenous communities, I recognized an
              opportunity to cultivate these traits.
            </p>
            <br />
            <p>
              At the time, U4C was bursting with enthusiasm but lacked structure. Meetings floundered
              without a clear direction, roles were unclear, and progress was slow. Where others saw
              chaos, I saw possibilities. I set out on the ambitious mission of converting the
              organization into an efficient, goal-driven institution fuelled by my optimism.
            </p>
            <br />
            <p>
              I began by examining the personnel management systems of global leaders such as Apple and
              Amazon, which prompted a thorough structural redesign. U4C was reorganized into four
              departments: planning and development, communications and media, operations and
              administration, and volunteer services. Each department was assigned specific duties that
              were unified by the goal of obtaining official non-profit certification. Over several
              months, I interviewed 40 members to determine their skills and placed them in places where
              they could thrive.
            </p>
            <br />
            <p>
              Our first significant challenge took the form of a fundraising effort. Each department met
              weekly to prepare: the Planning team researched and designed things to sell, Communications
              created engaging promotional materials, Operations secured event sites, and Volunteer
              Service trained members to interact with the public. The campaign's success exceeded all
              expectations, paving the way for future efforts. U4C acquired non-profit status in British
              Columbia in November 2023, demonstrating all members' commitment.
            </p>
            <br />
            <p>
              This adventure showed me that leadership is about empowerment, not control. Leadership
              brings people together under a shared vision, creating an atmosphere to ignite innovation.
              However, the most important lesson was not about systems or strategies; resilience is the
              ability to turn setbacks into opportunities and persevere toward a goal.
            </p>
            <br />
            <p>
              Throughout the campaign, we encountered obstacles that tested us. Creative solutions were
              needed to capture public interest, and moments of discord required careful mediation to
              align perspectives. These problems served as growth opportunities for both me and the
              organization. I learned how to navigate the complexities of team interactions while
              remaining focused on the broader picture.
            </p>
            <br />
            <p>
              The experience with U4C was revolutionary. It taught me the value of collaboration and
              balancing individual potential with a larger objective. Designing systems to increase
              organizational efficiency while nurturing passion and creativity became a pillar of my
              leadership. Furthermore, I gained the confidence to lead in uncertain, high-pressure
              situations.
            </p>
            <br />
            <p>
              Reflecting on this voyage, I reimagined how uncertain I felt as I boarded that plane to
              Canada. Back then, I feared the unknown, unsure of my readiness. But now I realize that
              challenges are not obstacles; they are opportunities to improve. Failures do not mark the
              end; rather, they serve as stepping stones to achievement. Each tiny action performed with
              intent builds the basis for something greater.
            </p>
            <br />
            <p>
              As I prepare to embark on the next stage in college, I carry the lessons learned from this
              experience. The fortitude to face uncertainty, the ingenuity to solve difficulties, and the
              determination to bring people together behind a common vision will guide me. Just as that
              flight to Canada marked the beginning, I am ready to take another leap, understanding that
              the journey begins with a single step.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
