# Copilot Instructions for AI Agents

## Project Overview
- This is a Next.js app (TypeScript, App Router) for retirement planning calculations.
- Main UI and logic are in `app/` and `lib/`.
- Core calculation logic is in `useRetirementCalculator.ts` (duplicated in root and `lib/`; prefer `lib/`).
- UI fields for the calculator are in `app/components/CalculatorFields.tsx`.
- Routing: `/` (main), `/retire` (retirement calculator page).

## Key Patterns & Conventions
- Use React Server Components and Next.js App Router conventions.
- Shared logic and utilities go in `lib/`.
- Place new UI components in `app/components/`.
- Use TypeScript for all new code.
- Use functional React components and hooks.
- Styling is via `globals.css` (global) and component-level CSS modules if needed.

## Developer Workflows
- Start dev server: `npm run dev` (see README for alternatives).
- No custom test or build scripts defined; use Next.js defaults.
- Hot reload is enabled for all files in `app/` and `lib/`.
- No custom lint rules; uses default ESLint config (`eslint.config.mjs`).

## Integration & Data Flow
- No backend API: all calculations are client-side.
- No database or authentication required for core calculator.
- External dependencies: Next.js, React, Supabase (see `lib/supabaseClient.js` for future integration).
- Data flows: User input → `CalculatorFields` → calculation hook → result display.

## Examples
- To add a new calculator field: update `CalculatorFields.tsx` and calculation logic in `useRetirementCalculator.ts`.
- To add a new page: create a folder in `app/` with `page.tsx`.

## References
- Main entry: `app/page.tsx`
- Calculator logic: `lib/useRetirementCalculator.ts`
- UI fields: `app/components/CalculatorFields.tsx`
- Supabase integration (optional): `lib/supabaseClient.js`

## Do Not
- Do not add server-side API routes unless required.
- Do not use class components.
- Do not add global state management libraries (Redux, etc.) unless discussed.

---
For more, see `README.md` and Next.js docs.
