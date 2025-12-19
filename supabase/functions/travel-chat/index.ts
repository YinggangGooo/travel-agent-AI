import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL_NAME = 'deepseek-chat';

// Tool Definition
const tools = [
    {
        type: 'function',
        function: {
            name: 'search_travel_info',
            description: 'Search for travel information, guides, and reviews primarily from Xiaohongshu (Little Red Book) and other travel sites.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query optimized for finding travel guides (e.g., "Kyoto food guide xiaohongshu")'
                    },
                    platform: {
                        type: 'string',
                        enum: ['xiaohongshu', 'general'],
                        description: 'Preferred platform for information.'
                    }
                },
                required: ['query']
            }
        }
    }
];

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables (DEEPSEEK_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY)');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { message, stream = false, history = [], userId } = await req.json();

        // 1. Memory Retrieval (Semantic Search)
        let memoryContext = '';
        if (userId) {
            try {
                // Generate embedding for the new message
                const embeddingResponse = await fetch('https://api.deepseek.com/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-embedding", // Assuming DeepSeek has an embedding model, otherwise use OpenAI or skip
                        input: message
                    })
                });

                // Note: If DeepSeek doesn't support embeddings standardly, we might skip this or use a different provider.
                // For robustness in this demo, we will try retrieval if embedding works, else skip.
                if (embeddingResponse.ok) {
                    const embeddingData = await embeddingResponse.json();
                    const embedding = embeddingData.data?.[0]?.embedding;

                    if (embedding) {
                        const { data: memories } = await supabase.rpc('match_memories', {
                            query_embedding: embedding,
                            match_threshold: 0.7,
                            match_count: 5,
                            p_user_id: userId
                        });

                        if (memories && memories.length > 0) {
                            memoryContext = `\nRelevant User Memories:\n${memories.map((m: any) => `- ${m.content}`).join('\n')}\n`;
                        }
                    }
                }
            } catch (e) {
                console.warn('Memory retrieval failed:', e);
            }
        }

        const systemPrompt = `You are an expert AI Travel Agent specializing in creating personalized travel plans.
    You have access to real-time travel information and user memories.
    
    ${memoryContext ? memoryContext : 'No previous memories found.'}
    
    If the user asks for specific recommendations (food, spots, guides), use the 'search_travel_info' tool to find "Xiaohongshu" style reviews.
    Always reply in the user's preferred language (likely Chinese).
    IMPORTANT: Do not output internal thought tags or XML-like thinking process. Just output the final response.
    `;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
        ];

        // 2. Call LLM (First Pass)
        const initialResponse = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                tools,
                stream: false // First call is not streamed to handle tool logic easier
            })
        });

        const initialData = await initialResponse.json();
        const firstMessage = initialData.choices?.[0]?.message;

        // 3. Handle Tool Calls
        let finalMessages = [...messages];
        let toolsOutput = '';

        if (firstMessage?.tool_calls?.length > 0) {
            finalMessages.push(firstMessage);

            for (const toolCall of firstMessage.tool_calls) {
                if (toolCall.function.name === 'search_travel_info') {
                    const args = JSON.parse(toolCall.function.arguments);
                    toolsOutput += `🔍 Searching ${args.platform || 'general'} for: ${args.query}\n`;

                    // MOCK IMPLEMENTATION OF SEARCH
                    // In a real app, you would call a Serper/Google API here.
                    const mockResult = JSON.stringify({
                        results: [
                            { title: `Top things to do in ${args.query}`, snippet: "Found great guides on Xiaohongshu about local food and hidden gems." },
                            { title: "Travel Guide 2024", snippet: "Latest trends and tips for travelers." }
                        ]
                    });

                    finalMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: mockResult
                    });
                }
            }
        }

        // 4. Save Memory (Before Streaming Response to guarantee execution)
        if (userId && message.length > 2) {
            try {
                // Generate embedding
                const embeddingRes = await fetch('https://api.deepseek.com/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-embedding",
                        input: message
                    })
                });

                if (embeddingRes.ok) {
                    const data = await embeddingRes.json();
                    const embedding = data.data?.[0]?.embedding;

                    if (embedding) {
                        // We do not await this insert to prevent blocking the UI *too* much, 
                        // but we start it before the stream loop.
                        // Actually, to be safe, we await it. It's better to be 200ms slower than broken.
                        await supabase.from('user_memories').insert({
                            user_id: userId,
                            content: message,
                            embedding: embedding
                        });
                    }
                }
            } catch (e) {
                console.error('Memory save failed:', e);
            }
        }

        // 5. Final Generation (Streaming)
        const finalResponse = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: finalMessages,
                stream: true
                // tools removed here to prevent recursive loop
            })
        });

        // 6. Stream Handling to Frontend
        const reader = finalResponse.body?.getReader();
        if (!reader) throw new Error('No reader');

        const streamResponse = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                // Send tool usage info first if any
                if (toolsOutput) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tools', content: toolsOutput })}\n\n`));
                }

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const content = data.choices[0].delta.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                                }
                            } catch (e) {
                                // ignore parse errors
                            }
                        }
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            }
        });

        return new Response(streamResponse, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
