import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Check, Copy, MessageCircle, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageAction, MessageActions, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ASSISTANT_NAME, SUGGESTIONS, WELCOME, type ChatLanguage } from "@/lib/farming-assistant";
import { useLanguage, translateText } from "@/lib/site-language";
import emblem from "@/assets/farming-assistant.png";
import { VOICE_ASSISTANT_EVENT } from "@/lib/voice-commands";

const transport = new DefaultChatTransport({ api: "/api/farming-chat" });

export function FarmingAssistant() {
  const { language: siteLanguage, t } = useLanguage();
  const [replyLanguage, setReplyLanguage] = useState<ChatLanguage | null>(null);
  const language = replyLanguage ?? (siteLanguage === "ur" ? "ur" : "auto");
  const chatT = (text: string) => translateText(text, language === "ur" ? "ur" : "en");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({ id: "agripulse-session", transport });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    const handleVoice = (event: Event) => {
      const detail: unknown = (event as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object" || !("open" in detail) || typeof detail.open !== "boolean") return;
      setOpen(detail.open);
      if ("draft" in detail && typeof detail.draft === "string") setDraft(detail.draft.slice(0, 12000));
    };
    window.addEventListener(VOICE_ASSISTANT_EVENT, handleVoice);
    return () => window.removeEventListener(VOICE_ASSISTANT_EVENT, handleVoice);
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open, status]);
  const close = () => { setOpen(false); launcher.current?.focus(); };
  const send = (text: string) => {
    if (!text.trim() || busy) return;
    clearError(); setCopyError(null); setDraft("");
    void sendMessage({ text: text.trim() }, { body: { language } });
    input.current?.focus();
  };
  return (
    <TooltipProvider>
      {open && <section role="dialog" dir={language === "ur" ? "rtl" : "ltr"} aria-label={ASSISTANT_NAME} onKeyDown={(event) => { if (event.key === "Escape") close(); }} className="fixed bottom-24 right-4 z-50 flex h-[min(640px,calc(100dvh-120px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 max-sm:bottom-20 max-sm:right-2 max-sm:h-[calc(100dvh-100px)] max-sm:w-[calc(100vw-16px)]">
        <header className="flex shrink-0 items-center gap-3 border-b bg-accent px-4 py-3">
          <img src={emblem} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 object-contain" />
          <div className="min-w-0 flex-1"><h2 className="font-display text-sm font-semibold">AgriPulse AI</h2><p className="text-xs text-muted-foreground">{chatT("Smart Farming Assistant")}</p></div>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Clear chat" disabled={messages.length === 0 && !error} onClick={() => { void stop(); setMessages([]); clearError(); setCopyError(null); setDraft(""); input.current?.focus(); }}><Trash2 /></Button></TooltipTrigger><TooltipContent>{chatT("Clear chat")}</TooltipContent></Tooltip>
          <Button variant="ghost" size="icon" aria-label="Close farming assistant" onClick={close}><X /></Button>
        </header>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
          <label htmlFor="chat-language" className="text-xs text-muted-foreground">{chatT("Reply language")}</label>
          <select id="chat-language" aria-label="Chat reply language" value={language} disabled={busy} onChange={(event) => { const value = event.target.value; if (value === "auto" || value === "en" || value === "ur" || value === "roman-ur") setReplyLanguage(value); }} className="h-8 max-w-40 rounded-md border border-input bg-background px-2 text-xs" dir="ltr">
            <option value="auto">Auto / خودکار</option><option value="en">English</option><option value="ur">اردو</option><option value="roman-ur">Roman Urdu</option>
          </select>
        </div>
        <Conversation className="min-h-0 flex-1" aria-label="Farming conversation">
          <ConversationContent className="gap-5 p-4">
            <Message from="assistant"><MessageContent><MessageResponse>{chatT(WELCOME)}</MessageResponse></MessageContent></Message>
            {messages.length === 0 && <div className="grid gap-2">{SUGGESTIONS.map((question) => <Button key={question} variant="outline" className="h-auto justify-start whitespace-normal px-3 py-2 text-start text-xs" onClick={() => send(chatT(question))}>{chatT(question)}</Button>)}</div>}
            {messages.map((message) => {
              const text = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n");
              if (!text) return null;
              return <Message from={message.role} key={message.id}>
                <MessageContent dir="auto" className="break-words group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  {message.parts.map((part, index) => part.type === "text" ? message.role === "assistant" ? <MessageResponse key={index}>{part.text}</MessageResponse> : <p key={index} className="whitespace-pre-wrap">{part.text}</p> : null)}
                </MessageContent>
                {message.role === "assistant" && <MessageActions><MessageAction tooltip={chatT(copied === message.id ? "Copied" : "Copy response")} onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(message.id); setCopyError(null); }).catch(() => setCopyError("Could not copy the response. Please select and copy the text.")); }}>{copied === message.id ? <Check /> : <Copy />}</MessageAction></MessageActions>}
              </Message>;
            })}
            {status === "submitted" && <div role="status" className="text-sm motion-reduce:[&_*]:animate-none"><Shimmer>{chatT("Thinking about your crop…")}</Shimmer></div>}
            {(error || copyError) && <p role="alert" className="break-words text-sm text-destructive">{error?.message || copyError}</p>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="shrink-0 border-t bg-background p-3">
          <PromptInput onSubmit={({ text, files }) => { if (files.length) { setCopyError("Image diagnosis is available in the crop detection modules, not in this chat."); return; } send(text); }} maxFiles={0} onError={() => setCopyError("For image analysis, use a crop detection module.")}>
            <PromptInputTextarea ref={input} dir="auto" aria-label={chatT("Your farming question")} placeholder={chatT("Ask about your crops…")} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={12000} className="min-h-16 text-sm" />
            <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={() => { void stop(); }} disabled={!busy && !draft.trim()} aria-label={busy ? "Stop answer" : "Send question"} className="h-8 w-8 shrink-0">{!busy && <Send className="h-4 w-4" />}</PromptInputSubmit></PromptInputFooter>
          </PromptInput>
        </div>
      </section>}
      <Button ref={launcher} aria-label={open ? "Close farming assistant" : "Open farming assistant"} aria-expanded={open} onClick={() => open ? close() : setOpen(true)} className="fixed bottom-5 right-5 z-50 h-14 gap-2 rounded-full px-4 shadow-xl max-sm:bottom-3 max-sm:right-3">
        {open ? <X /> : <MessageCircle />}<span className="text-sm">{t("Farming Assistant")}</span>
      </Button>
    </TooltipProvider>
  );
}