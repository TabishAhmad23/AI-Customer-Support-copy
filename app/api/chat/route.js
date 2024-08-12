import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a helpful assistant that provides accurate and polite responses. Please help the user in the most effective way possible.";

export async function POST(req) {
  let data;

  // Parse the JSON body of the incoming request
  try {
    data = await req.json(); // Parse the JSON body of the request
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); // Return a 400 error if JSON parsing fails
  }

  // Directly set the API key in the configuration (not recommended for production)
  const configuration = new Configuration({
    apiKey: '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', // Replace with your actual API key
  });
  const openai = new OpenAIApi(configuration); // Initialize the OpenAIApi client with the configuration

  // Create a chat completion request to the OpenAI API
  const completion = await openai.createChatCompletion({
    model: 'gpt-4o-mini', // Specify the model to use
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion.data) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  // Return the stream as the HTTP response
  return new NextResponse(stream);
}

