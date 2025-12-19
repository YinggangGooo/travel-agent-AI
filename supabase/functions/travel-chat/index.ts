import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL_NAME = 'deepseek-chat';

// Optional: Uncomment and set SERPER_API_KEY as a Supabase secret for real search
const SERPER_API_URL = 'https://google.serper.dev/search';

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_travel_info',
            description: 'Search for travel information from the web (Xiaohongshu, blogs, reviews).',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query in Chinese or English'
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const serperKey = Deno.env.get('SERPER_API_KEY'); // Uncomment for real search

        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { message, userId, history = [] } = await req.json();

        // 1. Memory Retrieval (Simplified: text search, no embeddings)
        let memoryContext = '';
        if (userId) {
            try {
                const { data: memories } = await supabase
                    .from('user_memories')
                    .select('content')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (memories && memories.length > 0) {
                    memoryContext = `\n===User Profile (from previous conversations)===\n${memories.map(m => m.content).join('\n')}\n========\n`;
                }
            } catch (e) {
                console.warn('Memory retrieval failed:', e);
            }
        }

        const systemPrompt = `You are an expert AI Travel Agent. You speak fluently in Chinese and English.

${memoryContext}

When the user asks for recommendations or travel info, use the 'search_travel_info' tool ONCE to find real data.
After receiving search results, synthesize them into a helpful answer.

CRITICAL RULES:
1. NEVER call tools more than once per response
2. NEVER output tool call syntax like <｜DSML｜> tags
3. After using a tool, produce a final human-readable answer based on the tool results
4. If the user tells you personal info (name, preferences), acknowledge it naturally`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6), // Last 3 turns
            { role: 'user', content: message }
        ];

        // 2. First LLM Call (with tools)
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
                stream: false
            })
        });

        const initialData = await initialResponse.json();
        const firstMessage = initialData.choices?.[0]?.message;

        let finalMessages = [...messages];
        let toolsOutput = '';

        // 3. Execute Tools (if requested)
        if (firstMessage?.tool_calls?.length > 0) {
            finalMessages.push(firstMessage);

            for (const toolCall of firstMessage.tool_calls) {
                if (toolCall.function.name === 'search_travel_info') {
                    const args = JSON.parse(toolCall.function.arguments);
                    toolsOutput = `🔍 正在搜索: ${args.query}\n\n`;


                    let searchResults = '';

                    // REAL SEARCH - Using Serper API
                    try {
                        const serperResponse = await fetch(SERPER_API_URL, {
                            method: 'POST',
                            headers: {
                                'X-API-KEY': serperKey!,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ q: args.query, gl: 'cn', hl: 'zh-cn' })
                        });
                        const serperData = await serperResponse.json();
                        searchResults = JSON.stringify(serperData.organic?.slice(0, 5) || []);
                    } catch (e) {
                        console.error('Search failed:', e);
                    }



                    // MOCK SEARCH (Remove when using real search)
                    if (!searchResults) {
                        searchResults = JSON.stringify([
                            { title: "小红书 - 成都旅游攻略", snippet: "2024最全成都美食地图，宽窄巷子必打卡，火锅推荐..." },
                            { title: "成都三日游完美攻略", snippet: "Day1: 锦里-武侯祠; Day2: 大熊猫基地; Day3: 春熙路购物..." },
                            { title: "本地人推荐的成都小吃", snippet: "钟水饺、龙抄手、夫妻肺片、担担面..." }
                        ]);
                    }

                    finalMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: searchResults
                    });
                }
            }
        }

        // 4. Save Memory (before final response)
        if (userId && message.trim().length > 2) {
            try {
                // Check if this looks like personal info
                const isPersonalInfo = /我是|我叫|我喜欢|我爱|我的名字|my name|I am|I like|I love/i.test(message);
                if (isPersonalInfo) {
                    await supabase.from('user_memories').insert({
                        user_id: userId,
                        content: message,
                        embedding: null // No embeddings needed
                    });
                }
            } catch (e) {
                console.error('Memory save failed:', e);
            }
        }

        // 5. Final LLM Call (NO TOOLS - prevents recursion)
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
                // CRITICAL: No 'tools' parameter here!
            })
        });

        // 6. Stream Response
        const reader = finalResponse.body?.getReader();
        if (!reader) throw new Error('No reader');

        const streamResponse = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

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
                                // ignore
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
