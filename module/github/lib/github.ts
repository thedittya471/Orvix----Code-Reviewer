import { Octokit } from "octokit"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { headers } from "next/headers"


// Getting the github access token 
export const getGithubToken = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "github"
        }
    })

    if (!account?.accessToken) {
        throw new Error("No Github token found")
    }

    return account.accessToken;
}

export async function fetchUserContribution(token: string, username: string) {
    const octokit = new Octokit({ auth: token })

    const query = `
    query($username:String!){
        user(login:$username)
            contributionCalender{
                totalContributions
                weeks{
                    contributionDays{
                        contributionCount
                        data
                        color
                    }
                }
            }
        }
    }
    `
    interface contributiondata {
        user: {
            contributionCollection: {
                contributionCalendar: {
                    totalContributions: number
                    weeks: {
                        forEach(arg0: (week: any) => void): unknown
                        contributionDays: {
                            contributionCount: number
                            data: string
                            color: string
                        }
                    }
                }
            }
        }
    }

    try {
        const response:contributiondata = await octokit.graphql<contributiondata>(query, {
            username
        })

        return response.user.contributionCollection.contributionCalendar
    } catch (error) {
        console.log("Error fetching contribution:", error)
        throw new Error("Error fetching contribution data")
    }
}

