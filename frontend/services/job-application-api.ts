export interface GenerateJobApplicationRequest {
  jobAdvertisement: string
}

export interface GeneratedApplication {
  id: string
  text: string
}

export interface GenerateJobApplicationResponse {
  application: GeneratedApplication
}

export interface ApplicationSession {
  id: string
  jobAdvertisement: string
  application: GeneratedApplication
}

export async function generateJobApplication(
  request: GenerateJobApplicationRequest,
): Promise<GenerateJobApplicationResponse> {
  if (!request.jobAdvertisement.trim()) {
    throw new Error('A job advertisement is required to generate an application.')
  }

  await new Promise((resolve) => setTimeout(resolve, 900))

  return {
    application: {
      id: `mock-application-${Date.now()}`,
      text: `Dear Hiring Team,\n\nI am excited to apply for this opportunity. My experience and skills align well with the needs described in your job advertisement, and I would welcome the chance to contribute to your team.\n\nThroughout my career, I have developed a strong record of delivering thoughtful, reliable work, collaborating across teams, and adapting quickly to new challenges. I am particularly drawn to this role because it offers the opportunity to make a meaningful impact while continuing to grow professionally.\n\nI would be pleased to discuss how my background could support your organization. Thank you for your time and consideration.\n\nSincerely,\nElena Marković`,
    },
  }
}
