from collections.abc import AsyncIterable

from fastapi import FastAPI
from fastapi.sse import EventSourceResponse, ServerSentEvent

app = FastAPI()


@app.get("/chat", response_class=EventSourceResponse)
async def chat_stream() -> AsyncIterable[ServerSentEvent]:
    texts = ["Hello", "My", "name", "is", "Hung"]
    for text in texts:
        yield ServerSentEvent(data=text, event="token")
    print("Done")
    yield ServerSentEvent(data="[Done]", event="done")
