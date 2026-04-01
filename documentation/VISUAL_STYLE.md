# Ultra — Visual Style Guide

This document formalizes the visual conventions already in use across the Ultra web frontend. All branches building UI must follow these patterns to maintain consistency.

---

## Color System

Colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`.

### Light Mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#171717` | Primary text |
| `--primary` | `#0066cc` | Brand blue — CTAs, links, active states |
| `--primary-light` | `#e6f0ff` | Blue tint — highlighted cards, hover backgrounds |
| `--success` | `#28a745` | Green — confirmations, positive actions |
| `--success-light` | `#e6f9ed` | Green tint — success card backgrounds |
| `--muted` | `#6b7280` | Secondary text, inactive tabs, captions |
| `--border` | `#e5e7eb` | Borders, dividers, progress bar tracks |
| `--card` | `#ffffff` | Card and header backgrounds |

### Dark Mode (`prefers-color-scheme: dark`)

| Token | Value |
|-------|-------|
| `--background` | `#0a0a0a` |
| `--foreground` | `#ededed` |
| `--primary` | `#4d9fff` |
| `--primary-light` | `#1a2a3d` |
| `--success` | `#34d058` |
| `--success-light` | `#1a2d1f` |
| `--muted` | `#9ca3af` |
| `--border` | `#374151` |
| `--card` | `#1f2937` |

### Accent Colors

- **Red** (`red-400`, `red-500`): Warnings, negative values (e.g. overspending), destructive actions like sign-out. Use sparingly.

### Rule

Always use the semantic token (`bg-primary`, `text-muted`, `border-border`), never raw hex values. This ensures dark mode works automatically.

---

## Typography

### Font Stack

- **Sans:** Geist (loaded via `next/font/google`), fallback: Arial, Helvetica, sans-serif
- **Mono:** Geist Mono — used only for code-like content

### Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Captions, metadata, badge text |
| `text-sm` | 14px | Body text, descriptions, secondary labels |
| `text-base` | 16px | Standard body, section headings, button text |
| `text-lg` | 18px | Page titles, large labels |
| `text-xl` | 20px | Tab icons, navigation icons |
| `text-2xl` | 24px | Featured prices, large numbers |
| `text-3xl` | 30px | Hero/placeholder text (rare) |

### Weights

| Weight | Class | Usage |
|--------|-------|-------|
| 400 | (default) | Body text |
| 500 | `font-medium` | Labels, secondary emphasis |
| 600 | `font-semibold` | Card titles, headers, important labels |
| 700 | `font-bold` | Prices, primary emphasis |

---

## Spacing

All spacing uses Tailwind's default 4px scale. These are the established conventions:

### Standard Padding

| Context | Classes |
|---------|---------|
| Page content | `p-4` (16px all sides) |
| Cards | `p-4` |
| Header / footer | `px-4 py-3` |
| Buttons | `py-3` to `py-4`, full-width |
| Input fields | `px-3 py-2` |

### Gaps Between Elements

| Spacing | Class | Usage |
|---------|-------|-------|
| 2px | `gap-0.5` | Tight inline pairs |
| 4px | `gap-1` | Icon + label within a tight group |
| 8px | `gap-2` | Related items within a card |
| 12px | `gap-3` | Icon + text rows, list items |
| 16px | `gap-4` | Sections within a page, card stacks |
| 24px | `gap-6` | Major page sections |

---

## Border Radius

| Class | Radius | Usage |
|-------|--------|-------|
| `rounded-lg` | 8px | Input fields, small containers |
| `rounded-xl` | 12px | Cards, buttons, major components |
| `rounded-full` | 9999px | Badges, pills, avatars, progress bars |

This is a three-tier system. Do not introduce intermediate values.

---

## Borders & Dividers

- **Standard border:** `border border-border` (1px)
- **Highlighted border:** `border-2 border-primary` (2px, for selected/active elements)
- **Horizontal divider:** `border-t border-border` or `border-b border-border`
- **Divided lists:** `divide-y divide-border` on the parent container

---

## Shadows

- **Main viewport shell:** `shadow-lg`
- **Internal elements:** No shadows. The design is flat inside the shell.

Do not add `shadow-sm`, `shadow-md`, etc. to cards or buttons.

---

## Layout

### Viewport

The app is a mobile-first shell constrained to 430px max-width, centered on larger screens:

```
w-full max-w-[430px] min-h-screen flex flex-col shadow-lg bg-card
```

All pages render inside this shell.

### Page Structure

Every page follows this hierarchy:

1. **AppHeader** — fixed top, `flex items-center justify-between px-4 py-3 border-b border-border bg-card`
2. **Content area** — `flex-1 overflow-y-auto`, content uses `p-4` with `gap-4` between sections
3. **BottomTabs** — fixed bottom, `flex items-center justify-around border-t border-border bg-card py-2`

### Common Layout Patterns

