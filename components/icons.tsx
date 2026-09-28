/* One stroke icon set, 16px grid, currentColor. */
import type { ReactNode } from "react";

function svg(d: ReactNode, w = 14) {
  const Icon = () => (
    <svg className="i" viewBox="0 0 16 16" width={w} height={w} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
  return Icon;
}
const dot = (cx: number, cy: number, r = 0.4) => <circle cx={cx} cy={cy} r={r} fill="currentColor" />;

export const I = {
  up: svg(<path d="M8 10.5V2.8M4.8 6 8 2.8 11.2 6M2.8 10.5v1.7c0 .6.5 1 1 1h8.4c.5 0 1-.4 1-1v-1.7" />),
  ok: svg(<path d="M3.5 8.4 6.6 11.3 12.5 4.9" />),
  alert: svg(<><path d="M8 4.2v4.6" />{dot(8, 11.6)}</>),
  info: svg(<><path d="M8 7.2v4.4" />{dot(8, 4.6)}</>),
  ask: svg(<><path d="M5.9 5.9a2.1 2.1 0 1 1 3 1.9c-.6.3-.9.8-.9 1.4v.4" />{dot(8, 12)}</>),
  clock: svg(<><circle cx="8" cy="8" r="5.4" /><path d="M8 5v3.2l2 1.3" /></>),
  home: svg(<path d="M2.8 7.2 8 2.8l5.2 4.4v5.6c0 .5-.4.9-.9.9H9.8V9.6H6.2v4.1H3.7c-.5 0-.9-.4-.9-.9z" />),
  list: svg(<><rect x="2.5" y="2.5" width="11" height="11" rx="2" /><path d="M5.3 6h5.4M5.3 8.5h5.4M5.3 11h3.2" /></>),
  plus: svg(<path d="M8 3.2v9.6M3.2 8h9.6" />),
  org: svg(<path d="M3 13.5V3.8c0-.5.4-.8.8-.8h5.4c.4 0 .8.3.8.8v9.7M10 6.5h2.2c.4 0 .8.3.8.8v6.2M1.8 13.5h12.4M5.3 5.6h2.4M5.3 8.1h2.4M5.3 10.6h2.4" />),
  gauge: svg(<><path d="M2.6 11.4a5.6 5.6 0 1 1 10.8 0" /><path d="M8 9.6l2.6-3" />{dot(8, 9.8, 0.9)}</>),
  theme: svg(<><circle cx="8" cy="8" r="5.4" /><path d="M8 2.6v10.8a5.4 5.4 0 0 0 0-10.8z" fill="currentColor" /></>),
  file: svg(<><path d="M4 2.5h5l3 3v7.2c0 .5-.4.8-.8.8H4c-.4 0-.8-.3-.8-.8V3.3c0-.4.4-.8.8-.8z" /><path d="M9 2.5v3h3" /></>),
  chat: svg(<path d="M3 4.2c0-.7.6-1.2 1.2-1.2h7.6c.7 0 1.2.5 1.2 1.2v5.4c0 .7-.5 1.2-1.2 1.2H7l-2.8 2.2v-2.2H4.2c-.6 0-1.2-.5-1.2-1.2z" />, 12),
  folder: svg(<path d="M2.5 4.6c0-.6.5-1.1 1.1-1.1h2.8l1.4 1.5h4.6c.6 0 1.1.5 1.1 1.1v5.8c0 .6-.5 1.1-1.1 1.1H3.6c-.6 0-1.1-.5-1.1-1.1z" />),
  down: svg(<path d="M8 2.8v7.7M4.8 7.3 8 10.5l3.2-3.2M2.8 13.2h10.4" />),
  pen: svg(<><path d="M10.6 3.2l2.2 2.2-7.3 7.3-2.9.7.7-2.9z" /><path d="M9.4 4.4l2.2 2.2" /></>, 12),
  at: svg(<><circle cx="8" cy="8" r="2.4" /><path d="M10.4 8v.9c0 1 .8 1.8 1.8 1.8s1.5-.9 1.5-2.4A5.7 5.7 0 1 0 11 12.7" /></>, 12),
  okc: svg(<><circle cx="8" cy="8" r="5.6" /><path d="M5.6 8.2l1.7 1.6 3.1-3.3" /></>, 12),
  read: svg(<><path d="M4 2.5h5l3 3v7.2c0 .5-.4.8-.8.8H4c-.4 0-.8-.3-.8-.8V3.3c0-.4.4-.8.8-.8z" /><path d="M5.6 8.5h4.8M5.6 11h3" /></>, 12),
  x: svg(<path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />, 10),
  user: svg(<><circle cx="8" cy="5.6" r="2.4" /><path d="M3.6 13c.6-2.2 2.3-3.4 4.4-3.4s3.8 1.2 4.4 3.4" /></>, 12),
};
