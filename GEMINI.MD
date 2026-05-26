# 💎 Project Mandates (GEMINI.MD)

Technical source of truth for **Dima New**. Adherence is mandatory.

## 🟦 TypeScript & Logic
- **Strictness**: No `any`, `as`, `!`, or `ts-ignore`. Use explicit types/guards.
- **Path Mapping**: Always use path aliases (`@features/`, `@core/`, `@shared/`). No deep relative imports (`../../`).
- **Advanced Types**: Use Generics and Discriminated Unions for state/API.
- **Structure**: 1 class per file. Maximum **200 lines** (strict).
- **Data**: Real data streams only. **No mocked data**.

## 🅰️ Angular & NestJS (Modern Stack)
- **Angular**: 100% Standalone & Signals. Use `resource()`, `computed()`, `OnPush`.
- **NestJS**: Modular architecture. Use `inject()` for DI. Strict DTO validation.
- **Testing**: Vitest/Bun Test for unit/integration. Doxygen for minimal docs.

## 🎨 Design System (UI/UX Pro Max)
- **Stack**: PrimeNG 20 + TailwindCSS 4 (No raw CSS/SCSS).
- **Icons**: SVG icons only (PrimeIcons). No emojis in UI.
- **UX**: 44x44px touch targets. 4.5:1 contrast. Responsive by default.

## ✅ Quality Control (Bun)
- **Lint**: `bun run lint` must be clean.
- **Check**: `bun run build` (typechecking) must pass before delivery.
- **Formatting**: Use Prettier/standard formatting.

---
*Refer to `.agents/skills/` for implementation details.* 🚀
