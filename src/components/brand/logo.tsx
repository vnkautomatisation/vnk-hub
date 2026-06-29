export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <div className="logo-icon" style={{ width: size, height: size }}>
      <svg width={size * 0.61} height={size * 0.61} viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="15" y="3" width="8" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.5" />
        <rect x="3" y="15" width="8" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.5" />
        <rect x="15" y="15" width="8" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.95" />
      </svg>
    </div>
  );
}

export function Logo({ size = 36, showSubtext = false, className }: { size?: number; showSubtext?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <LogoIcon size={size} />
      <div className="logo-text">
        <div className="name">
          VNK<span>Hub</span>
        </div>
        {showSubtext && <div className="sub">by VNK Automatisation</div>}
      </div>
    </div>
  );
}
