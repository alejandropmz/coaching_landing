---
name: Gilded Noir
colors:
  surface: '#fdf8f7'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e6e2e0'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4b4640'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#7d766f'
  outline-variant: '#cec5bd'
  surface-tint: '#615e5b'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1d1b19'
  on-primary-container: '#878380'
  inverse-primary: '#cbc5c2'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fdd587'
  on-secondary-container: '#785a19'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b18'
  on-tertiary-container: '#87837f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e7e1de'
  primary-fixed-dim: '#cbc5c2'
  on-primary-fixed: '#1d1b19'
  on-primary-fixed-variant: '#494644'
  secondary-fixed: '#ffdea3'
  secondary-fixed-dim: '#e8c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5c4200'
  tertiary-fixed: '#e7e1dd'
  tertiary-fixed-dim: '#cbc6c1'
  on-tertiary-fixed: '#1d1b18'
  on-tertiary-fixed-variant: '#494643'
  background: '#fdf8f7'
  on-background: '#1c1b1b'
  surface-variant: '#e6e2e0'
  cream-base: '#FEF8F3'
  charcoal-accent: '#1D1B19'
  metallic-gold: '#C5A059'
  deep-gold: '#775A19'
  divider-charcoal: '#32302D'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '600'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.15em
spacing:
  base-unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 80px
  section-gap: 120px
---

## Brand & Style

This design system evolves the "Gilded Minimalism" concept into a high-contrast, editorial powerhouse. It is rooted in **Minimalism** with **High-Contrast** accents, designed to feel like a boutique luxury lookbook. The personality is authoritative, sophisticated, and unapologetically bold, targeting high-end clientele who value precision and architectural rigor.

The visual narrative is driven by the stark juxtaposition of a cream and gold foundation against deep, ink-black charcoal. By introducing heavy charcoal for structural elements, the design shifts from merely "elegant" to "commanding." Sharp edges and generous whitespace remain the cornerstone, ensuring that the "Noir" elements act as focal points rather than overwhelming the refined base.

## Colors

The palette is a tri-tone mastery of contrast, utilizing the deep charcoal seed to anchor the lighter gold and cream tones.

- **Primary (#1D1B19):** A rich, deep charcoal (appearing as black) used for primary headings, high-contrast action buttons, and structural separators. It provides the "ink" that defines the page layout.
- **Secondary (#775A19):** A deep, burnished gold used for sophisticated emphasis, selective iconography, and secondary interactive states.
- **Tertiary (#F3EDE8):** A warm, mid-tone cream used for surface containers and subtle layering against the base.
- **Neutral (#FEF8F3):** The "Cream Base" that provides a breathable, luxury-standard background for the high-contrast elements.

Structural separators and borders transition from soft taupe to **Divider Charcoal (#32302D)** to enforce a more rigid, architectural structure.

## Typography

Typography is used as a graphic element. **Bodoni Moda** headlines are exclusively rendered in **Charcoal (#1D1B19)** to maximize their impact against the cream backgrounds. This high-contrast serif creates a "fashion masthead" aesthetic that is both timeless and aggressive.

**Inter** provides a utilitarian counterpoint for body copy, ensuring clarity and modern balance. For high-utility labels and navigation, `label-caps` should be used with increased letter-spacing to mimic the technical precision of luxury watch branding or architectural blueprints.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy, mirroring the structured constraints of high-end editorial print.

- **Desktop:** A 12-column grid with 80px margins creates a "contained luxury" feel. Columns are often used asymmetrically—for example, text may span 6 columns while an image spans the remaining 6, or content may be centered within 8 columns to create intentional "whitespace runways" on the sides.
- **Rhythm:** The system utilizes a strict 8px increment. Vertical spacing between major sections is aggressive (120px) to force the user to pause and appreciate the content as a curated gallery.
- **Mobile:** A 4-column grid with 20px margins. Structural separators (Charcoal lines) are used more frequently on mobile to maintain section definition where whitespace is limited.

## Elevation & Depth

This system rejects shadows in favor of **Bold Borders** and **Tonal Layers**. Depth is communicated through the physical stacking of elements rather than simulated light.

- **Contrast Stacking:** Surfaces are distinguished by hard color changes (e.g., a Charcoal card on a Cream background) rather than elevation shadows.
- **Structural Lines:** 1px or 2px Charcoal (#1D1B19) lines serve as the primary depth indicators, framing content and separating tiers with surgical precision.
- **Flat UI:** All interactive elements lie on the same plane, with "lifting" only represented through the inversion of colors (e.g., a button turning from Charcoal to Gold on hover).

## Shapes

The shape language is exclusively **Sharp (0)**. There are no rounded corners in the design system. This geometric rigidity reinforces the architectural and premium nature of the brand. Every button, image container, and input field must feature crisp 90-degree angles, evoking the feel of cut stone or heavy-stock paper.

## Components

### Buttons
- **Primary:** Solid Charcoal (#1D1B19) fill with Cream (#FEF8F3) text. Rectangular, 0px radius. Use `label-caps` for the label.
- **Secondary:** Transparent fill with a 2px Charcoal border. Text is Charcoal. 
- **Ghost:** Gold (#775A19) text with no border or fill, underlined by a 1px Charcoal line on hover.

### High-Contrast Separators
Structural dividers are 1px solid Charcoal. They should span the full width of their container to create distinct "zones" of content.

### Cards
Cards are defined by a 1px Charcoal border or a Tertiary (#F3EDE8) background fill. Images within cards must be flush with the edges, maintaining the sharp-corner aesthetic.

### Input Fields
Inputs are minimal: a 1px bottom border in Charcoal. On focus, the border thickness increases to 2px. Labels are rendered in Charcoal `label-caps` above the field.

### Chips & Tags
Small rectangular boxes with a 1px Charcoal border. Text is `label-caps` in Charcoal. They should never be rounded; they should look like small, cut-out labels.

### Lists
List items are separated by full-width Charcoal lines. Hover states should utilize a subtle shift to the Tertiary cream background to highlight the selection without breaking the minimal aesthetic.