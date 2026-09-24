<div align="center">

# Orvix

### Code reviews with context from your repository.

Connect GitHub. Index your codebase. Get AI reviews on your pull requests.

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)

[Features](#features) · [How it works](#how-it-works) · [Local setup](#local-setup) · [Configuration](#configuration) · [Development](#development) · [Troubleshooting](#troubleshooting)

</div>

---

Orvix is a GitHub-connected application that generates pull request reviews using the diff and relevant code retrieved from a repository index. It combines GitHub OAuth, background workflows, Gemini, and Pinecone with a dashboard for repositories, review history, and contribution activity.

Reviews are saved in PostgreSQL and posted as a comment on the pull request. Subsequent reviews update the stored review and reuse the existing comment when it is still available.

> **Current scope:** Orvix provides advisory AI reviews. It does not approve pull requests, enforce merge checks, or replace human review. Running the full workflow requires GitHub, Google AI, Pinecone, and an Inngest development server or production environment.

## Features

| Capability | What you get |
| --- | --- |
| **GitHub sign-in** | OAuth authentication through Better Auth, with access to public and private repositories allowed by the account. |
| **Repository connections** | Browse repositories, connect them, and install webhooks for pull request and push events. |
| **Repository context** | Index eligible files from the default branch as overlapping chunks and retrieve related code for reviews. |
| **Incremental indexing** | Refresh changed files and delete removed-file vectors after default-branch pushes. |
| **Automatic reviews** | Queue reviews when a non-draft pull request is opened, reopened, or updated with new commits. |
| **Manual reviews and retries** | Paste an existing open PR URL on the Reviews page or retry a failed review without pushing another commit. |
| **Readable feedback** | Request a walkthrough, summary, strengths, issues, suggestions, an optional sequence diagram, and a closing poem. |
| **Review history** | View the latest 50 reviews with pending, completed, or failed status and failure details. |
| **Activity dashboard** | See GitHub contributions, a contribution heatmap, six-month activity charts, connected repositories, and completed review counts. |
| **Account settings** | Update your profile, manage repository connections, and disconnect GitHub. |

## How it works

```mermaid
flowchart TD
    A[Sign in with GitHub] --> B[Connect a repository]
    B --> C[Install GitHub webhook]
    B --> D[Inngest indexes the default branch]
    D --> E[Gemini embeds code chunks]
    E --> F[(Pinecone repository context)]
    C --> G[Non-draft pull request event]
    G --> H[Queue review in Inngest]
    H --> I[Fetch PR diff and related code]
    F --> I
    I --> J[Gemini generates review]
    J --> K[Create or update GitHub comment]
    K --> L[(Save review in PostgreSQL)]
    C --> M[Default-branch push]
    M --> N[Refresh changed and removed files]
    N --> F
```

### Review lifecycle

1. **Connect:** Orvix creates or reuses a webhook, saves the repository connection, and sends `repository.connected` to Inngest.
2. **Index:** The indexing workflow fetches eligible default-branch files, chunks their contents, generates embeddings, and stores vectors with repository and file metadata.
3. **Trigger:** Signed GitHub webhooks for supported pull request actions create or update a pending review and send `pr.review.requested`.
4. **Retrieve:** The review workflow fetches the diff and uses the pull request title and description to retrieve five related code chunks by default.
5. **Review:** Gemini receives the diff and retrieved context, then generates a Markdown review.
6. **Publish:** Orvix creates or updates a GitHub issue comment on the pull request and stores the completed review. Workflow failures update the review status to `failed`.

| Status | Meaning |
| --- | --- |
| `pending` | The review is queued or running. |
| `completed` | The review was posted to GitHub and saved. |
| `failed` | Queueing or processing failed; the stored error appears on the review card. |

### Events and current limits

- Reviews handle `opened`, `reopened`, and `synchronize` actions; draft pull requests are skipped.
- **Marking a draft ready does not currently trigger a review.** A subsequent commit push or reopen of the non-draft pull request can trigger one.
- Connecting a repository does not automatically review its existing open pull requests. Use the PR URL form on the Reviews page to request one manually.
- Manual reviews and retries require an open, non-draft PR in a repository connected to the signed-in account. Manual requests are rejected while that PR's review is pending.
- Push indexing only handles the repository's default branch and the changed or removed paths present in the webhook payload.
- Initial indexing selects up to **1,500 files**, preferring smaller files. Files must be nonempty and at most **200,000 bytes**.
- Common binary formats, generated directories, build output, and lockfiles are excluded. Downloads with NUL bytes are skipped during initial indexing.
- Code is split into **6,000-character chunks** with **400-character overlap**. Embeddings use **768 dimensions**.
- Initial indexing can be partial when file fetches or individual embeddings fail. Check Inngest runs and server logs before assuming the repository is fully indexed.
- Indexing and reviews run independently; wait for initial indexing to finish before testing a context-backed review.

## Technology stack

| Layer | Implementation |
| --- | --- |
| Application | Next.js 16.3.4 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn components, Base UI, Motion, Lucide icons |
| Client data | TanStack Query |
| Authentication | Better Auth with GitHub OAuth |
| Database | PostgreSQL, Prisma 7, PostgreSQL driver adapter |
| GitHub integration | Octokit, repository webhooks, REST and GraphQL APIs |
| Background workflows | Inngest 4 |
| Review generation | Vercel AI SDK with Google provider; `gemini-3.8-flash` configured in source |
| Embeddings | `gemini-embedding-001`, with 768-dimensional output |
| Vector storage | Pinecone index `orvix-vector-embeddings-v1` |
| Development checks | ESLint, TypeScript, Vitest |

Model identifiers and the Pinecone index name are currently defined in source, rather than environment settings. Confirm that your Google AI account can access the configured models.

## Local setup

### Prerequisites

- **Node.js 22.12+ within the 22.x release line, or Node.js 24+**, and npm. Prisma also supports Node.js 20.19+ within 20.x.
- **Docker with Compose** for the bundled PostgreSQL service, or an existing PostgreSQL database.
- A **GitHub OAuth App** and a repository where you have permission to manage webhooks and post comments.
- A **Google Generative AI API key** with access to the configured models.
- A **Pinecone account and index** configured as described below.
- A publicly reachable **HTTPS URL** for receiving GitHub webhooks. A tunnel to the local application is sufficient for development.

### 1. Install dependencies

From the repository root:

```bash
npm ci
```

The repository includes `package-lock.json`; use npm to keep installation consistent. Prisma Client generation is a separate step below.

### 2. Configure services and environment

Create a `.env` file in the repository root using the [configuration example](#configuration). There is currently no committed `.env.example` file.

**GitHub OAuth App**

Set the homepage to your application URL and the authorization callback to:

```text
http://localhost:3000/api/auth/callback/github
```

This matches the local `BETTER_AUTH_URL` in the example. If you access the app through a public URL instead, update both the OAuth callback and `BETTER_AUTH_URL` to that origin. The OAuth provider requests the `repo` scope; organization policies may require additional approval for repository access.

**Pinecone**

Create a dense-vector index named exactly `orvix-vector-embeddings-v1` with **768 dimensions**. The application supplies its own embeddings. Put the Pinecone API key in `PINECONE_DB_API_KEY`.

**GitHub webhook URL**

Set `NEXT_PUBLIC_APP_BASE_URL` to the public HTTPS origin forwarding to the application on port 3000. Orvix appends `/api/webhooks/github` when it creates webhooks. GitHub cannot deliver events to `localhost`.

Generate separate random values for `BETTER_AUTH_SECRET` and `GITHUB_WEBHOOK_SECRET`. Run this command once for each secret:

```bash
openssl rand -hex 32
```

### 3. Start PostgreSQL and apply migrations

```bash
npm run db:setup
npm run prisma:generate
```

The Docker service uses PostgreSQL 17 with these local development settings:

| Setting | Value |
| --- | --- |
| Host | `localhost` |
| Host port | `5433` |
| Database | `orvix` |
| Username / password | `orvix` / `orvix` |
| Persistent volume | `postgres_data` |

If you use an existing database, set `DATABASE_URL` accordingly and run `npm run prisma:migrate` followed by `npm run prisma:generate`; you can skip Docker.

> Prisma CLI configuration loads `.env` through `dotenv/config`. Keeping the shared configuration in `.env` lets both Prisma commands and Next.js read it.

### 4. Start the application and background workflows

In one terminal:

```bash
npm run dev
```

In another terminal, start the Inngest development server:

```bash
npx --ignore-scripts=false inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest
```

Set `INNGEST_DEV=1` in `.env` before starting the application so events go to the local server. This follows the [Inngest local development guide](https://www.inngest.com/docs/local-development).

| Service | Local address |
| --- | --- |
| Orvix | [localhost:3000](http://localhost:3000) |
| Inngest development UI | [localhost:8288](http://localhost:8288) |
| Inngest application endpoint | [localhost:3000/api/inngest](http://localhost:3000/api/inngest) |

### 5. Try the full workflow

1. Sign in with GitHub and open **Repositories**.
2. Connect a repository where your GitHub account can manage webhooks.
3. In the Inngest UI, confirm that the `repo-index` workflow finishes.
4. Open a non-draft pull request or push a commit to an existing non-draft pull request.
5. Check the `generate-review` run, the **Reviews** page, and the comment on GitHub.
6. Merge or push a change to the default branch and inspect the `repo-reindex` run.

To review an existing open PR, open **Reviews**, paste its GitHub URL, and select **Review PR**. Failed review cards offer **Retry review**. Both actions use the same background workflow and existing GitHub comment update behavior as automatic reviews.

## Configuration

Use this as the starting point for your local `.env`. Replace every placeholder before running the full workflow.

```dotenv
# PostgreSQL — matches compose.yaml
DATABASE_URL=postgresql://orvix:orvix@localhost:5433/orvix

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-random-secret

# GitHub OAuth App
GITHUB_CLIENT_ID=replace-with-your-client-id
GITHUB_CLIENT_SECRET=replace-with-your-client-secret

# GitHub webhooks — public HTTPS origin forwarding to port 3000
NEXT_PUBLIC_APP_BASE_URL=https://replace-with-your-public-host
GITHUB_WEBHOOK_SECRET=replace-with-a-separate-random-secret

# Google AI and Pinecone
GOOGLE_GENERATIVE_AI_API_KEY=replace-with-your-google-api-key
PINECONE_DB_API_KEY=replace-with-your-pinecone-api-key

# Local Inngest development server
INNGEST_DEV=1
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma CLI and the application. |
| `BETTER_AUTH_URL` | Authentication origin; must match the origin used for sign-in and its OAuth callback. |
| `BETTER_AUTH_SECRET` | Secret read by Better Auth for authentication cryptography. |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret. |
| `NEXT_PUBLIC_APP_BASE_URL` | Public origin used to construct the GitHub webhook URL. This value is not a secret. |
| `GITHUB_WEBHOOK_SECRET` | Shared secret for GitHub webhook HMAC verification. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key read by the Google AI SDK provider. |
| `PINECONE_DB_API_KEY` | API key used by the Pinecone client. |
| `INNGEST_DEV` | Set to `1` for the local Inngest server; remove for production. |
| `INNGEST_EVENT_KEY` | Event key for sending events to a production Inngest environment. |
| `INNGEST_SIGNING_KEY` | Signing key for verifying production Inngest requests. |

Environment files are ignored by Git. Keep credentials out of source control and never put secrets in `NEXT_PUBLIC_*` variables.

## Development

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the application for production. |
| `npm start` | Start the production server after building. |
| `npm run lint` | Run ESLint. |
| `npx tsc --noEmit` | Check TypeScript without emitting files. |
| `npm test` | Run Vitest once, including manual review authorization, validation, retry, and queueing tests. |
| `npm run test:watch` | Start Vitest in watch mode. |
| `npm run db:up` | Start PostgreSQL and wait for its health check. |
| `npm run db:down` | Stop the Docker Compose services while retaining the data volume. |
| `npm run db:logs` | Follow database logs. |
| `npm run db:setup` | Start PostgreSQL and apply development migrations. |
| `npm run db:reset` | **Delete the local database volume** and start a fresh database. Reapply migrations afterward. |
| `npm run prisma:generate` | Generate Prisma Client into `lib/generated/prisma`. |
| `npm run prisma:migrate` | Run Prisma development migrations using `prisma7.config.ts`. |
| `npm run prisma:studio` | Open Prisma Studio. |

### Project structure

```text
app/
├── (auth)/login/              GitHub sign-in page
├── api/
│   ├── auth/[...all]/         Better Auth handlers
│   ├── inngest/              Background workflow endpoint
│   └── webhooks/github/      Signed GitHub webhook receiver
├── dashboard/
│   ├── docs/                 In-app workflow documentation
│   ├── repository/           Repository connections
│   ├── reviews/              Review history
│   └── settings/             Profile and account settings
└── page.tsx                  Public landing page
components/                   Shared UI, brand, effects, and providers
inngest/
├── client.ts                 Inngest application client
└── functions/                Initial indexing, reindexing, review generation
lib/                          Authentication, database, sessions, Pinecone
module/
├── ai/                       Embeddings, retrieval, and review queueing
├── auth/                     Login and authentication helpers
├── dashboard/                Activity queries and dashboard UI
├── docs/                     In-app documentation
├── github/                   Octokit integration and webhook event logic
├── landing/                  Landing page components
├── repository/               Repository actions, hooks, and UI
├── review/                   Review queries, hooks, and UI
└── settings/                 Profile and connection management
prisma/                       Database schema and committed migrations
compose.yaml                  Local PostgreSQL service
prisma7.config.ts             Prisma CLI configuration
```

### Useful entry points

- [Database schema](prisma/schema.prisma): users, sessions, OAuth accounts, repository connections, and reviews.
- [GitHub integration](module/github/lib/github.ts): repository access, webhooks, file selection, diffs, and comment publishing.
- [Webhook decisions](module/github/lib/webhook.ts): signature verification and supported events.
- [Embedding and retrieval](module/ai/lib/rag.ts): chunking, vectors, repository filtering, and deletion.
- [Review workflow](inngest/functions/review.ts): model identifier, prompt, persistence, and failure handling.
- [Repository cleanup](module/repository/lib/disconnect-repository.ts): webhook deletion, vector cleanup, and connection removal.

## Deployment

The application needs a Next.js server runtime, PostgreSQL, Pinecone, Google AI access, and a production Inngest environment. A static export alone cannot run its authentication, server actions, webhooks, or workflows.

1. Configure production credentials and public HTTPS origins. Update the GitHub OAuth callback to `https://your-host/api/auth/callback/github`.
2. Remove `INNGEST_DEV` and set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` for the intended Inngest environment.
3. Generate Prisma Client and apply committed migrations to the production database:

   ```bash
   npm ci
   npm run prisma:generate
   npx prisma migrate deploy --config prisma7.config.ts
   npm run build
   ```

4. Run `npm start` on a Node.js host, or use your hosting platform's Next.js deployment integration.
5. Register the public `/api/inngest` endpoint with Inngest and confirm that all three workflows are available.
6. Verify OAuth sign-in, webhook delivery, initial indexing, review publishing, and default-branch reindexing on a test repository.

Use production database credentials; the bundled Compose password is only for local development. Keep `/api/webhooks/github` and `/api/inngest` reachable by their respective services.

If your public origin changes, check existing repository webhook URLs. Updating `NEXT_PUBLIC_APP_BASE_URL` does not rewrite all installed hooks automatically.

## Data and access

- GitHub OAuth requests the `repo` scope, which is broader than read-only public repository access. Connect only repositories you are authorized to process.
- GitHub webhook requests are checked against `GITHUB_WEBHOOK_SECRET` using HMAC-SHA256 and a timing-safe comparison.
- Eligible repository content is sent to Google for embeddings and stored as code text in Pinecone vector metadata. The PR diff, title, description, and retrieved code are sent to Google for review generation.
- PostgreSQL stores user and session records, OAuth account data, repository connections, and review text. The review workflow also includes the GitHub token in an Inngest step result; consider workflow execution data part of your sensitive operational data.
- Disconnecting a repository removes its GitHub webhook and database connection, cascading deletion of its saved reviews. Vector deletion is best effort; failed cleanup may leave orphaned vectors in Pinecone.
- Generated comments already posted on GitHub are not deleted when a repository is disconnected.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Database connection refused | Start Docker and run `npm run db:up`. The local database port is **5433**, not 5432. |
| Prisma Client import cannot be resolved | Run `npm run prisma:generate`; generated files are intentionally ignored by Git. |
| Prisma cannot find the database URL | Put `DATABASE_URL` in the root `.env` and use the scripts that pass `--config prisma7.config.ts`. |
| GitHub sign-in fails | Check the client ID, client secret, `BETTER_AUTH_URL`, and exact OAuth callback URL. |
| Repository connection fails | Confirm repository webhook permissions, organization OAuth restrictions, and a valid stored GitHub token. Use the reconnect flow if authorization expired. |
| GitHub reports a failed webhook delivery | Confirm the public URL reaches `/api/webhooks/github` and the installed webhook secret matches `GITHUB_WEBHOOK_SECRET`. Invalid signatures return HTTP 401. |
| A review stays pending | Check that Inngest is running, `INNGEST_DEV=1` is set locally, and `generate-review` received the event. Inspect its steps and server logs. |
| No review after marking a draft ready | `ready_for_review` is not currently handled. Push a new commit to the non-draft PR or reopen it. |
| Pinecone rejects vectors | Check the API key, exact index name, and **768-dimensional** index configuration. |
| Review generation fails | Inspect the failed Inngest step for Google model access, API quotas, GitHub permissions, or Pinecone errors. Use **Retry review** on the failed card while the PR is open and non-draft. |
| Review context looks incomplete | Check `repo-index` output and logs for file caps, truncation, fetch failures, or embedding failures; also confirm indexing finished before the review. |
| Changes are not reindexed | Confirm the push was to the default branch and that the webhook subscribes to `push` events. |
| Manual review is rejected | Check that the PR URL points to GitHub, the repository is connected to your account, the PR is open and non-draft, and no review is already pending. |

## Contributing

Keep changes focused and reuse the existing modules, shared components, and utilities. Include the reason for the change and relevant verification in your pull request; update documentation when setup or behavior changes.

Read [AGENTS.md](AGENTS.md) for project conventions. Before changing Next.js behavior, consult the documentation bundled with the installed version in `node_modules/next/dist/docs/`.

Run linting and type checks for application changes, and add focused tests for nontrivial behavior. Verify GitHub, AI, or indexing changes with a test repository and inspect the corresponding Inngest runs.

---

<div align="center">

**Orvix** · Repository context, pull request feedback, and review history in one place.

</div>
