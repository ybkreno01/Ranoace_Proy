import React from 'react';
import { store } from '../../services/store';
import { CatalogItem } from '../../types';
import { DriveImage } from './DriveImage';

interface BrandLogoProps {
  brand?: CatalogItem | null;
  brandId?: string;
  brandName?: string;
  projectName?: string;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Resolves the brand either from direct object, brandId, brandName, or by parsing project title/aliases.
 */
export function resolveBrand(
  brand?: CatalogItem | null,
  brandId?: string,
  brandName?: string,
  projectName?: string
): { id: string; name: string; color: string; logo?: string; key: string } {
  const state = store.getState();
  const allBrands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );

  // 1. Direct brand object provided
  if (brand && brand.name) {
    return {
      id: brand.id,
      name: brand.name,
      color: brand.color || '#06b6d4',
      logo: brand.logo,
      key: normalizeBrandKey(brand.name),
    };
  }

  // 2. Direct brandId provided
  if (brandId) {
    const found = allBrands.find((b) => b.id === brandId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        color: found.color || '#06b6d4',
        logo: found.logo,
        key: normalizeBrandKey(found.name),
      };
    }
  }

  // 3. Brand name provided
  if (brandName) {
    const key = normalizeBrandKey(brandName);
    const found = allBrands.find(
      (b) =>
        normalizeBrandKey(b.name) === key ||
        (Array.isArray(b.aliases) && b.aliases.some((a) => normalizeBrandKey(a) === key))
    );
    if (found) {
      return {
        id: found.id,
        name: found.name,
        color: found.color || '#06b6d4',
        logo: found.logo,
        key,
      };
    }
    return {
      id: `brand-${key}`,
      name: brandName,
      color: getDefaultBrandColor(key),
      key,
    };
  }

  // 4. Infer from project title keywords
  if (projectName) {
    const pLower = projectName.toLowerCase();
    for (const b of allBrands) {
      const bKey = normalizeBrandKey(b.name);
      if (pLower.includes(bKey)) {
        return {
          id: b.id,
          name: b.name,
          color: b.color || '#06b6d4',
          logo: b.logo,
          key: bKey,
        };
      }
      if (Array.isArray(b.aliases)) {
        for (const alias of b.aliases) {
          if (pLower.includes(alias.toLowerCase())) {
            return {
              id: b.id,
              name: b.name,
              color: b.color || '#06b6d4',
              logo: b.logo,
              key: bKey,
            };
          }
        }
      }
    }

    // Direct fallback keyword match for well-known cybersecurity brands in title
    if (pLower.includes('aikido')) {
      return { id: 'brand-aikido', name: 'Aikido', color: '#6366f1', key: 'aikido' };
    }
    if (pLower.includes('senhasegura') || pLower.includes('segura') || pLower.includes('pam banco') || pLower.includes('pam hircasa')) {
      return { id: 'brand-segura', name: 'Senhasegura', color: '#00a887', key: 'senhasegura' };
    }
    if (pLower.includes('veracode')) {
      return { id: 'brand-veracode', name: 'Veracode', color: '#00b0f0', key: 'veracode' };
    }
    if (pLower.includes('greenradius') || pLower.includes('greenrdius') || pLower.includes('yubikey') || pLower.includes('carone')) {
      return { id: 'brand-greenradius', name: 'GreenRadius', color: '#16a34a', key: 'greenradius' };
    }
    if (pLower.includes('cyberark')) {
      return { id: 'brand-cyberark', name: 'CyberArk', color: '#0078d4', key: 'cyberark' };
    }
    if (pLower.includes('fortinet') || pLower.includes('forti')) {
      return { id: 'brand-fortinet', name: 'Fortinet', color: '#ef4444', key: 'fortinet' };
    }
    if (pLower.includes('microsoft') || pLower.includes('azure') || pLower.includes('entra')) {
      return { id: 'brand-microsoft', name: 'Microsoft', color: '#00a4ef', key: 'microsoft' };
    }
  }

  return { id: 'brand-general', name: 'General', color: '#64748b', key: 'general' };
}

