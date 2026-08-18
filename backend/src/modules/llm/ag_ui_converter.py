import json
from collections.abc import Generator, Iterable
from typing import Any, Literal
from uuid import uuid7

from ag_ui.core import (
    BaseEvent,
    ReasoningMessageContentEvent,
    ReasoningMessageEndEvent,
    ReasoningMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from langchain_core.messages import AIMessageChunk, ToolMessage

from .base import AGUIStreamAdapter


class LangChainAGUIAdapter(AGUIStreamAdapter):
    """Convert LangChain ``AIMessageChunk`` instances into AG-UI events.

    LangChain streams a tool call as several ``tool_call_chunks``. Only the
    first chunk normally has a name and id; later chunks identify the call by
    ``index`` and contain argument deltas. This adapter retains that mapping so
    each ``TOOL_CALL_ARGS`` is preceded by a ``TOOL_CALL_START``.
    """

    def __init__(self) -> None:
        self.message_id = ""
        self.reasoning_id = ""
        self.tool_call_ids: list[str] = []
        self._tool_call_ids_by_index: dict[int | str, str] = {}

    def _emit_end_text(self) -> Generator[BaseEvent]:
        if self.message_id:
            yield TextMessageEndEvent(message_id=self.message_id)
            self.message_id = ""

    def _emit_end_reasoning(self) -> Generator[BaseEvent]:
        if self.reasoning_id:
            yield ReasoningMessageEndEvent(message_id=self.reasoning_id)
            self.reasoning_id = ""

    def _emit_end_tool_calls(self) -> Generator[BaseEvent]:
        for tool_call_id in self.tool_call_ids:
            yield ToolCallEndEvent(tool_call_id=tool_call_id)
        self.tool_call_ids = []
        self._tool_call_ids_by_index = {}

    def _emit_end_events(
        self, exclude: Literal["text", "reasoning", "tool_call"]
    ) -> Generator[BaseEvent]:
        if exclude != "text":
            yield from self._emit_end_text()
        if exclude != "reasoning":
            yield from self._emit_end_reasoning()
        if exclude != "tool_call":
            yield from self._emit_end_tool_calls()

    @staticmethod
    def _chunk_value(chunk: Any, key: str) -> Any:
        return chunk.get(key) if isinstance(chunk, dict) else getattr(chunk, key, None)

    @staticmethod
    def _tool_result_content(content: Any) -> str:
        """AG-UI requires tool-result content to be a string."""
        if isinstance(content, str):
            return content
        return json.dumps(content, ensure_ascii=False, default=str)

    def _stream_tool_call_chunks(
        self, chunks: Iterable[Any], parent_message_id: str
    ) -> Generator[BaseEvent]:
        for position, tool_chunk in enumerate(chunks):
            # ``index`` is preserved after the initial chunk. Use the position
            # only for providers that omit it.
            index = self._chunk_value(tool_chunk, "index")
            call_key: int | str = index if index is not None else f"position:{position}"
            name = self._chunk_value(tool_chunk, "name")
            provided_id = self._chunk_value(tool_chunk, "id")
            tool_call_id = self._tool_call_ids_by_index.get(call_key)

            # A new name with a different id is the boundary between two
            # sequentially streamed (possibly parallel) tool calls.
            if name and tool_call_id and provided_id and provided_id != tool_call_id:
                yield ToolCallEndEvent(tool_call_id=tool_call_id)
                self.tool_call_ids.remove(tool_call_id)
                tool_call_id = None

            if name and not tool_call_id:
                tool_call_id = str(provided_id or uuid7())
                self._tool_call_ids_by_index[call_key] = tool_call_id
                self.tool_call_ids.append(tool_call_id)
                yield ToolCallStartEvent(
                    tool_call_id=tool_call_id,
                    tool_call_name=str(name),
                )

            args = self._chunk_value(tool_chunk, "args")
            # Empty strings are no-op chunks. Do not emit args before a start.
            if tool_call_id and args:
                yield ToolCallArgsEvent(tool_call_id=tool_call_id, delta=str(args))

    def transform(self, chunk: dict[str, Any]) -> Generator[BaseEvent]:
        if chunk.get("type") != "messages":
            return

        token, _ = chunk["data"]
        if isinstance(token, ToolMessage):
            # A ToolMessage is emitted after tool execution. Its ``id`` is the
            # tool-result message ID; ``tool_call_id`` links it to the call.
            yield from self._emit_end_tool_calls()
            yield ToolCallResultEvent(
                message_id=str(token.id or token.tool_call_id or uuid7()),
                tool_call_id=str(token.tool_call_id),
                content=self._tool_result_content(token.content),
                role="tool",
            )
            return

        if not isinstance(token, AIMessageChunk):
            return

        reasoning_content = token.additional_kwargs.get("reasoning_content")
        if reasoning_content:
            if not self.reasoning_id:
                yield from self._emit_end_events(exclude="reasoning")
                # ``token.id`` is stable for every chunk in one LangChain
                # model invocation. Keep it traceable, while the suffix keeps
                # the reasoning message distinct from its assistant text.
                self.reasoning_id = (
                    f"{token.id}:reasoning" if token.id else str(uuid7())
                )
                yield ReasoningMessageStartEvent(
                    message_id=self.reasoning_id, role="reasoning"
                )
            yield ReasoningMessageContentEvent(
                message_id=self.reasoning_id, delta=str(reasoning_content)
            )
        elif token.tool_call_chunks:
            yield from self._emit_end_events(exclude="tool_call")
            parent_message_id = str(token.id or self.message_id or uuid7())
            yield from self._stream_tool_call_chunks(
                token.tool_call_chunks, parent_message_id
            )
        elif token.text:
            yield from self._emit_end_events(exclude="text")
            if not self.message_id:
                self.message_id = str(token.id or uuid7())
                yield TextMessageStartEvent(
                    message_id=self.message_id, role="assistant"
                )
            yield TextMessageContentEvent(
                message_id=self.message_id, delta=str(token.text)
            )

        # LangChain emits a final empty chunk with ``chunk_position == "last"``.
        # Close all open AG-UI lifecycles so the stream satisfies the protocol.
        if token.chunk_position == "last":
            yield from self._emit_end_text()
            yield from self._emit_end_reasoning()
            yield from self._emit_end_tool_calls()
