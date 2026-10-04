export default function Stars({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} จาก ${max} ดาว`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? '' : 'off'} aria-hidden="true">★</span>
      ))}
    </span>
  );
}
