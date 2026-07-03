// One quiet line that knows what time it is for the visitor.
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
  return <p className="hero-greeting">{text}</p>;
}
