# FastGPT Project Analysis & Development Guide

Based on the [official development documentation](https://doc.fastgpt.io/docs/introduction/development/intro), here is a deep dive into the FastGPT project structure, technology stack, and validation of development difficulty.

## 1. Technology Stack Analysis

The project uses a modern but slightly "mixed" generation stack (not purely latest Next.js 15 App Router standards).

| Component | Technology | detailed Note |
| :--- | :--- | :--- |
| **Framework** | **Next.js (Page Router)** | **Important**: The docs explicitly state it uses `Page Router` (not the newer App Router you use in Compliance-Copilot). This means data fetching patterns (`getServerSideProps`) will differ from your `Server Actions` habits. |
| **Language** | **TypeScript** | Standard strict typing. |
| **Package Manager** | **pnpm** | Uses `pnpm workspace` for Monorepo management. **Version 9.4.0** is recommended. |
| **Database (Data)** | **MongoDB** | Primary storage for application data (Chat logs, Users, Apps). Connection requires `directConnection=true` for Replica Sets. |
| **Database (Vector)** | **PostgreSQL (pgvector)** | Used for vector search (Knowledge Base). The docs mention `hnswEfSearch` parameters for PG. |
| **Architecture** | **Monorepo + DDD** | **Monorepo**: split into `projects/app` (main) and `packages/*` (shared). <br> **DDD (Domain Driven Design)**: Logic split into `core`, `support`, `common`. |
| **Deployment** | **Docker Compose** | Heavily relies on Docker for local dependencies (Mongo, PG, etc.). |

## 2. Development Difficulty Assessment

**Overall Difficulty: Medium-High (4/5)**

If you are comfortable with your current `compliance-copilot` stack, there are some specific hurdles:

### Challenges:
1.  **Architecture Complexity (DDD)**:
    - Code is not just "pages and components". It is strictly layered into `core` (business logic), `service` (backend), `global` (shared types), etc.
    - You cannot just "write functionality in a page component". You must follow their domain logic patterns.
    - *Example*: A change to a "Chat" feature might require touching `packages/core/chat`, `projects/app/api/chat`, and the frontend UI.
2.  **Infrastructure Heavy**:
    - Local dev requires running a heavy Docker Compose stack (Mongo + Postgres + Sandbox/VMs possibly).
    - "System Time" or "DB Connection" issues are common common pitfalls mentioned in their QA section.
3.  **Next.js Page Router**:
    - If you are now used to Next.js 15 App Router + Server Actions, going back to Page Router might feel "legacy" (API Routes `pages/api`, `useSWR`/`react-query` for client fetching, no Server Components).

### Advantages:
1.  **Clear Structure**: Once you understand the `packages/` vs `projects/` split, code reuse is easy.
2.  **Community Edition**: The Open Source version is robust, so plenty of existing patterns to copy.

## 3. Local Development Steps (Simplified)

To start developing locally, you **MUST** have Docker installed.

1.  **Environment Prep**:
    - Install Node.js **v20.14.0** (Strict versioning often helps avoid `isolate-vm` or binding errors).
    - Install `pnpm` (v9.4.0).

2.  **Get Code**:
    ```bash
    git clone https://github.com/labring/FastGPT.git
    cd FastGPT
    ```

3.  **Start Dependencies (Crucial)**:
    You cannot run the app without the DBs.
    ```bash
    cd deploy/dev
    docker compose up -d
    # Wait for Mongo and PG to be healthy
    ```

4.  **Install & Configure**:
    ```bash
    # Root directory
    pnpm i
    
    # Configure App
    cd projects/app
    cp .env.template .env.local
    cp data/config.json data/config.local.json
    ```

5.  **Run**:
    ```bash
    pnpm dev
    # Runs on localhost:3000
    ```

## 4. Key Code Locations
When you want to modify features, look here:

-   **Frontend Pages**: `projects/app/src/pages` (Page Router structure).
-   **Backend API**: `projects/app/src/pages/api` (Standard Next.js API Routes).
-   **Core Business Logic**: `packages/service/core` (Shared backend logic).
-   **UI Components**: Likely in `packages/web/components` or `projects/app/src/components`.

## Recommendation
If you want to learn from this project:
1.  **Study the Monorepo structure**: It's a great example of how to scale Next.js beyond a single app.
2.  **Look at the `packages/service` layer**: See how they decouple DB logic from Next.js API routes.
3.  **Be aware of the router difference**: Do not try to apply App Router patterns (Server Actions, Layouts) directly into this codebase without refactoring.
