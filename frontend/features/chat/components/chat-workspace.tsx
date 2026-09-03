"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
import { Logo } from "@/components/logo/logo";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { createChat, touchChat } from "@/features/chat/chat.actions";
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { useStream } from "@langchain/react";
import { AlertCircleIcon, MessageCircleIcon, RotateCcwIcon } from "lucide-react";
import { useMemo, useState } from "react";

const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";

type AgentState = {
  messages: BaseMessage[];
  llm_calls?: number;
};

type StreamToolCall = {
  name: string;
  callId: string;
  input: unknown;
  output: unknown | null;
  status: "running" | "finished" | "error";
  error?: string;
};

type DisplayToolCall = StreamToolCall & {
  key: string;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Đã có lỗi khi kết nối với agent. Vui lòng thử lại.";
};

const toToolState = (
  status: StreamToolCall["status"],
): ToolPart["state"] => {
  if (status === "finished") {
    return "output-available";
  }

  if (status === "error") {
    return "output-error";
  }

  return "input-available";
};

const renderToolOutput = (output: unknown) => {
  if (typeof output === "string") {
    return <p className="whitespace-pre-wrap px-3 py-2">{output}</p>;
  }

  return output;
};

function AgentTool({ call }: { call: DisplayToolCall }) {
  const state = toToolState(call.status);

  return (
    <Tool defaultOpen={call.status !== "finished"}>
      <ToolHeader
        state={state}
        title={call.name}
        toolName={call.name}
        type="dynamic-tool"
      />
      <ToolContent>
        <ToolInput input={call.input} />
        <ToolOutput
          errorText={call.error}
          output={renderToolOutput(call.output)}
        />
      </ToolContent>
    </Tool>
  );
}

function LoadingMessage({ label = "Agent đang suy nghĩ…" }: { label?: string }) {
  return (
    <Message from="assistant">
      <MessageContent className="flex-row items-center gap-2 text-muted-foreground">
        <Spinner />
        <span>{label}</span>
      </MessageContent>
    </Message>
  );
}

