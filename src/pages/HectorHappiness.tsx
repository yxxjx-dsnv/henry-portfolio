import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { useLang } from '../i18n';

// handwriting, loaded only for this page: Caveat, and Nanum Pen Script for Hangul
const HAND_FONTS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Nanum+Pen+Script&display=swap';
// The book in each language's edition: the Korean one I read (오래된미래, 2004) and the
// English (Penguin, 2010); covers from aladin.co.kr. No image of the English back cover is to be had, so its back
// is a plain one with the title.
const EDITIONS = {
  ko: {
    front: '/media/hector/cover-ko.jpg',
    back: '/media/hector/back-ko.jpg' as string | null,
    title: '꾸뻬 씨의 행복 여행',
    by: '프랑수아 를로르',
    pub: '오래된미래',
    meta: '작가 프랑수아 를로르 | 출판 오래된미래 | 발매 2004.07.28',
  },
  en: {
    front: '/media/hector/cover-en.jpg',
    back: null as string | null,
    title: 'Hector and the Search for Happiness',
    by: 'François Lelord',
    pub: 'Penguin',
    meta: 'François Lelord · Penguin Books · 2010',
  },
};

// Hector's lessons from François Lelord's book, each language in its own edition's
// words. The two editions number them differently (the English keeps lesson 8's
// happiness and unhappiness in one line and has "not knowing the whole story"; the
// Korean splits 8 in two and leaves that one out), so each shows its own list as printed.
const LESSONS = {
  en: [
    ['1', 'Making comparisons can spoil your happiness.'],
    ['2', 'Happiness often comes when least expected.'],
    ['3', 'Many people only see happiness in their future.'],
    ['4', 'Many people think happiness comes from having more power or more money.'],
    ['5', 'Sometimes happiness is not knowing the whole story.'],
    ['6', 'Happiness is a long walk in beautiful, unfamiliar mountains.'],
    ['7', 'It’s a mistake to think that happiness is the goal.'],
    ['8', 'Happiness is being with the people you love; unhappiness is being separated from the people you love.'],
    ['9', 'Happiness is knowing that your family lacks for nothing.'],
    ['10', 'Happiness is doing a job you love.'],
    ['11', 'Happiness is having a home and a garden of your own.'],
    ['12', 'It’s harder to be happy in a country run by bad people.'],
    ['13', 'Happiness is feeling useful to others.'],
    ['14', 'Happiness is to be loved for exactly who you are. (People are kinder to a child who smiles.)'],
    ['15', 'Happiness comes when you feel truly alive.'],
    ['16', 'Happiness is knowing how to celebrate.'],
    ['17', 'Happiness is caring about the happiness of those you love.'],
    ['18', 'Happiness is not attaching too much importance to what other people think.'],
    ['19', 'The sun and the sea make everybody happy.'],
    ['20', 'Happiness is a certain way of seeing things.'],
    ['21', 'Rivalry poisons happiness.'],
    ['22', 'Women care more than men about making others happy.'],
    ['23', 'Happiness means making sure that those around you are happy.'],
  ],
  ko: [
    ['1', '행복의 첫 번째 비밀은 자신을 다른 사람과 비교하지 않는 것이다.'],
    ['2', '행복은 때때로 뜻밖에 찾아온다.'],
    ['3', '많은 사람들은 자신의 행복이 오직 미래에만 있다고 생각한다.'],
    ['4', '많은 사람들은 더 큰 부자가 되고, 더 중요한 사람이 되는 것이 행복이라고 생각한다.'],
    ['5', '행복은 알려지지 않은 아름다운 산속을 걷는 것이다.'],
    ['6', '행복을 목표로 여기는 것은 잘못된 생각이다.'],
    ['7', '행복은 좋아하는 사람과 함께 있는 것이다.'],
    ['8', '불행은 사랑하는 사람과 헤어지는 것이다.'],
    ['9', '행복은 자기 가족에게 아무것도 부족한 것이 없음을 아는 것이다.'],
    ['10', '행복은 자신이 좋아하는 일을 하는 것이다.'],
    ['11', '행복은 집과 채소밭을 갖는 것이다.'],
    ['12', '좋지 않은 사람에 의해 통치되는 나라에서는 행복한 삶을 살기가 더욱 어렵다.'],
    ['13', '행복은 자신이 다른 사람들에게 쓸모가 있다고 느끼는 것이다.'],
    ['14', '행복이란 있는 그대로의 모습으로 사랑받는 것이다.'],
    ['15', '행복은 살아 있음을 느끼는 것이다.'],
    ['16', '행복은 살아 있음을 축하하는 파티를 여는 것이다.'],
    ['17', '행복은 사랑하는 사람의 행복을 생각하는 것이다.'],
    ['18', '태양과 바다, 이것은 모든 사람들에게 행복을 가져다 준다.'],
    ['19', '행복은 다른 사람의 의견을 너무 중요하게 생각하지 않는 것이다.'],
    ['20', '행복은 사물을 바라보는 방식에 달려 있다.'],
    ['21', '행복의 가장 큰 적은 경쟁심이다.'],
    ['22', '여성은 남성보다 다른 사람의 행복에 대해서 더 배려할 줄 안다.'],
    ['23', '행복은 다른 사람의 행복에 관심을 갖는 것이다.'],
  ],
};

export function HectorHappiness() {
  const { lang, t } = useLang();
  const [back, setBack] = useState(false); // the book turned over to its back cover
  const book = EDITIONS[lang];
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  useEffect(() => {
    if (document.getElementById('hand-fonts')) return;
    const link = Object.assign(document.createElement('link'), { id: 'hand-fonts', rel: 'stylesheet', href: HAND_FONTS });
    document.head.appendChild(link);
  }, []);
  return (
    <section className="section">
      <Link to="/writing" className="story-back">
        &larr; All writing
      </Link>
      <Hero title={t('Hector and the Search for Happiness')} subtitle="written: 2026/11/18" />
      <section className="essay-section">
        <div className="text">
          <div
            className="section-body hand"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            {/* the book, after aladin.co.kr: hover and it turns to show its spine; click and it turns over */}
            <figure className="hand-book">
              <button
                type="button"
                className={`book3d${back ? ' is-back' : ''}`}
                aria-pressed={back}
                aria-label={t('Hector and the Search for Happiness')}
                onClick={() => setBack((b) => !b)}
              >
                <div className="book3d-inner">
                  <img className="book3d-front" src={book.front} alt="" width={200} height={275} />
                  {book.back ? (
                    <img className="book3d-back" src={book.back} alt="" width={200} height={275} />
                  ) : (
                    <div className="book3d-back is-plain" aria-hidden="true">
                      <span>{book.title}</span>
                      <span>{book.by}</span>
                    </div>
                  )}
                  <div className={`book3d-spine is-${lang}`} aria-hidden="true">
                    <span className="book3d-title">{book.title}</span>
                    <span className="book3d-by">{book.by}</span>
                    <span className="book3d-pub">{book.pub}</span>
                  </div>
                </div>
              </button>
              <figcaption>
                <strong>{book.title}</strong>
                <span>{book.meta}</span>
              </figcaption>
            </figure>
            <ol>
              {LESSONS[lang].map(([n, l]) => (
                <li key={n}>
                  <span className="lesson-no">
                    {t('Lesson')} {n}
                  </span>
                  {l}
                </li>
              ))}
            </ol>
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
