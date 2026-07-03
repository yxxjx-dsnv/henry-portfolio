import { useState } from 'react';

// One quiet line that knows what time it is — and, some days, a line
// worth keeping, with its author off to the right.
const QUOTES: [string, string][] = [
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', 'Antoine de Saint-Exupéry'],
  ['Good design is as little design as possible.', 'Dieter Rams'],
  ['Stay hungry, stay foolish.', 'Steve Jobs'],
  ['The details are not the details. They make the design.', 'Charles Eames'],
  ['What I cannot create, I do not understand.', 'Richard Feynman'],
  ['Make it simple, but significant.', 'Don Draper'],
  ['Everything should be made as simple as possible, but not simpler.', 'Albert Einstein'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Design is not just what it looks like. Design is how it works.', 'Steve Jobs'],
  ['It is not the mountain we conquer, but ourselves.', 'Edmund Hillary'],
  ['Well begun is half done.', 'Aristotle'],
  ['I have not failed. I’ve just found 10,000 ways that won’t work.', 'Thomas Edison'],
  ['The noblest pleasure is the joy of understanding.', 'Leonardo da Vinci'],
  ['Whether you think you can, or you think you can’t — you’re right.', 'Henry Ford'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
  ['Less, but better.', 'Dieter Rams'],
  ['An expert is a person who has made all the mistakes that can be made in a very narrow field.', 'Niels Bohr'],
  ['The journey of a thousand miles begins with a single step.', 'Lao Tzu'],
  ['Creativity is intelligence having fun.', 'Albert Einstein'],
];

export function Greeting() {
  const h = new Date().getHours();
  const text =
    h >= 5 && h < 12
      ? 'Good morning.'
      : h >= 12 && h < 18
        ? 'Good afternoon.'
        : h >= 18 && h < 23
          ? 'Good evening.'
          : 'Up late? Me too, probably.';

  // some visits carry the day's line — same quote all day, not every visit
  const [showQuote] = useState(() => Math.random() < 0.45);
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const [quote, author] = QUOTES[dayIndex % QUOTES.length];

  return (
    <>
      <p className="hero-greeting">{text}</p>
      {showQuote && (
        <p className="hero-quote">
          <em>“{quote}”</em>
          <span className="hero-quote-author">— {author}</span>
        </p>
      )}
    </>
  );
}
