# VNK Hub — Brand Assets

## Palette
| Token | Hex | Usage |
|---|---|---|
| brand-600 | `#1E3A5F` | Couleur principale (boutons, sidebar active, icône, tuiles) |
| accent-500 | `#0F9D6F` | Accent (mot "Hub" du wordmark, succès, liens) |
| warn-400 | `#F2B441` | Accent secondaire (alertes douces) |

Voir `tailwind.config.ts` (`brand`, `accent`, `warn`) et `src/app/globals.css` (variables CSS) pour l'échelle complète.

## Logo
Mark: un "V" à angles nets (jointures en onglet, pas de coins arrondis) avec une barre d'accent émeraude sous la pointe, sur fond carré en dégradé bleu-marine subtil. Le wordmark utilise un séparateur vertical façon marque corporate : "VNK" en gras, puis une ligne fine, puis "HUB" en petites capitales espacées vert accent — inspiré des lockups SaaS (ex. Stripe Atlas).

### SVG (source vectorielle — `svg/`)
- `icon.svg` — icône carrée fond plein (app icons, favicons)
- `icon-mono-white.svg`, `icon-mono-dark.svg`, `icon-mono-black.svg` — icône seule sans fond, une couleur (le `-dark` sert aussi de mask-icon Safari)
- `logo-horizontal-dark.svg` / `logo-horizontal-light.svg` — icône + "VNK Hub" en ligne (texte foncé / texte blanc)
- `logo-stacked-dark.svg` / `logo-stacked-light.svg` — icône au-dessus du texte
- `wordmark-dark.svg` / `wordmark-light.svg` — texte seul, sans icône

### PNG (raster — `png/`)
Mêmes variantes que les SVG, plus l'icône seule aux tailles : 16, 32, 48, 64, 96, 128, 180, 192, 256, 512 px.

### Racine `public/`
- `favicon.ico` (16/32/48 multi-résolution)
- `favicon-16x16.png`, `favicon-32x32.png`
- `apple-touch-icon.png` (180×180, iOS)
- `android-chrome-192x192.png`, `android-chrome-512x512.png`
- `site.webmanifest` (PWA / Android)
- `mstile-150x150.png`, `mstile-310x150.png`, `mstile-310x310.png`, `browserconfig.xml` (tuiles Windows)

### Réseaux sociaux
- `og-image.png` (1200×630) — Facebook / LinkedIn / Open Graph
- `twitter-card.png` (1200×630) — Twitter/X `summary_large_image`

Tous ces fichiers sont déjà branchés dans `src/app/layout.tsx` (`metadata.icons`, `metadata.openGraph`, `metadata.twitter`, `metadata.other` pour les balises `msapplication-*`).

## Régénérer les assets
Toute modification doit se faire dans `design/logo-source/*.svg`, puis :
```
npm run brand:generate
```
Ce script copie les SVG dans `public/logo/svg/` et regénère tous les PNG/ICO/OG/tuiles dans `public/`.

## Composant React
```tsx
import { Logo } from "@/components/brand/logo";

<Logo variant="horizontal" tone="dark" height={32} />
```
Variants: `icon`, `horizontal`, `stacked`, `wordmark`. Tones: `dark` (texte foncé, fond clair) ou `light` (texte blanc, fond foncé).
