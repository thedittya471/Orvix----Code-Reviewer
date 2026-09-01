function CodeReviewVisual() {
  return (
    <svg
      role="img"
      aria-labelledby="review-visual-title review-visual-description"
      viewBox="0 0 900 980"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      fill="none"
    >
      <title id="review-visual-title">Automated pull request review</title>
      <desc id="review-visual-description">
        Code changes travel through an analysis grid toward an approved merge.
      </desc>

      <defs>
        <linearGradient id="panel" x1="180" y1="120" x2="720" y2="840" gradientUnits="userSpaceOnUse">
          <stop stopColor="#17202B" stopOpacity="0.92" />
          <stop offset="1" stopColor="#080B10" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="cyan" x1="150" y1="0" x2="760" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="0.5" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#A78BFA" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#67E8F9" stopOpacity="0" />
          <stop offset="0.5" stopColor="#67E8F9" stopOpacity="0.6" />
          <stop offset="1" stopColor="#67E8F9" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="halo">
          <stop stopColor="#22D3EE" stopOpacity="0.16" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M56 0H0V56" stroke="#94A3B8" strokeOpacity="0.055" />
        </pattern>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="900" height="980" fill="#05070B" />
      <rect width="900" height="980" fill="url(#grid)" />
      <circle cx="480" cy="470" r="390" fill="url(#halo)" />

      <g opacity="0.55">
        <path d="M60 205H182L242 265H348" stroke="#64748B" strokeOpacity="0.25" />
        <path d="M840 166H735L681 220H604" stroke="#64748B" strokeOpacity="0.25" />
        <path d="M70 775H210L275 710" stroke="#64748B" strokeOpacity="0.2" />
      </g>

      <g className="review-orbit" opacity="0.8">
        <ellipse cx="475" cy="460" rx="290" ry="290" stroke="#22D3EE" strokeOpacity="0.12" />
        <ellipse cx="475" cy="460" rx="230" ry="230" stroke="#A78BFA" strokeOpacity="0.11" strokeDasharray="5 12" />
      </g>

      <g className="review-layer review-layer-back">
        <path d="M176 325L675 254L765 319L267 391L176 325Z" fill="url(#panel)" stroke="#94A3B8" strokeOpacity="0.16" />
        <circle cx="226" cy="329" r="6" fill="#FB7185" fillOpacity="0.7" />
        <rect x="260" y="315" width="170" height="8" rx="4" fill="#64748B" fillOpacity="0.25" />
        <rect x="260" y="336" width="245" height="6" rx="3" fill="#64748B" fillOpacity="0.13" />
      </g>

      <g className="review-layer review-layer-middle">
        <path d="M145 425L642 352L770 432L272 507L145 425Z" fill="url(#panel)" stroke="#67E8F9" strokeOpacity="0.22" />
        <circle cx="207" cy="431" r="6" fill="#FBBF24" fillOpacity="0.75" />
        <rect x="248" y="409" width="225" height="9" rx="4.5" fill="#67E8F9" fillOpacity="0.24" />
        <rect x="248" y="435" width="330" height="7" rx="3.5" fill="#64748B" fillOpacity="0.18" />
        <rect x="248" y="459" width="190" height="7" rx="3.5" fill="#A78BFA" fillOpacity="0.22" />
      </g>

      <g className="review-layer review-layer-front">
        <path d="M118 543L616 468L782 566L284 644L118 543Z" fill="url(#panel)" stroke="#67E8F9" strokeOpacity="0.34" />
        <circle cx="190" cy="552" r="7" fill="#34D399" filter="url(#glow)" />
        <rect x="237" y="524" width="256" height="10" rx="5" fill="#67E8F9" fillOpacity="0.42" />
        <rect x="237" y="553" width="386" height="8" rx="4" fill="#64748B" fillOpacity="0.2" />
        <rect x="237" y="578" width="148" height="8" rx="4" fill="#34D399" fillOpacity="0.4" />
        <rect x="400" y="578" width="205" height="8" rx="4" fill="#64748B" fillOpacity="0.15" />
      </g>

      <g className="review-scan">
        <rect x="125" y="220" width="650" height="120" fill="url(#scan)" opacity="0.2" />
        <path d="M135 280H765" stroke="url(#cyan)" strokeWidth="2" filter="url(#glow)" />
      </g>

      <g className="review-flow" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round">
        <path d="M191 552C190 696 328 678 421 758C491 818 596 798 668 737" />
        <path d="M421 758C492 714 537 665 595 584" />
      </g>

      <g className="review-node review-node-one" transform="translate(421 758)">
        <circle r="23" fill="#07131A" stroke="#67E8F9" strokeOpacity="0.6" />
        <circle r="5" fill="#67E8F9" />
      </g>
      <g className="review-node review-node-two" transform="translate(668 737)">
        <circle r="30" fill="#081510" stroke="#34D399" strokeOpacity="0.7" />
        <path d="M-10 0l7 7 14-16" stroke="#6EE7B7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g className="review-pulse" transform="translate(476 458)">
        <circle r="104" stroke="#67E8F9" strokeOpacity="0.2" />
        <circle r="70" stroke="#67E8F9" strokeOpacity="0.28" />
        <circle r="22" fill="#67E8F9" fillOpacity="0.08" stroke="#67E8F9" strokeOpacity="0.55" />
        <path d="M-8 0l6 6 12-14" stroke="#A5F3FC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g opacity="0.5" className="review-code-lines">
        <rect x="666" y="330" width="82" height="5" rx="2.5" fill="#34D399" />
        <rect x="686" y="348" width="60" height="5" rx="2.5" fill="#64748B" />
        <rect x="92" y="684" width="98" height="5" rx="2.5" fill="#67E8F9" />
        <rect x="92" y="702" width="66" height="5" rx="2.5" fill="#64748B" />
      </g>
    </svg>
  );
}

export { CodeReviewVisual };
