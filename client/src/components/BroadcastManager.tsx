import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Radio, Send, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface BroadcastManagerProps {
  channelId?: number;
}

interface AndroidBox {
  id: number;
  name: string;
  ipAddress?: string;
  cityId?: number;
  isOnline: boolean;
  status: string;
  lastSeen?: Date;
}

interface Ad {
  id: number;
  title: string;
  status: string;
}

export function BroadcastManager({ channelId }: BroadcastManagerProps) {
  const [selectedChannel, setSelectedChannel] = useState<number | null>(channelId || null);
  const [selectedAd, setSelectedAd] = useState<number | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number>>(new Set());
  const [selectAllOnline, setSelectAllOnline] = useState(false);

  // Queries
  const { data: channels, isLoading: loadingChannels } = trpc.broadcast.listChannels.useQuery();
  const { data: boxes, isLoading: loadingBoxes, refetch: refetchBoxes } = trpc.boxes.getBoxesByChannel.useQuery(
    { channelId: selectedChannel! },
    { enabled: !!selectedChannel }
  );
  const { data: ads, isLoading: loadingAds } = trpc.ads.list.useQuery({ limit: 100, offset: 0 });

  // Mutations
  const pushAdMutation = trpc.broadcast.pushAdToChannel.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Publicité envoyée à ${data.boxesUpdated} box(es)`);
      setSelectedBoxes(new Set());
      setSelectedAd(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleBoxToggle = (boxId: number) => {
    const newSelected = new Set(selectedBoxes);
    if (newSelected.has(boxId)) {
      newSelected.delete(boxId);
    } else {
      newSelected.add(boxId);
    }
    setSelectedBoxes(newSelected);
    setSelectAllOnline(false);
  };

  const handleSelectAllOnline = () => {
    if (!boxes) return;

    const onlineBoxIds = boxes
      .filter((b: any) => b.isOnline)
      .map((b: any) => b.id);

    if (selectAllOnline) {
      setSelectedBoxes(new Set());
      setSelectAllOnline(false);
    } else {
      setSelectedBoxes(new Set(onlineBoxIds));
      setSelectAllOnline(true);
    }
  };

  const handlePushAd = () => {
    if (!selectedChannel || !selectedAd || selectedBoxes.size === 0) {
      toast.error("Veuillez sélectionner une chaîne, une publicité et au moins une box");
      return;
    }

    pushAdMutation.mutate({
      channelId: selectedChannel,
      adId: selectedAd,
    });
  };

  const onlineBoxes = boxes?.filter((b: any) => b.isOnline) || [];
  const offlineBoxes = boxes?.filter((b: any) => !b.isOnline) || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="broadcast" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="broadcast">Envoyer une pub</TabsTrigger>
          <TabsTrigger value="boxes">Boxes Android</TabsTrigger>
        </TabsList>

        {/* Onglet Broadcast */}
        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Envoyer une publicité
              </CardTitle>
              <CardDescription>Sélectionnez une chaîne, une publicité et les boxes cibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Étape 1: Sélectionner la chaîne */}
              <div className="space-y-2">
                <Label htmlFor="channel">1. Choisir la chaîne</Label>
                <Select
                  value={selectedChannel?.toString() || ""}
                  onValueChange={(v) => {
                    setSelectedChannel(parseInt(v));
                    setSelectedBoxes(new Set());
                  }}
                >
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Sélectionnez une chaîne" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels?.map((ch: any) => (
                      <SelectItem key={ch.id} value={ch.id.toString()}>
                        {ch.name} ({ch.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Étape 2: Sélectionner les boxes */}
              {selectedChannel && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>2. Sélectionner les boxes cibles</Label>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Wifi className="h-3 w-3 mr-1" />
                        {onlineBoxes.length} en ligne
                      </Badge>
                      <Badge variant="outline">
                        <WifiOff className="h-3 w-3 mr-1" />
                        {offlineBoxes.length} hors ligne
                      </Badge>
                    </div>
                  </div>

                  {loadingBoxes ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : boxes && boxes.length > 0 ? (
                    <div className="space-y-3">
                      {/* Bouton Tout sélectionner (online) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllOnline}
                        className="w-full"
                      >
                        {selectAllOnline ? "Désélectionner tout" : "Sélectionner tous les online"}
                      </Button>

                      {/* Boxes online */}
                      {onlineBoxes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-green-700">Boxes en ligne</p>
                          <div className="space-y-1">
                            {onlineBoxes.map((box: any) => (
                              <div key={box.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`box-${box.id}`}
                                  checked={selectedBoxes.has(box.id)}
                                  onCheckedChange={() => handleBoxToggle(box.id)}
                                />
                                <Label htmlFor={`box-${box.id}`} className="flex-1 cursor-pointer text-sm">
                                  <span className="font-medium">{box.name}</span>
                                  {box.ipAddress && <span className="text-gray-500 ml-2">{box.ipAddress}</span>}
                                  <Badge className="ml-2" variant="default">
                                    <Wifi className="h-3 w-3 mr-1" />
                                    En ligne
                                  </Badge>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Boxes offline */}
                      {offlineBoxes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-500">Boxes hors ligne</p>
                          <div className="space-y-1">
                            {offlineBoxes.map((box: any) => (
                              <div key={box.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded opacity-50">
                                <Checkbox disabled id={`box-${box.id}`} />
                                <Label htmlFor={`box-${box.id}`} className="flex-1 cursor-not-allowed text-sm">
                                  <span className="font-medium">{box.name}</span>
                                  {box.ipAddress && <span className="text-gray-500 ml-2">{box.ipAddress}</span>}
                                  <Badge className="ml-2" variant="outline">
                                    <WifiOff className="h-3 w-3 mr-1" />
                                    Hors ligne
                                  </Badge>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>Aucune box assignée à cette chaîne</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Étape 3: Sélectionner la publicité */}
              {selectedChannel && selectedBoxes.size > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="ad">3. Choisir la publicité</Label>
                  <Select
                    value={selectedAd?.toString() || ""}
                    onValueChange={(v) => setSelectedAd(parseInt(v))}
                  >
                    <SelectTrigger id="ad">
                      <SelectValue placeholder="Sélectionnez une publicité" />
                    </SelectTrigger>
                    <SelectContent>
                      {ads
                        ?.filter((a: Ad) => a.status === "approved")
                        .map((a: Ad) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Bouton Envoyer */}
              {selectedChannel && selectedBoxes.size > 0 && selectedAd && (
                <div className="space-y-3 pt-4 border-t">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription>
                      Vous êtes sur le point d'envoyer cette publicité à <strong>{selectedBoxes.size}</strong> box(es)
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handlePushAd}
                    disabled={pushAdMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {pushAdMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Envoyer la publicité
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Boxes */}
        <TabsContent value="boxes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Boxes Android
              </CardTitle>
              <CardDescription>Gérez vos boxes de diffusion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchBoxes()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Rafraîchir
              </Button>

              {loadingBoxes ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : boxes && boxes.length > 0 ? (
                <div className="space-y-2">
                  {boxes.map((box: any) => (
                    <div key={box.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{box.name}</p>
                          {box.ipAddress && <p className="text-sm text-gray-500">{box.ipAddress}</p>}
                        </div>
                        <Badge variant={box.isOnline ? "default" : "secondary"}>
                          {box.isOnline ? (
                            <>
                              <Wifi className="h-3 w-3 mr-1" />
                              En ligne
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 mr-1" />
                              Hors ligne
                            </>
                          )}
                        </Badge>
                      </div>
                      {box.lastSeen && (
                        <p className="text-xs text-gray-400 mt-1">
                          Dernier ping: {new Date(box.lastSeen).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>Aucune box disponible</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