function normalizeBrandKey(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getDefaultBrandColor(key: string): string {
  if (key.includes('aikido')) return '#6366f1';
  if (key.includes('senhasegura') || key.includes('segura')) return '#00a887';
  if (key.includes('veracode')) return '#00b0f0';
  if (key.includes('greenradius') || key.includes('yubikey')) return '#16a34a';
  if (key.includes('cyberark')) return '#0078d4';
  if (key.includes('fortinet')) return '#ef4444';
  if (key.includes('microsoft')) return '#0284c7';
  return '#06b6d4';
}

/**
 * High-fidelity Brand Logo Component with clean circular badge, vector emblems,
 * and direct image support matching the user's reference design.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  brandId,
  brandName,
  projectName,
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const resolved = resolveBrand(brand, brandId, brandName, projectName);
  const key = resolved.key;

  // Size styling maps
  const sizeClasses: Record<string, string> = {
    '2xs': 'w-4 h-4 p-0 text-[8px]',
    xs: 'w-5 h-5 p-0.5 text-[9px]',
    sm: 'w-7 h-7 p-0.5 text-[10px]',
    md: 'w-9 h-9 p-0.5 text-xs',
    lg: 'w-11 h-11 p-0.5 text-xs',
    xl: 'w-12 h-12 p-1 text-sm',
    '2xl': 'w-14 h-14 p-1.5 text-base',
  };

  const containerClass = `rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden relative ${sizeClasses[size]} ${className}`;

  // Priority 1: User uploaded custom logo via URL, Google Drive or base64
  if (resolved.logo) {
    if (resolved.logo.startsWith('gdrive://')) {
      return (
        <div className={containerClass} title={showTooltip ? resolved.name : undefined}>
          <DriveImage
            src={resolved.logo}
            alt={resolved.name}
            className="w-full h-full object-contain rounded-full"
            showDriveBadge={false}
          />
        </div>
      );
    }
    return (
      <div className={containerClass} title={showTooltip ? resolved.name : undefined}>
        <img
          src={resolved.logo}
          alt={resolved.name}
          className="w-full h-full object-contain rounded-full"
          onError={(e) => {
            // fallback to vector on load error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Priority 2: Built-in crisp vector logos for standard cybersecurity brands
  // 1. Aikido (Visor headband + upward chevron in violet/indigo)
  if (key.includes('aikido')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: Aikido Security' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2.5" />
          {/* Top curved headband */}
          <path
            d="M 23 38 Q 50 25 77 38 L 77 48 Q 50 36 23 48 Z"
            fill="#5850ec"
          />
          {/* Bottom upward chevron */}
          <path
            d="M 23 74 L 50 49 L 77 74 L 69 79 L 50 61 L 31 79 Z"
            fill="#5850ec"
          />
        </svg>
      </div>
    );
  }

  // 2. Senhasegura / Segura (Dark green tree padlock emblem in mint ring)
  if (key.includes('senhasegura') || key.includes('segura')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: Senhasegura PAM' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2.5" />
          {/* Tree-like padlock emblem in dark teal/green */}
          <rect x="22" y="27" width="56" height="8.5" rx="4.25" fill="#00594c" />
          <rect x="28" y="39.5" width="44" height="7.5" rx="3.75" fill="#00594c" />
          <rect x="31" y="47" width="6.5" height="15" rx="3.25" fill="#00594c" />
          <rect x="62.5" y="47" width="6.5" height="15" rx="3.25" fill="#00594c" />
          <rect x="46.5" y="47" width="7" height="20" rx="3.5" fill="#00594c" />
          <circle cx="50" cy="72" r="9.5" fill="#00594c" />
          <circle cx="50" cy="72" r="4.5" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // 3. Veracode (Black left slash and bright cyan right slash forming V)
  if (key.includes('veracode')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: Veracode' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />
          {/* Bold Black left slash */}
          <path
            d="M 22 24 L 38 24 L 47 76 L 31 76 Z"
            fill="#0f172a"
          />
          {/* Bold Cyan right slash */}
          <path
            d="M 53 76 L 62 24 L 78 24 L 69 76 Z"
            fill="#00a3e0"
          />
        </svg>
      </div>
    );
  }

  // 4. GreenRadius / Yubikey (Green circle with rocket / authenticator key emblem)
  if (key.includes('greenradius') || key.includes('greenrdius') || key.includes('yubikey')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: GreenRadius + YubiKey' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#f0fdf4" stroke="#86efac" strokeWidth="2.5" />
          {/* Green Rocket body */}
          <path
            d="M 24 64 C 28 58 33 44 46 31 C 58 19 68 19 74 25 C 80 31 80 41 68 53 C 55 66 41 71 35 75 Z"
            fill="#16a34a"
          />
          <path d="M 24 64 L 19 72 L 28 68 Z" fill="#15803d" />
          <circle cx="57" cy="38" r="4.5" fill="#ffffff" />
          {/* YubiKey / Traffic indicator key */}
          <rect x="63" y="49" width="14" height="27" rx="4" fill="#1e293b" />
          <circle cx="70" cy="55.5" r="2.8" fill="#ef4444" />
          <circle cx="70" cy="62.5" r="2.8" fill="#eab308" />
          <circle cx="70" cy="69.5" r="2.8" fill="#22c55e" />
        </svg>
      </div>
    );
  }

  // 5. CyberArk (Blue shield / stylized C keyhole)
  if (key.includes('cyberark')) {
    return (
      <div className={containerClass} title={showTooltip ? 'CyberArk' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
          <path
            d="M50 20 C66 20 78 32 78 50 C78 68 66 80 50 80 C34 80 22 68 22 50 C22 32 34 20 50 20 Z"
            fill="#1d4ed8"
          />
          <path
            d="M50 32 C60 32 66 38 66 50 C66 62 60 68 50 68 C40 68 34 62 34 50 C34 38 40 32 50 32 Z"
            fill="#ffffff"
          />
          <rect x="50" y="44" width="24" height="12" fill="#1d4ed8" />
        </svg>
      </div>
    );
  }

  // 6. Fortinet (Red 4-block geometric fortress)
  if (key.includes('fortinet') || key.includes('forti')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Fortinet' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
          <rect x="25" y="25" width="22" height="22" rx="4" fill="#dc2626" />
          <rect x="53" y="25" width="22" height="22" rx="4" fill="#dc2626" />
          <rect x="25" y="53" width="22" height="22" rx="4" fill="#dc2626" />
          <rect x="53" y="53" width="22" height="22" rx="4" fill="#dc2626" />
        </svg>
      </div>
    );
  }

  // 7. Microsoft (4 color squares)
  if (key.includes('microsoft') || key.includes('azure') || key.includes('entra')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Microsoft' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="26" y="26" width="22" height="22" fill="#f25022" />
          <rect x="52" y="26" width="22" height="22" fill="#7fba00" />
          <rect x="26" y="52" width="22" height="22" fill="#00a4ef" />
          <rect x="52" y="52" width="22" height="22" fill="#ffb900" />
        </svg>
      </div>
    );
  }

  // 8. Cisco
  if (key.includes('cisco')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Cisco' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#f0f9ff" />
          <path d="M25 58 L25 42 M35 64 L35 36 M45 70 L45 30 M55 70 L55 30 M65 64 L65 36 M75 58 L75 42" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 9. Palo Alto
  if (key.includes('paloalto') || key.includes('panw')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: Palo Alto Networks' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#fff7ed" stroke="#fed7aa" strokeWidth="2" />
          <path d="M50 24 L74 38 L74 62 L50 76 L26 62 L26 38 Z" fill="#ea580c" />
          <path d="M50 36 L64 44 L64 56 L50 64 L36 56 L36 44 Z" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // 10. CrowdStrike
  if (key.includes('crowdstrike') || key.includes('falcon')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: CrowdStrike' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
          <path d="M26 66 L50 24 L74 66 L50 54 Z" fill="#dc2626" />
        </svg>
      </div>
    );
  }

  // 11. AWS / Amazon
  if (key.includes('aws') || key.includes('amazon')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: AWS' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#fffbeb" stroke="#fde68a" strokeWidth="2" />
          <path d="M30 60 Q 50 76 70 60" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M66 56 L72 61 L64 64" fill="#f59e0b" />
          <text x="50" y="44" textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="bold" fontFamily="sans-serif">aws</text>
        </svg>
      </div>
    );
  }

  // 12. Google / Google Cloud
  if (key.includes('google') || key.includes('gcp')) {
    return (
      <div className={containerClass} title={showTooltip ? 'Marca: Google Cloud' : undefined}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M50 36 C42 36 36 42 36 50 C36 58 42 64 50 64 C56 64 61 60 63 55 L50 55 L50 47 L71 47 C72 50 72 52 72 55 C72 67 63 74 50 74 C34 74 24 63 24 50 C24 37 34 26 50 26 C57 26 63 29 67 33 L61 39 C58 37 54 36 50 36 Z" fill="#4285f4" />
        </svg>
      </div>
    );
  }

  // Priority 3: Fallback colored circle with initials
  const initials = (resolved.name || 'G')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={containerClass}
      style={{
        backgroundColor: `${resolved.color}15`,
        borderColor: `${resolved.color}40`,
      }}
      title={showTooltip ? `Marca: ${resolved.name}` : undefined}
    >
      <span
        className="font-bold tracking-tight select-none uppercase"
        style={{ color: resolved.color }}
      >
        {initials || 'CC'}
      </span>
    </div>
  );
};
