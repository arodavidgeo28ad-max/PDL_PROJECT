# Design System Strategy: StressSync Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Luminescent Sanctuary"**

This design system moves beyond the utility of a standard dashboard to create a high-end, supportive environment for students. It rejects the "flat, boxed-in" aesthetic of traditional SaaS in favor of **Organic Layering** and **Atmospheric Depth**. By leveraging a "Luminescent Sanctuary" approach, we treat the UI as a series of soft, glowing planes floating in a deep, nocturnal space.

The system breaks the "template" look through:
*   **Intentional Asymmetry:** Data visualizations are not always centered; they lean into whitespace to create an editorial, "magazine-like" feel.
*   **Depth through Diffusion:** We eliminate harsh borders in favor of glow-based containment and tonal shifts.
*   **Supportive Intelligence:** The UI feels alive through subtle transitions, responding to the student's stress levels with shifting ambient hues rather than static alerts.

---

## 2. Colors & Surface Philosophy

The color palette is rooted in the `surface` (#0b1326), providing a deep, focused canvas.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions.
*   Use `surface_container_low` for secondary sections sitting on a `surface` background.
*   Use `surface_container_highest` for high-priority interactive elements.

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as stacked sheets of frosted glass.
*   **Level 0 (Foundation):** `surface` (#0b1326).
*   **Level 1 (Sections):** `surface_container` (#171f33).
*   **Level 2 (Active Cards):** `surface_container_high` (#222a3d).
*   **Level 3 (Interactive Floating):** `surface_container_highest` (#2d3449) with a 20px backdrop-blur.

### The "Glass & Gradient" Rule
To achieve a signature premium feel, main CTAs and hero data points must use the **Signature Glow**:
*   **Primary CTA:** A linear gradient from `primary` (#c0c1ff) to `primary_container` (#8083ff) at a 135-degree angle.
*   **Wellness Indicators:** A soft radial gradient using `secondary` (#4fdbc8) at 15% opacity to create a "halo" effect behind key metrics.

---

## 3. Typography: The Editorial Voice

We utilize a high-contrast scale to differentiate between "System Data" and "Supportive Guidance."

*   **Display & Headlines (Plus Jakarta Sans):** Used for big moments—your daily stress score or an encouraging morning greeting. These should feel spacious and authoritative.
    *   *Role:* Brand personality and "The Voice" of the AI.
*   **Body & Titles (Inter):** Used for all functional data. Inter provides the tech-focused, legible precision required for complex health metrics.
    *   *Role:* Clarity, navigation, and data density.

**Hierarchy Tip:** Pair a `display-sm` headline with a `label-md` uppercase sub-header (using `outline` color) to create an asymmetrical, high-end editorial header.

---

## 4. Elevation & Depth: Tonal Layering

Depth is a functional tool for StressSync, not just an aesthetic choice. We use "Atmospheric Elevation" to signal importance.

*   **The Layering Principle:** To lift a card, do not add a shadow immediately. Instead, move it from `surface_container` to `surface_container_high`.
*   **Ambient Shadows:** If a floating element (like a modal or hover state) requires a shadow, use a large blur (32px to 64px) at 6% opacity using the `primary` color (#c0c1ff) rather than black. This creates a "light leak" effect that feels like the card is glowing.
*   **The Ghost Border:** For accessibility on interactive inputs, use a 1px border of `outline_variant` at **15% opacity**. It should be barely felt, only perceived.
*   **Glassmorphism:** All "Health Insight" cards must use a 60% opacity `surface_container_highest` with a `backdrop-filter: blur(12px)`. This integrates the card into the "Sanctuary" background.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `md` (0.75rem) roundedness, shadow-glow on hover.
*   **Secondary:** Ghost style. No background, `outline_variant` (20% opacity) border.
*   **Tertiary:** Text only in `secondary` (#4fdbc8) with a 2px underline on hover.

### Progress & Data Viz
*   **Forbid Divider Lines:** Use `Spacing Scale 6` (2rem) to separate charts.
*   **Stress Indicators:** Use `tertiary` (#ffb2b7) for stress peaks. This "Soft Rose" should never be used for errors—only for "High Energy/Stress" data points to remain supportive, not punishing.
*   **Wellness Waves:** Use `secondary` (#4fdbc8) in a continuous, smooth SVG path for sleep or mood tracking.

### Cards
*   **Layout:** No borders. Use `xl` (1.5rem) roundedness for large dashboard containers.
*   **Nesting:** Small action chips inside cards should use `surface_bright` to "pop" against the darker card background.

### Input Fields
*   **State:** Background should be `surface_container_lowest`. On focus, the background remains, but a soft glow of `primary` (20% opacity) appears as an outer shadow.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a separator. Use `Spacing Scale 8` (2.75rem) between major content blocks.
*   **DO** use `secondary_fixed` for success states to keep the tone "Wellness-focused" rather than "System-focused."
*   **DO** overlap elements. A floating glassmorphism card that slightly overlaps a background chart adds a bespoke, high-end depth.

### Don't
*   **DON'T** use 100% white text. Use `on_surface_variant` (#c7c4d7) for body text to reduce eye strain in the dark theme.
*   **DON'T** use sharp corners. Nothing in StressSync should feel "stabbing" or "harsh." Stick to the `md` and `lg` roundedness scale.
*   **DON'T** use standard "Error Red." Use the `tertiary` (Soft Rose) tones. We are supporting the student, not grading them.