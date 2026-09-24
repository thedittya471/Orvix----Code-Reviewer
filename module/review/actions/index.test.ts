import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    session: vi.fn(), repository: vi.fn(), token: vi.fn(), pull: vi.fn(),
    create: vi.fn(), claim: vi.fn(), queue: vi.fn()
}))

vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }))
vi.mock("@/lib/db", () => ({ default: {
    repository: { findFirst: mocks.repository },
    review: { createMany: mocks.create, updateMany: mocks.claim }
} }))
vi.mock("@/module/github/lib/github", () => ({
    getGithubToken: mocks.token,
    githubClient: () => ({ rest: { pulls: { get: mocks.pull } } })
}))
vi.mock("@/module/ai/actions", () => ({ reviewPullRequest: mocks.queue }))

import { requestReview } from "./index"

beforeEach(() => {
    vi.resetAllMocks()
    mocks.session.mockResolvedValue({ user: { id: "user-1" } })
    mocks.repository.mockResolvedValue({ id: "repo-1", owner: "owner", name: "repo" })
    mocks.token.mockResolvedValue("token")
    mocks.pull.mockResolvedValue({ data: { state: "open", draft: false, title: "Fix bug" } })
    mocks.create.mockResolvedValue({ count: 1 })
    mocks.claim.mockResolvedValue({ count: 1 })
    mocks.queue.mockResolvedValue({ success: true, message: "Review queued" })
})

const url = "https://github.com/owner/repo/pull/42"

describe("requestReview", () => {
    it("requires authentication before accessing repositories", async () => {
        mocks.session.mockResolvedValue(null)
        await expect(requestReview(url)).rejects.toThrow("Unauthorized")
        expect(mocks.repository).not.toHaveBeenCalled()
    })

    it.each([
        "https://example.com/owner/repo/pull/42",
        "https://github.com.evil.com/owner/repo/pull/42",
        "https://github.com/owner/repo/issues/42",
        "https://github.com/owner/repo/pull/0",
        "https://github.com/owner/repo/pull/1.5",
        "https://github.com/owner/repo/pull/9007199254740992",
        "not a URL"
    ])("rejects invalid PR URLs: %s", async (input) => {
        await expect(requestReview(input)).resolves.toEqual({ success: false, message: expect.stringContaining("Enter a valid GitHub pull request URL") })
        expect(mocks.repository).not.toHaveBeenCalled()
    })

    it("rejects repositories not connected to the current user", async () => {
        mocks.repository.mockResolvedValue(null)
        await expect(requestReview(url)).resolves.toEqual({ success: false, message: expect.stringContaining("Connect this repository") })
        expect(mocks.repository).toHaveBeenCalledWith(expect.objectContaining({
            where: { owner: { equals: "owner", mode: "insensitive" }, name: { equals: "repo", mode: "insensitive" }, userId: "user-1" }
        }))
        expect(mocks.pull).not.toHaveBeenCalled()
    })

    it.each([{ state: "closed", draft: false }, { state: "open", draft: true }])(
        "rejects closed or draft pull requests: %j", async (pr) => {
            mocks.pull.mockResolvedValue({ data: { ...pr, title: "PR" } })
            await expect(requestReview(url)).resolves.toEqual({ success: false, message: expect.stringContaining("open, non-draft") })
            expect(mocks.create).not.toHaveBeenCalled()
        }
    )

    it("queues an existing open PR using its GitHub title", async () => {
        await expect(requestReview(url)).resolves.toEqual({ success: true, message: "Review queued" })
        expect(mocks.queue).toHaveBeenCalledWith("owner", "repo", 42, "Fix bug")
    })

    it("atomically claims a failed review without replacing its previous content or comment", async () => {
        mocks.create.mockResolvedValue({ count: 0 })
        await requestReview(url)
        expect(mocks.claim).toHaveBeenCalledWith({
            where: { repositoryId: "repo-1", prNumber: 42, status: { not: "pending" } },
            data: { status: "pending", error: null, prTitle: "Fix bug" }
        })
        expect(mocks.queue).toHaveBeenCalledOnce()
    })

    it("does not queue an already pending review", async () => {
        mocks.create.mockResolvedValue({ count: 0 })
        mocks.claim.mockResolvedValue({ count: 0 })
        await expect(requestReview(url)).resolves.toEqual({ success: false, message: expect.stringContaining("already queued") })
        expect(mocks.queue).not.toHaveBeenCalled()
    })

    it("queues once when two manual requests compete for the same PR", async () => {
        mocks.create.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
        mocks.claim.mockResolvedValue({ count: 0 })
        const results = await Promise.all([requestReview(url), requestReview(url)])
        expect(results.filter((result) => result.success)).toHaveLength(1)
        expect(mocks.queue).toHaveBeenCalledOnce()
    })

    it("accepts PR links copied with a query string or fragment", async () => {
        await expect(requestReview(`${url}?tab=files#discussion`)).resolves.toEqual({ success: true, message: "Review queued" })
    })

    it("returns a safe error when GitHub cannot retrieve the PR", async () => {
        mocks.pull.mockRejectedValue(new Error("private provider details"))
        await expect(requestReview(url)).resolves.toEqual({ success: false, message: expect.stringContaining("Could not load") })
        expect(mocks.create).not.toHaveBeenCalled()
    })

    it("reports queue failures and releases the pending claim", async () => {
        mocks.queue.mockResolvedValue({ success: false, message: "internal queue error" })
        await expect(requestReview(url)).resolves.toEqual({ success: false, message: expect.stringContaining("Could not queue") })
        expect(mocks.claim).toHaveBeenLastCalledWith({
            where: { repositoryId: "repo-1", prNumber: 42, status: "pending" },
            data: { status: "failed", error: "Could not queue the review. Please try again." }
        })
    })
})
