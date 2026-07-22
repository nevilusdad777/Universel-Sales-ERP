---
name: Universal Sales ERP System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-velocity enterprise environments where data density and clarity are paramount. It adopts a **Modern Corporate** aesthetic that blends the systematic reliability of Salesforce with the refined minimalism of Stripe and Vercel. 

The personality is professional, authoritative, and efficient. It minimizes visual noise to ensure that users can focus on complex workflows and data analysis without cognitive fatigue. The UI utilizes a balanced mix of heavy whitespace, crisp borders, and subtle depth to create a structured, scalable environment for CRM and ERP operations.

## Colors

The palette is anchored by a high-contrast foundation to ensure WCAG AA accessibility across all functional areas. 

- **Primary (Blue):** Used for primary actions, active states, and progress indicators.
- **Secondary (Slate):** Used for navigation backgrounds, heavy sidebars, and structural elements.
- **Surface & Background:** A clear distinction is made between the `#F8FAFC` page background and `#FFFFFF` card surfaces to create natural grouping.
- **Semantic Colors:** Success, Warning, and Danger colors are calibrated for visibility against white backgrounds, specifically for status badges and destructive actions.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic feel. 

- **Headlines:** Use tighter letter-spacing and heavier weights to establish hierarchy.
- **Body Text:** Optimized for long-form data reading with standard line heights.
- **Labels:** Small caps or medium weights are used for form labels and table headers to distinguish them from user-generated data.
- **Scale:** The system transitions from a comfortable 16px desktop body default to 14px for data-dense tables and sidebars.

## Layout & Spacing

The layout is built on a **12-column fluid grid** with a maximum container width of 1440px. 

- **Rhythm:** An 8px linear scale (with a 4px half-step for micro-adjustments) governs all margins and padding.
- **Sidebars:** Persistent left-hand navigation is fixed at 280px (collapsed to 64px).
- **Page Header:** Standardized 64px height with integrated breadcrumbs and primary actions.
- **Responsive Behavior:** 
  - **Desktop:** 24px gutters, 32px page margins.
  - **Tablet:** 16px gutters, 24px page margins.
  - **Mobile:** 16px page margins; grid collapses to a single column stack.

## Elevation & Depth

Visual hierarchy is established using **Tonal Layers** supplemented by **Ambient Shadows**.

- **Level 0 (Background):** `#F8FAFC` - The canvas layer.
- **Level 1 (Cards/Surface):** White background with a subtle `1px` border in `#E2E8F0`. 
- **Level 2 (Dropdowns/Modals):** Elevated with a "Soft" shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Level 3 (Popovers):** Higher elevation for floating elements like tooltips or context menus: `0 10px 15px -3px rgb(0 0 0 / 0.1)`.

Avoid heavy blacks in shadows; use Slate-tinted shadows to maintain the clean SaaS feel.

## Shapes

The design system uses a **Rounded** shape language to soften the industrial nature of ERP data.

- **Standard Elements (Inputs, Buttons, Cards):** 0.5rem (8px) radius.
- **Large Elements (Modals, Large Cards):** 1rem (16px) radius.
- **Micro Elements (Badges, Tags):** 0.25rem (4px) radius or fully pill-shaped for status indicators.

## Components

### Buttons
- **Primary:** Solid `#2563EB` with white text. 
- **Secondary:** White background, `#E2E8F0` border, `#1E293B` text.
- **Ghost:** No background/border, Primary color text for secondary actions.
- **Sizing:** Default height is 40px; 32px for compact table actions.

### Input Fields
- **Default State:** White background, `1px` border in `#CBD5E1`.
- **Focus State:** Primary color border with a `3px` soft glow (outline-offset).
- **Labels:** `label-md` weight, positioned above the field with 4px spacing.

### Data Tables
- **Header:** Light grey background (`#F1F5F9`), `label-sm` text (uppercase).
- **Rows:** 56px height, thin bottom border (`#F1F5F9`), hover state with subtle background tint.
- **Density:** Provide a "Compact" toggle that reduces row height to 40px.

### Chips & Badges
- **Status Badges:** Subtle background tint (e.g., 10% opacity of semantic color) with high-contrast text of the same hue.
- **Filter Chips:** Primary color border and text when active; neutral when inactive.

### Icons
- Use **Lucide Icons** with a `2px` stroke width. Icons should be sized at 20px for standard UI and 16px for inline text/table buttons.