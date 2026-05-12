import http from "node:http";

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/ai-report") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  if (!apiKey) {
    sendJson(response, 500, { error: "DEEPSEEK_API_KEY is not configured" });
    return;
  }

  try {
    const payload = await readJson(request);
    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        reasoning_effort: "high",
        thinking: { type: "enabled" },
        messages: [
          {
            role: "system",
            content:
              "你是农产品光谱质检报告分析助手。请基于输入的样本指标、模型版本、质检提示，输出简洁但多维度的中文总结，覆盖产地判断、品质等级、风险复核、经营建议。不要编造未提供的数据。",
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
    });

    if (!deepseekResponse.ok) {
      sendJson(response, deepseekResponse.status, { error: await deepseekResponse.text() });
      return;
    }

    const data = await deepseekResponse.json();
    sendJson(response, 200, {
      provider: "deepseek",
      summary: data?.choices?.[0]?.message?.content ?? "",
    });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(port, () => {
  console.log(`DeepSeek report proxy listening on http://127.0.0.1:${port}/api/ai-report`);
});
