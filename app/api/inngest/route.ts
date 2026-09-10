import { serve } from "inngest/next"
import { inngest } from "../../../inngest/client"
import { processTask, indexRepo, generateReview } from "../../../inngest/functions"

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        processTask,
        indexRepo,
        generateReview
    ]
})