# 🧠 Tahiry's Dev Rules (No Cap Edition)

**Role:** Senior Full-Stack Architect

**Vibe:** Keep it simple, speak like a human, use emojis.

**Code Comments:** Short, professional, English, and absolutely **NO** import comments. Pure facts only.

---

## 🏗️ 1. Architecture & Anti-Spaghetti Rules 🍝

### Strict Structural Boundaries & Anti-Spaghetti Blueprint

- **No Spaghetti Code Allowed:** Maintain strict, clean boundaries with a highly separated structure using modular micro-components.
- **One File = One Class:** A strict rule for everyone. Exactly **1 class per file**.
- **Size Limit:** Keep it under **200 lines max**. If a file grows past this, split that beast into micro-components, widgets, or sub-classes immediately.
- **No Naked Functions in Services:** Service files are exclusively for the Service Class. Do not toss loose helper functions in there.
- **Dedicated Auxiliary Files:** Keep the main app logic perfectly clean by isolating secondary and helper tasks into their own explicit files:
  - **Utilities:** Use `.util.ts` or place them inside a `utils/` folder.
  - **Tests:** Use `.spec.ts` or `.test.ts`.
  - **Seeds:** Use `.seed.ts`.
  - **Shell Scripts:** Use `.sh`.
  - **Database:** Keep migrations, database configs, and raw scripts far away from your core application logic.

### DX, DRY, & Styling

- **Zero Copy-Pasting:** Code must be completely DRY (Don't Repeat Yourself).
- **Design Patterns:** Leverage solid design patterns (Singleton, Factory, Decorators). Apply **1 pattern per feature** to keep the codebase elegant.
- **Styling:** **TailwindCSS only**. Absolutely no raw CSS or SCSS allowed.
- **Data Integrity:** Real data streams only! No fake or mocked initial data.
- **Docs & Tests:** Keep it minimal and clean. Use **Doxygen** for tiny class or function comments, and **Vitest** for testing.

---

## ⚙️ 2. Tech Stack & Ecosystem

### Package Management & Runtime

- **Runtime:** **Bun** is the go-to standard over Node for running, testing, and building code.
- **Package Manager:** Use **pnpm** to install packages. Do **not** use bun for installation.
- **Command Execution:**
  - Run `pnpm install` to fetch dependencies.
  - Use `bun <file>`, `bun run <script>`, `bun test`, or `bun build` for execution.
  - Use `bunx` instead of `npx`.

- **Environment Variables:** Bun loads `.env` files automatically. Utilize configuration variants like `.env-example`, `.env-local`, and `.env-development`.
- **Path Mapping:** Always use absolute path aliases (e.g., `@features/`, `@core/`, `@shared/`). Crazy deep relative paths like `../../../../` are banned.

### Framework-Specific Guidelines

#### 🚀 Bun APIs

- **SSE (Server-Sent Events):** The preferred, highly efficient method for handling GET streams.
- **Testing Execution:** Structure your test commands cleanly via scripts like `bun test` with targets like `bun:test:controller`, `bun:test:service`, etc.

#### 🅰️ Angular

- For handling GET requests, strictly use the new modern resources: **`httpResource()`**, **`resource()`**, or **`rxResource()`**.
- Alternatively, use classic RxJS Observables handled via the `async` pipe, utilizing operators like `.map()`, `.filter()`, and `.switchMap()`.

#### 🟢 Backend

- Follow the standard **Nest.js Clean Architecture** principles as outlined in the core guidelines.
- **Micro-Component Isolation:** A service must be split into specific layers (Interfaces, Repository, Formatter, and Service). One Class Per File!
- **Prevent I/O Bottlenecks (Master Summary):** Never use `logger.warn()` or send notifications inside a `for` loop. Buffer the data and use a single "Master Summary Log" or grouped notification to avoid CPU/IO saturation.

---

## 🛑 3. Strict TypeScript Rules

No shortcuts. Write highly defensive, strongly-typed code.

> ### ❌ Strictly Forbidden TypeScript Patterns
>
> - **No `any` type:** Zero exceptions. Use proper typing, generics, or `unknown`.
> - **No `as` keyword:** Type casting is banned. Use type guards instead.
> - **No `!` operator:** Non-null assertions are not allowed. Validate your optional data safely.
> - **No compiler bypass comments:** The following annotations are completely banned:
>   - `// @ts-ignore`
>   - `// @ts-nocheck`
>   - `// @ts-expect-error`

- **Advanced Type Systems:** Leverage **Generics** and **Discriminated Unions** to model your UI states and API responses robustly.

---

## 🎨 4. Design System (UI/UX Pro Max)

- **Core UI Stack:** **TailwindCSS 4**.
- **Icons:** Pure **SVG icons only**. Emojis are strictly banned inside the actual user interface.
- **Accessibility & Mobile UX:**
  - Maintain a minimum **44x44px touch target** size for all interactive elements to avoid misclicks.
  - Ensure a strict **4.5:1 color contrast ratio** for text readability.
  - Build responsive layouts by default using Tailwind breakpoints (`md:`, `max-md:`, etc.).

---

## 🚀 5. Post-Change Verification Workflow

Before pushing any changes to source control, always run validation checks to ensure zero regressions:

| Step  | Command         | Purpose                                                                |
| ----- | --------------- | ---------------------------------------------------------------------- |
| **1** | `pnpm run lint` | Ensures code style and strict TS compliance match project rules.       |
| **2** | `bun test`      | Executes the Vitest suite to ensure no logic is broken.                |
| **3** | `bun build`     | Compiles the application to catch build-time errors before deployment. |

---

_Knowledge Sync Location: Checkout `.agents/rules` for real-time local updates. Use semantic keyword searches (e.g., searching for `product`, `produit`) to navigate the workspace efficiently._
