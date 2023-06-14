// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Configuration, OpenAIApi } from "openai"

const configuration = new Configuration({
  apiKey: "XXXX",
});
export const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const username = req.body.username;
  const conversation_log = req.body.conversation_log;

  let prompt_text = `
    The task is to try not to laugh. The user will try everything he / she can to make you laugh. If you laugh, you lose. When you laugh, you use this emoji: 😀.
    ${conversation_log}`.trim();

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt_text,
    temperature: 0.7,
    max_tokens: 100,
    stop: [`${username}:`]
});
  const completion = response.data.choices[0].text

  res.status(200).json({ completion })
}