| Pattern | Classes |
|---------|---------|
| Vertical stack | `flex flex-col gap-4` |
| Horizontal row | `flex items-center justify-between` |
| Icon + text row | `flex items-center gap-3` |
| 2-column grid | `grid grid-cols-2 gap-3` |
| Spaced list | `space-y-2` or `space-y-3` |

---

## Component Patterns

### Buttons

```
Primary CTA:     w-full rounded-xl bg-primary py-4 text-white font-semibold
Success CTA:     w-full rounded-xl bg-success py-4 text-white font-semibold
Secondary:       rounded-xl border border-border px-4 py-3
Text/link:       text-sm text-primary  (or text-red-500 for destructive)
Disabled:        Add disabled:opacity-60
```

- Buttons are always full-width (`w-full`) for primary actions.
- Use `transition-opacity` on buttons that can be disabled.

### Cards

```
Standard:        rounded-xl border border-border p-4
Highlighted:     rounded-xl border border-primary bg-primary-light p-4
Divided:         rounded-xl border border-border divide-y divide-border
                 (children get px-4 py-3 instead of card-level p-4)
```

### Input Fields

```
rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary
```

Always full-width (`w-full`). Focus state turns border blue.

### Badges / Pills

```
rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white
rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-white
```

### Progress Bars

```
Track:    h-2.5 rounded-full bg-border overflow-hidden  (or h-3)
Fill:     h-full rounded-full bg-success  (or bg-red-400 for negative)
```

### List Items

```
flex items-center gap-3 px-4 py-3 text-left transition-colors
Selected:  bg-primary-light
Hover:     hover:bg-primary-light/50
```

### Navigation

- **Active tab:** `text-primary font-semibold`
- **Inactive tab:** `text-muted hover:text-foreground`
- Tabs use emoji as icons at `text-xl`, labels at `text-xs`

---

## Icons

The app uses **Lucide icons** via `lucide-react` (the icon set used by shadcn/ui).

```tsx
import { Home, Ticket, User, MapPin, CreditCard, Check } from "lucide-react";
```

### Sizing

| Context | Props | Example |
|---------|-------|---------|
| Navigation tabs | `size={20}` | `<Home size={20} />` |
| Inline with text | `size={16}` | `<MapPin size={16} />` |
| Card/feature icon | `size={24}` | `<CreditCard size={24} />` |

### Color

Icons inherit `currentColor` by default. Use the same text color utilities as surrounding text:

```tsx
<Home size={20} className="text-primary" />    // active tab
<Home size={20} className="text-muted" />       // inactive tab
```

### Common Icons

| Usage | Icon |
|-------|------|
| Home / dashboard | `Home` |
| Passes / tickets | `Ticket` |
| Profile / account | `User` |
| Location / pickup | `MapPin` |
| Payment | `CreditCard` |
| Confirmed / success | `Check` or `CircleCheck` |
| Pending / waiting | `Clock` |
| Locked / secure | `Lock` |
| Analytics / charts | `BarChart3` |
| Search | `Search` |
| Back / navigate | `ChevronLeft` |
| Settings | `Settings` |
| Sign out | `LogOut` |

### Rule

Always use Lucide icons from `lucide-react`. Do not use emoji as icons, and do not pull in a second icon library.

---

## Interactive States

| State | Treatment |
|-------|-----------|
| Hover (cards/rows) | `hover:bg-primary-light/50` or `hover:border-primary/50` |
| Hover (text links) | `hover:text-foreground` |
| Focus (inputs) | `focus:border-primary` |
| Disabled | `disabled:opacity-60` |
| Active tab | `text-primary font-semibold` |
| Loading/pulse | `animate-pulse` on the element |

Transitions use `transition-colors` or `transition-opacity` (Tailwind defaults, ~150ms).

---

## Visual Hierarchy (top to bottom)

1. **Primary CTA** — `bg-primary`, white text, full-width, tallest padding (`py-4`)
2. **Success CTA** — `bg-success`, white text, same sizing as primary
3. **Secondary actions** — bordered, no fill, smaller padding (`py-3`)
4. **Card titles** — `font-semibold`, `text-base` or `text-lg`
5. **Body text** — default weight, `text-sm`
6. **Captions/metadata** — `text-xs text-muted`
7. **Prices/numbers** — `font-bold text-2xl` for featured, `font-semibold text-base` for inline

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use semantic color tokens (`bg-primary`, `text-muted`) | Use raw hex values (`#0066cc`) |
| Use the three-tier radius system (`rounded-lg`, `rounded-xl`, `rounded-full`) | Introduce `rounded-md`, `rounded-2xl`, etc. |
| Keep internal elements flat (no shadows) | Add shadows to cards or buttons |
| Use Lucide icons from `lucide-react` | Use emoji as icons or pull in a second icon library |
| Use `gap-*` for spacing between siblings | Use margin hacks (`mt-*` on every child) |
| Keep buttons full-width for primary CTAs | Make primary buttons inline/auto-width |
| Use `divide-y divide-border` for divided lists | Add manual `border-b` to each list item |
