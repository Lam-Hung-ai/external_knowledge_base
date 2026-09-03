import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.tools import tool
from langchain_core.runnables import Runnable

from modules.llm.ag_ui_converter import LangChainAGUIAdapter

load_dotenv(dotenv_path="../.env")


@tool
def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"


base_url = "https://openrouter.ai/api/v1"
model = "openrouter:nvidia/nemotron-3.5-lightning:free"
llm = init_chat_model(
    model=model,
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=base_url,
)
agent: Runnable = create_agent(
    model=llm,
    tools=[get_weather],
)
adapter = LangChainAGUIAdapter()
for chunk in agent.stream(
    {
        "messages": [
            {
                "role": "user",
                "content": "What is the weather in Hanoi?",
            }
        ]
    },
    stream_mode=["messages", "updates"],
    version="v2",
):
    # ``transform`` is a generator: consume it to emit each AG-UI event as a
    # JSON line immediately, rather than waiting for the agent stream to end.
    for event in adapter.transform(chunk):
        print(event.model_dump_json(exclude_none=True), flush=True)
