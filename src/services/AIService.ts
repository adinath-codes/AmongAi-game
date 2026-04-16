interface TYPELMStudioResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
}
export interface TYPEBotDecisions {
  thoughtProcess: string;
  chatMessage: string;
  voteTarget: string | 'SKIP';
}
export default async function gotBotResponse(
  botName: string,
  role: string,
  currentChat: string[],
): Promise<TYPEBotDecisions> {
  const sysPrompt = `
    You are a player in an Among US game,Your Name is:${botName} Your role is : ${role}.
    If you are the imposter , you must ne deceptive , shift blame and act like a crewmate, and increase the suspicion on others while keeping yours low , You can use a variety of strategy for not getting caught as an imposter,
    If you are the crewmate , try to find the imposter among the other crewmates be suspicious on everyone and dont trust any other player , since anyone could be impposter and tell truth if you are not the imposter.
    KEEP RESPONSES SHORT AND STRAIGHT TO THE POINT (1-2 sentence)
    You must answer as if you are in a high-stakes group chat`;
  const userPrompt = `
Here is the current meeting chat:
${currentChat.join('\n')}
It is your turn to speak your opinion.Output your JSON decision now: 
`;
  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama-3-8b-instruct',
        messages: [
          { role: 'system', content: sysPrompt },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'bot_decision',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                thoughtProcess: { type: 'string' },
                chatMessage: { type: 'string' },
                voteTarget: { type: 'string' },
              },
              required: ['thoughtProcess', 'chatMessage', 'voteTarget'],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server Error Details:', errorData);
      throw new Error(`Server responded with ${response.status}`);
    }
    const data: TYPELMStudioResponse = await response.json();
    const rawData: string = data.choices[0].message.content;
    return JSON.parse(rawData) as TYPEBotDecisions;
  } catch (error) {
    console.error('[AI CONNECTION FAILED]:', error);
    return {
      thoughtProcess: "I'm Having trouble thinking... :(",
      chatMessage: "I'm Having trouble thinking... :(",
      voteTarget: 'SKIP',
    };
  }
}