export function ChatWorkspace({
  threadId,
  title,
}: {
  threadId: string | null;
  title?: string | null;
}) {
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(threadId);
  const [displayTitle, setDisplayTitle] = useState(title ?? "Cuộc trò chuyện mới");
  const [pendingNewMessage, setPendingNewMessage] = useState<string | null>(
    null,
  );
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const stream = useStream<AgentState>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: "my_agent",
    threadId,
  });

  const toolMessagesByCallId = useMemo(() => {
    const result = new Map<string, ToolMessage>();

    for (const message of stream.messages) {
      if (ToolMessage.isInstance(message)) {
        result.set(message.tool_call_id, message);
      }
    }

    return result;
  }, [stream.messages]);

  const streamedToolCallsById = useMemo(() => {
    const result = new Map<string, StreamToolCall>();

    for (const call of stream.toolCalls) {
      result.set(call.callId, call);
    }

    return result;
  }, [stream.toolCalls]);

  const messageToolCallIds = useMemo(() => {
    const ids = new Set<string>();

    for (const message of stream.messages) {
      if (!AIMessage.isInstance(message)) {
        continue;
      }

      for (const call of message.tool_calls ?? []) {
        if (call.id) {
          ids.add(call.id);
        }
      }
    }

    return ids;
  }, [stream.messages]);

  const orphanToolCalls = useMemo(
    () =>
      stream.toolCalls
        .filter((call) => !messageToolCallIds.has(call.callId))
        .map((call) => ({ ...call, key: call.callId })),
    [messageToolCallIds, stream.toolCalls],
  );

  const lastAiMessageIndex = stream.messages.findLastIndex((message) =>
    AIMessage.isInstance(message),
  );
  const lastVisibleMessage = stream.messages.findLast(
    (message) =>
      HumanMessage.isInstance(message) || AIMessage.isInstance(message),
  );
  const isWaitingForFirstToken =
    stream.isLoading &&
    (!lastVisibleMessage || HumanMessage.isInstance(lastVisibleMessage));
  const errorMessage = localError ??
    (stream.error ? toErrorMessage(stream.error) : null);
  const isBlocked = isCreating || stream.isThreadLoading;
  const canSubmit =
    input.trim().length > 0 && !isBlocked && !stream.isLoading;

  const getMessageToolCalls = (message: AIMessage): DisplayToolCall[] =>
    (message.tool_calls ?? []).map((messageCall, index) => {
      const callId = messageCall.id ?? `${message.id ?? "tool"}-${index}`;
      const streamedCall = messageCall.id
        ? streamedToolCallsById.get(messageCall.id)
        : undefined;
      const toolMessage = messageCall.id
        ? toolMessagesByCallId.get(messageCall.id)
        : undefined;
      const status =
        streamedCall?.status ??
        (toolMessage
          ? toolMessage.status === "error"
            ? "error"
            : "finished"
          : "running");

      return {
        callId,
        error:
          streamedCall?.error ??
          (toolMessage?.status === "error" ? toolMessage.text : undefined),
        input: streamedCall?.input ?? messageCall.args,
        key: callId,
        name: streamedCall?.name ?? messageCall.name,
        output: streamedCall?.output ?? toolMessage?.text ?? null,
        status,
      };
    });

  const submitToThread = (
    text: string,
    targetThreadId: string,
    messageId = crypto.randomUUID(),
  ) => {
    setLastSubmittedMessage({ id: messageId, text });
    setLocalError(null);

    const run = stream.submit(
      { messages: [new HumanMessage({ content: text, id: messageId })] },
      { threadId: targetThreadId },
    );

    void touchChat(targetThreadId);
    void run.catch((error: unknown) => setLocalError(toErrorMessage(error)));
  };

  const handleSubmit = async ({ text }: { text: string }) => {
    const normalizedText = text.trim();
    if (!normalizedText || isBlocked || stream.isLoading) {
      return;
    }

    let targetThreadId = activeThreadId ?? stream.threadId;

    if (!targetThreadId) {
      setIsCreating(true);
      setPendingNewMessage(normalizedText);
      setLocalError(null);

      const result = await createChat(normalizedText);
      if (!result.success) {
        setIsCreating(false);
        setPendingNewMessage(null);
        setLocalError(result.error);
        throw new Error(result.error);
      }

      targetThreadId = result.data.id;
      setActiveThreadId(targetThreadId);
      setDisplayTitle(result.data.title);
      window.history.replaceState(null, "", `/chat/${targetThreadId}`);
    }

    submitToThread(normalizedText, targetThreadId);
    setInput("");
    setPendingNewMessage(null);
    setIsCreating(false);
  };

  const handleRetry = () => {
    const targetThreadId = activeThreadId ?? stream.threadId;
    if (!lastSubmittedMessage || !targetThreadId || stream.isLoading) {
      window.location.reload();
      return;
    }

    submitToThread(
      lastSubmittedMessage.text,
      targetThreadId,
      lastSubmittedMessage.id,
    );
  };

  return (
    <main className="flex size-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3 md:px-5">
        <SidebarTrigger className="md:hidden" />
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {displayTitle}
        </h1>
        {stream.isLoading && (
          <span className="flex items-center gap-2 text-muted-foreground text-xs">
            <Spinner /> Đang trả lời
          </span>
        )}
      </header>

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-8 md:px-6">
          {stream.isThreadLoading && stream.messages.length === 0 ? (
            <ConversationEmptyState
              className="min-h-[60vh]"
              description="Đang lấy message, reasoning và tool call từ checkpoint."
              icon={<Spinner className="size-6" />}
              title="Đang tải cuộc trò chuyện"
            />
          ) : stream.messages.length === 0 && !pendingNewMessage ? (
            <ConversationEmptyState
              className="min-h-[60vh]"
              description="Hãy đặt câu hỏi. Agent có thể tự dùng công cụ tính toán khi cần."
              icon={<MessageCircleIcon className="size-8" />}
              title="Bạn muốn hỏi gì?"
            >
              <Logo className="text-xl md:text-2xl" />

            </ConversationEmptyState>
          ) : (
            <>
              {stream.messages.map((message, messageIndex) => {
                if (HumanMessage.isInstance(message)) {
                  return (
                    <Message
                      from="user"
                      key={message.id ?? `human-${messageIndex}`}
                    >
                      <MessageContent className="whitespace-pre-wrap break-words">
                        {message.text}
                      </MessageContent>
                    </Message>
                  );
                }

                if (!AIMessage.isInstance(message)) {
                  return null;
                }

                const contentBlocks = message.contentBlocks;
                const reasoning = contentBlocks
                  .filter((block) => block.type === "reasoning")
                  .map((block) => block.reasoning)
                  .filter(Boolean)
                  .join("\n\n");
                const toolCalls = getMessageToolCalls(message);
                const isReasoningStreaming =
                  stream.isLoading &&
                  messageIndex === lastAiMessageIndex &&
                  contentBlocks.at(-1)?.type === "reasoning";

                if (!reasoning && !message.text && toolCalls.length === 0) {
                  return null;
                }

                return (
                  <Message
                    from="assistant"
                    key={message.id ?? `assistant-${messageIndex}`}
                  >
                    <MessageContent className="w-full">
                      {reasoning && (
                        <Reasoning isStreaming={isReasoningStreaming}>
                          <ReasoningTrigger />
                          <ReasoningContent>{reasoning}</ReasoningContent>
                        </Reasoning>
                      )}

                      {toolCalls.map((call) => (
                        <AgentTool call={call} key={call.key} />
                      ))}

                      {message.text && (
                        <MessageResponse
                          isAnimating={
                            stream.isLoading &&
                            messageIndex === lastAiMessageIndex
                          }
                        >
                          {message.text}
                        </MessageResponse>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {pendingNewMessage && (
                <Message from="user">
                  <MessageContent className="whitespace-pre-wrap break-words">
                    {pendingNewMessage}
                  </MessageContent>
                </Message>
              )}

              {orphanToolCalls.length > 0 && (
                <Message from="assistant">
                  <MessageContent className="w-full">
                    {orphanToolCalls.map((call) => (
                      <AgentTool call={call} key={call.key} />
                    ))}
                  </MessageContent>
                </Message>
              )}

              {(isCreating || isWaitingForFirstToken) && <LoadingMessage />}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t bg-background/95 px-3 py-3 backdrop-blur md:px-6 md:py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {errorMessage && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
              role="alert"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="min-w-0 flex-1 break-words">{errorMessage}</p>
              <Button
                disabled={stream.isLoading || isCreating}
                onClick={handleRetry}
                size="sm"
                type="button"
                variant="outline"
              >
                <RotateCcwIcon />
                Thử lại
              </Button>
            </div>
          )}

          <PromptInput
            className="rounded-2xl shadow-sm"
            onSubmit={handleSubmit}
          >
            <PromptInputBody>
              <PromptInputTextarea
                disabled={isBlocked || stream.isLoading}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="Nhập câu hỏi của bạn…"
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <span className="px-1 text-muted-foreground text-xs">
                  Enter để gửi · Shift+Enter để xuống dòng
                </span>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={stream.isLoading ? false : !canSubmit}
                onStop={() =>
                  void stream
                    .stop()
                    .catch((error: unknown) =>
                      setLocalError(toErrorMessage(error)),
                    )
                }
                status={
                  stream.isLoading
                    ? "streaming"
                    : isCreating
                      ? "submitted"
                      : errorMessage
                        ? "error"
                        : "ready"
                }
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </main>
  );
}
