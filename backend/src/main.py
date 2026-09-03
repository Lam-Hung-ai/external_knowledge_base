from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder
from ag_ui_langgraph import LangGraphAgent
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import StreamingResponse
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

app = FastAPI()

graph = create_agent(
    model=init_chat_model("openrouter:liquid/lfm-2.5-2.6b:free"),
    system_prompt="You are helpfull asistance",
    checkpointer=MemorySaver(),
)
agent = LangGraphAgent(name="basic agent", graph=graph)


@app.get("/")
def root() -> str:
    return "Hello world"


@app.post("/stream")
async def stream(input: RunAgentInput, request: Request):
    encoder = EventEncoder(accept=request.headers.get("accept", "text/event-stream"))

    async def event_generator():
        async for event in agent.run(input):
            yield encoder.encode(event)

    return StreamingResponse(event_generator(), media_type=encoder.get_content_type())
