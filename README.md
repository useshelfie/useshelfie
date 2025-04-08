# 📚 Shelfie — Electronic Catalog App

Shelfie is a beautiful and intelligent electronic catalog platform. It allows users to create and share rich, multimedia product collections — optimized for mobile and web.

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Vercel Edge Functions / Serverless
- **Database**: Supabase (PostgreSQL) with RLS enabled
- **Media**: Supabase Storage
- **Auth**: Supabase Auth
- **AI**: OpenAI API (for product descriptions)
- **Video**: Remotion (for catalog promo videos)

---

## 🛠️ Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd useshelfie
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Run the development server:**
   ```bash
   pnpm dev
   ```

---

## 🧠 Husky Git Hooks

We use [Husky](https://typicode.github.io/husky/) to automate checks during Git operations:

| Hook         | Script                      | Purpose                                   |
| ------------ | --------------------------- | ----------------------------------------- |
| `commit-msg` | `pnpm commitlint --edit $1` | Ensures commit messages follow convention |
| `post-merge` | `pnpm install -r`           | Reinstalls deps after pulling updates     |
| `pre-commit` | `pnpm lint-staged`          | Lints only staged files                   |
| `pre-push`   | `pnpm test`                 | Runs tests before pushing code            |
| `pre-rebase` | `pnpm lint`                 | Lints full project before rebasing        |

---

## 🧼 Linting & Formatting

We use:

- **ESLint** for code quality
- **Prettier** for consistent formatting
- **lint-staged** to run checks only on staged files

---

## 🧾 Commit Messages

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

Examples:

```bash
feat: add catalog sharing feature
fix: correct product card layout on mobile
chore: update dependencies
```

---

## 🧬 Database (Supabase)

- Functions use `SECURITY INVOKER`, proper `search_path`, and typed params.
- Migrations follow: `YYYYMMDDHHmmss_short_description.sql`
- RLS policies use `auth.uid()` and are enabled for all operations.

---

## 🧑‍💻 Development Guidelines

- Use **TypeScript best practices** and keep code **DRY**
- Use **Tailwind CSS** for styling
- Ensure **accessibility** in UI components

---

## 🛡️ Postgres SQL Style Guide

- Use lowercase for SQL keywords
- Use `snake_case` for tables/columns
- Prefer plural table names

---

## 🌐 Supabase Edge Functions

- Use Deno’s core APIs and Web APIs
- Avoid bare specifiers
- Use `EdgeRuntime.waitUntil(promise)` where needed

---

## 🤝 Contributing

We welcome contributions! Please follow our guidelines and use the provided tooling (lint, commitlint, tests) before submitting a PR.

---

## 📄 License

MIT © Shelfie

---
