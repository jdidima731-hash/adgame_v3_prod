import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Copy, Save, Zap, Eye, EyeOff } from "lucide-react";

interface SocialMediaManagerProps {
  advertiserId: number;
  isActive?: boolean;
}

export function SocialMediaManager({ advertiserId, isActive = false }: SocialMediaManagerProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<"facebook" | "instagram" | "tiktok" | "linkedin">("facebook");
  const [tone, setTone] = useState<"promotional" | "informative" | "entertaining" | "urgent">("promotional");
  const [subject, setSubject] = useState("");

  // Form state for API keys
  const [keys, setKeys] = useState({
    openAiKey: "",
    facebookToken: "",
    instagramToken: "",
    tiktokToken: "",
    linkedinToken: "",
  });

  // Queries
  const { data: addonStatus, isLoading: loadingStatus } = trpc.socialAddon.getStatus.useQuery();
  const { data: savedKeys, isLoading: loadingKeys } = trpc.socialAddon.getKeys.useQuery();

  // Mutations
  const activateMutation = trpc.socialAddon.activate.useMutation({
    onSuccess: () => {
      toast.success("Social Media Manager activé (+50 DT/mois)");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deactivateMutation = trpc.socialAddon.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Social Media Manager désactivé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveKeysMutation = trpc.socialAddon.saveKeys.useMutation({
    onSuccess: () => {
      toast.success("Clés API sauvegardées avec succès");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateContentMutation = trpc.socialAddon.generateContent.useMutation({
    onSuccess: (data: any) => {
      setGeneratedContent(data.content);
      toast.success("Contenu généré avec succès");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const schedulePostMutation = trpc.socialAddon.schedulePost.useMutation({
    onSuccess: () => {
      toast.success("Post programmé avec succès");
      setGeneratedContent("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSaveKeys = () => {
    saveKeysMutation.mutate(keys);
  };

  const handleGenerateContent = () => {
    if (!subject.trim()) {
      toast.error("Veuillez entrer un sujet");
      return;
    }
    generateContentMutation.mutate({ network: selectedNetwork, subject, tone });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Contenu copié");
  };

  const handleSchedulePost = () => {
    const now = new Date();
    const scheduledFor = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
    schedulePostMutation.mutate({
      network: selectedNetwork,
      content: generatedContent,
      scheduledFor,
    });
  };

  if (loadingStatus || loadingKeys) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Social Media Manager
          </CardTitle>
          <CardDescription>Gérez vos clés API et générez du contenu IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {addonStatus?.isActive ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ Addon actif jusqu'au {new Date(addonStatus.activeUntil ?? Date.now()).toLocaleDateString()}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Désactiver l'addon
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Activez le Social Media Manager pour générer du contenu IA pour vos réseaux sociaux (+50 DT/mois)
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="w-full"
              >
                {activateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Activer (+50 DT/mois)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {addonStatus?.isActive && (
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keys">Clés API</TabsTrigger>
            <TabsTrigger value="generate">Générer</TabsTrigger>
            <TabsTrigger value="schedule">Programmer</TabsTrigger>
          </TabsList>

          {/* Onglet Clés API */}
          <TabsContent value="keys">
            <Card>
              <CardHeader>
                <CardTitle>🔑 Clés API (BYOK)</CardTitle>
                <CardDescription>Vos clés sont chiffrées et sécurisées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OpenAI */}
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai"
                      type={showKeys ? "text" : "password"}
                      placeholder="sk-..."
                      value={keys.openAiKey}
                      onChange={(e) => setKeys({ ...keys, openAiKey: e.target.value })}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowKeys(!showKeys)}
                    >
                      {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {savedKeys?.openAiKey && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sauvegardée: {savedKeys.openAiKey}</p>
                  )}
                </div>

                {/* Facebook */}
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook Token</Label>
                  <Input
                    id="facebook"
                    type={showKeys ? "text" : "password"}
                    placeholder="Votre token Facebook"
                    value={keys.facebookToken}
                    onChange={(e) => setKeys({ ...keys, facebookToken: e.target.value })}
                  />
                  {savedKeys?.facebookToken && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sauvegardée: {savedKeys.facebookToken}</p>
                  )}
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Token</Label>
                  <Input
                    id="instagram"
                    type={showKeys ? "text" : "password"}
                    placeholder="Votre token Instagram"
                    value={keys.instagramToken}
                    onChange={(e) => setKeys({ ...keys, instagramToken: e.target.value })}
                  />
                  {savedKeys?.instagramToken && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sauvegardée: {savedKeys.instagramToken}</p>
                  )}
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok Token</Label>
                  <Input
                    id="tiktok"
                    type={showKeys ? "text" : "password"}
                    placeholder="Votre token TikTok"
                    value={keys.tiktokToken}
                    onChange={(e) => setKeys({ ...keys, tiktokToken: e.target.value })}
                  />
                  {savedKeys?.tiktokToken && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sauvegardée: {savedKeys.tiktokToken}</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Token</Label>
                  <Input
                    id="linkedin"
                    type={showKeys ? "text" : "password"}
                    placeholder="Votre token LinkedIn"
                    value={keys.linkedinToken}
                    onChange={(e) => setKeys({ ...keys, linkedinToken: e.target.value })}
                  />
                  {savedKeys?.linkedinToken && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sauvegardée: {savedKeys.linkedinToken}</p>
                  )}
                </div>

                <Button
                  onClick={handleSaveKeys}
                  disabled={saveKeysMutation.isPending}
                  className="w-full"
                >
                  {saveKeysMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder les clés
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Générer */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>🤖 Générer du contenu IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Réseau social</Label>
                  <Select value={selectedNetwork} onValueChange={(v: any) => setSelectedNetwork(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    placeholder="Ex: Notre nouvelle promotion"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ton</Label>
                  <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">Promotionnel</SelectItem>
                      <SelectItem value="informative">Informatif</SelectItem>
                      <SelectItem value="entertaining">Divertissant</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={generateContentMutation.isPending}
                  className="w-full"
                >
                  {generateContentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  Générer avec IA
                </Button>

                {generatedContent && (
                  <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800/40 rounded">
                    <p className="text-sm font-semibold">Contenu généré:</p>
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyContent}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Programmer */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>📅 Programmer un post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded">
                      <p className="text-sm font-semibold mb-2">Post à programmer:</p>
                      <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                    </div>
                    <Button
                      onClick={handleSchedulePost}
                      disabled={schedulePostMutation.isPending}
                      className="w-full"
                    >
                      {schedulePostMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Programmer pour demain
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Générez d'abord du contenu dans l'onglet "Générer"
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
