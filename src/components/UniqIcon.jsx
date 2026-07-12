import React from 'react';
import './uniq-icons.css';

const ICONS = {
  message: (
    <path d="M4 4h16v10H7.5L4 18V4z" />
  ),
  search: (
    <path d="M11 4a7 7 0 1 0 4.9 12.1l4 4L20 20l-4-4A7 7 0 0 0 11 4zM11 6a5 5 0 1 1 0 10A5 5 0 0 1 11 6z" />
  ),
  certificate: (
    <path d="M12 2l3 3 4-1-1 4 3 3-4 2-1 4-3-3-3 3-1-4-4-2 3-3-1-4 4 1 3-3z" />
  ),
  'info-circle': (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  ),
  'user-plus': (
    <>
      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
      <path d="M19 18v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <path d="M22 9v2M23 10h-2" />
    </>
  ),
  calendar: (
    <path d="M3 7h18v14H3V7zm4-4v4M17 3v4" />
  ),
  'user-check': (
    <>
      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
      <path d="M17 14l3 3 5-5" />
    </>
  ),
  'user-minus': (
    <>
      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
      <path d="M18 18h6" />
    </>
  ),
  'user-shield': (
    <>
      <path d="M12 2l7 3v5c0 5-3.6 9.7-7 11-3.4-1.3-7-6-7-11V5l7-3z" />
      <path d="M12 8v4" />
    </>
  ),
  unlock: (
    <path d="M17 8V7a5 5 0 0 0-10 0v1" />
  ),
  ban: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.3 6.3L6.3 18.3" />
  ),
  'shield-halved': (
    <path d="M12 2l7 3v6c0 5-3.6 9.7-7 11-3.4-1.3-7-6-7-11V5l7-3zM12 7v7" />
  ),
  wrench: (
    <path d="M22 12l-4-4-2 2-6-6-2 2 6 6-2 2 4 4" />
  ),
  robot: (
    <>
      <rect x="6" y="6" width="12" height="10" rx="2" />
      <path d="M9 9h.01M15 9h.01M12 16v2" />
    </>
  ),
  bullhorn: (
    <path d="M3 10v4h6l7 4V6L9 10H3z" />
  ),
  'user-lock': (
    <>
      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
      <path d="M17 16v-2a2 2 0 0 0-2-2H11a2 2 0 0 0-2 2v2" />
    </>
  ),
  'exclamation-triangle': (
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
  ),
  thumbtack: (
    <path d="M14 3l1 5 4 1-7 7-5-5 7-8z" />
  ),
  'volume-up': (
    <path d="M3 10v4h4l5 4V6L7 10H3zM16 8a4 4 0 0 1 0 8" />
  ),
  'volume-mute': (
    <path d="M3 10v4h4l5 4V6L7 10H3zM19 5L5 19" />
  ),
  trash: (
    <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4h4v2" />
  ),
  reply: (
    <path d="M10 19v-6H5l7-7v6h5l-7 7z" />
  ),
  pen: (
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  'check-double': (
    <path d="M1 13l4 4L13 9M9 13l4 4L23 7" />
  ),
  'face-smile': (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-4 8h.01M16 10h.01M8 15s1.5 2 4 2 4-2 4-2" />
  ),
  'paper-plane': (
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
  ),
  xmark: (
    <path d="M6 6l12 12M6 18L18 6" />
  ),
  'arrow-left': (
    <path d="M19 12H7m0 0l6 6m-6-6l6-6" />
  ),
  'folder-plus': (
    <>
      <path d="M3 7v11a2 2 0 0 0 2 2h14V7H3z" />
      <path d="M3 7h6l2 2h10" />
      <path d="M12 11v6M9 14h6" />
    </>
  ),
  'user-circle': (
    <>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6 18a6 6 0 0 1 12 0" />
    </>
  ),
  gear: (
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4a6 6 0 0 1-.1 1.2l1.9 1.4-2 3.4-2.2-.7a6 6 0 0 1-1.6 1l-.3 2.4h-4l-.3-2.4a6 6 0 0 1-1.6-1L5.2 18l-2-3.4 1.9-1.4A6 6 0 0 1 5 12a6 6 0 0 1 .1-1.2L3.2 9.4 5.2 6l2.2.7a6 6 0 0 1 1.6-1L9.3 3h4l.3 2.4a6 6 0 0 1 1.6 1L18.8 6 20.8 9.4 18.9 11z" />
  ),
  'check-square': (
    <path d="M3 3h18v18H3V3zm5 11l3-3 6 6" />
  ),
  circle: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
  ),
  link: (
    <path d="M10 14a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6.93" />
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  'comment-dots': (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10zM9 10h.01M13 10h.01M17 10h.01" />
  ),
  'ellipsis-vertical': (
    <path d="M12 6h.01M12 12h.01M12 18h.01" />
  ),
  'user-pen': (
    <>
      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
      <path d="M16 16l4 4M14 18l2-2" />
    </>
  ),
  eye: (
    <path d="M1 12s4-8 10-8 10 8 10 8-4 8-10 8S1 12 1 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  ),
  'eye-slash': (
    <>
      <path d="M17.94 17.94A9.97 9.97 0 0 1 21 12s-4-8-10-8a9.9 9.9 0 0 0-4 .83" />
      <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  send: (
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
  ),
  check: (
    <path d="M20 6L9 17l-5-5" />
  ),
  times: (
    <path d="M6 6l12 12M6 18L18 6" />
  ),
  sticker: (
    <path d="M4 4h16v12H4zM8 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  )
};

export default function UniqIcon({ name = 'message', size = 18, color = 'currentColor', className = '', stroke = false, style = {} }) {
  const icon = ICONS[name] || ICONS.message;
  const viewBox = '0 0 24 24';
  const svgProps = stroke ? { fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } : { fill: color };

  return (
    <svg
      className={`uniq-icon ${className}`}
      width={size}
      height={size}
      viewBox={viewBox}
      style={style}
      aria-hidden="true"
      focusable="false"
      {...svgProps}
    >
      {icon}
    </svg>
  );
}
