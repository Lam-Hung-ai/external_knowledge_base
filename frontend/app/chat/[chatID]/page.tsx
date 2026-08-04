import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const chatSample: ChatMessage[] = [
  { id: "1", role: "user", content: "explain ai agent" },
  {
    id: "2",
    role: "assistant",
    content:
      "An AI Agent is an autonomous software system designed to perceive its environment, **make decisions**, and take actions to achieve specific goals.",
  },
  { id: "3", role: "user", content: "tell me more" },
  {
    id: "4",
    role: "assistant",
    content:
      "Unlike standard chatbots (which primarily process text inputs and output responses), AI agents can interact with external tools, APIs, software applications, and databases to perform real-world tasks with minimal human intervention. ## Standard AI vs. AI Agent",
  },
];

export default function ChatPage() {
  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent className="p-4">
            {chatSample.map((message) => {
              const isUserMessage = message.role === "user";

              return (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={isUserMessage}
                >
                  <Message align={isUserMessage ? "end" : "start"}>
                    <MessageContent>
                      <Bubble variant={isUserMessage ? "muted" : "ghost"}>
                        <BubbleContent>{message.content}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
