import { serve } from "inngest/next"
import { inngest } from "../../../inngest/client"
import { indexRepo, generateReview, reindexRepo } from "../../../inngest/functions"

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        indexRepo,
        reindexRepo,
        generateReview
    ]
})