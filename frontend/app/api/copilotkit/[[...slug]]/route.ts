
import { createCopilotRuntimeHandler, CopilotRuntime } from "@copilotkit/runtime/v2";
import { LangGraphHttpAgent } from "@ag-ui/langgraph";


const langGraphAgent = new LangGraphHttpAgent({
    url: process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123",
});

const runtime = new CopilotRuntime({
    agents: {
        default: langGraphAgent,
    },
});

const handler = createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
