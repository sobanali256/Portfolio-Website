import { useEffect, useState } from 'react';

const format = (timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date());

// Current wall-clock time in the given zone, refreshed every 20s.
export default function LocalTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState(() => format(timeZone));
  useEffect(() => {
    const id = window.setInterval(() => setTime(format(timeZone)), 20_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return <time className="tabular">{time}</time>;
}
