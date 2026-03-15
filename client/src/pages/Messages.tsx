import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { MessageSquare, Send, Search, Loader2 } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [, params] = useRoute("/messages/:conversationId");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    params?.conversationId ? Number(params.conversationId) : null
  );
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConvs } = trpc.messages.listConversations.useQuery();
  const { data: convData, refetch: refetchMsgs } = trpc.messages.getConversation.useQuery(
    { withUserId: selectedUserId! },
    { enabled: !!selectedUserId, refetchInterval: 3000 }
  );
  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => { setNewMsg(""); refetchMsgs(); refetchConvs(); },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convData]);

  const convList = (conversations as any[]) ?? [];
  const messages = (convData as any)?.messages ?? [];
  const otherUser = (convData as any)?.user;

  const filtered = convList.filter((c: any) =>
    (c.user?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!newMsg.trim() || !selectedUserId) return;
    sendMutation.mutate({ toUserId: selectedUserId, content: newMsg.trim() });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex gap-0 border rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Sidebar conversations */}
        <div className={`w-full md:w-72 border-r flex flex-col shrink-0 ${selectedUserId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/40">
            <h2 className="font-semibold flex items-center gap-2 mb-2 text-sm">
              <MessageSquare className="h-4 w-4" /> Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <Input className="pl-7 h-8 text-sm bg-white" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convList.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Aucune conversation
              </div>
            )}
            {filtered.map((conv: any) => {
              const other = conv.user;
              const isSelected = selectedUserId === other?.id;
              return (
                <button key={other?.id} onClick={() => setSelectedUserId(other?.id)}
                  className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0 ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}>
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold">
                        {other?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-sm truncate">{other?.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                        {new Date(conv.lastMessage?.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{conv.lastMessage?.content}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone de chat */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedUserId ? "hidden md:flex items-center justify-center text-gray-400" : "flex"}`}>
          {!selectedUserId ? (
            <div className="text-center p-8">
              <MessageSquare className="h-14 w-14 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium text-gray-400 dark:text-gray-500">Sélectionnez une conversation</p>
              <p className="text-sm text-gray-300 mt-1">Choisissez un contact dans la liste</p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="p-3 border-b flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 shrink-0">
                <Button size="sm" variant="ghost" className="md:hidden h-8 w-8 p-0" onClick={() => setSelectedUserId(null)}>←</Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold">
                    {(otherUser?.name ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{otherUser?.name ?? "Chargement..."}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{otherUser?.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">Démarrez la conversation !</div>
                )}
                {messages.map((msg: any) => {
                  const isMe = msg.fromUserId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm shadow-sm
                        ${isMe ? "bg-blue-600 text-white rounded-br-md" : "bg-white border text-gray-900 rounded-bl-md"}`}>
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {isMe && (msg.isRead ? " · Lu" : " · Envoyé")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t bg-gray-50 dark:bg-gray-800/40 flex gap-2 shrink-0">
                <Input
                  placeholder="Écrivez votre message..."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1 bg-white"
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMsg.trim() || sendMutation.isPending}
                  className="gap-2 shrink-0"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
