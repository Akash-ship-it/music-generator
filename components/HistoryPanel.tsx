// components/HistoryPanel.tsx
import React, { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { History, Trash2, Play, AlertCircle } from "lucide-react";
import Image from "next/image";
import { StoredMusic, GeneratedMusic } from "../types";

interface HistoryPanelProps {
  storedTracks: StoredMusic[];
  setGeneratedMusic: (music: GeneratedMusic | null) => void;
  generatedMusic: GeneratedMusic | null;
  clearAllTracks: () => void;
  confirmDeleteTrack: (trackId: string) => void;
}

const HistoryPanel = React.memo((props: HistoryPanelProps) => {
  const { storedTracks, setGeneratedMusic, generatedMusic, clearAllTracks, confirmDeleteTrack } = props;
  const [trackToDelete, setTrackToDelete] = useState<StoredMusic | null>(null);

  const loadStoredTrack = useCallback((track: StoredMusic) => {
    setGeneratedMusic(track);
    requestAnimationFrame(() => {
      const musicPlayerElement = document.getElementById("music-player");
      if (musicPlayerElement) {
        musicPlayerElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, [setGeneratedMusic]);

  const handleDelete = useCallback((track: StoredMusic) => {
    setTrackToDelete(track);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (trackToDelete) {
      confirmDeleteTrack(trackToDelete.id);
      setTrackToDelete(null);
    }
  }, [trackToDelete, confirmDeleteTrack]);

  return (
    <>
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
              <History className="w-5 h-5 text-violet-400" />
              Track History ({storedTracks.length})
            </CardTitle>
            {storedTracks.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={clearAllTracks}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                    <p>Clear all history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {storedTracks.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No tracks generated yet</p>
          ) : (
            storedTracks.map((track) => (
              <div
                key={track.id}
                className="relative p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="cursor-pointer pr-10" onClick={() => loadStoredTrack(track)}>
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Image
                        src={track.cover_image_cloudinary_url}
                        alt="Track cover"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="text-white font-medium text-sm leading-tight mb-1 truncate">
                        {track.title.split(" - ")[0]}...
                      </h4>
                      <p className="text-slate-400 text-xs mb-2 truncate">
                        {new Date(track.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {track.categories.slice(0, 2).map((cat, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs border-violet-500/30 text-violet-300 px-1.5 py-0.5 truncate max-w-20"
                          >
                            {cat.length > 8 ? cat.slice(0, 8) + "..." : cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-2 right-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleDelete(track)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-all duration-200 rounded-md opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                        <p>Delete track</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {generatedMusic && "id" in generatedMusic && generatedMusic.id === track.id && (
                  <div className="absolute left-2 top-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">Playing</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {trackToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="bg-slate-800 border-slate-600 max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">Are you sure you want to delete this track? This action cannot be undone.</p>
              <div className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-lg">
                <strong>Track:</strong> {trackToDelete.title.split(" - ")[0]}...
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setTrackToDelete(null)}
                  className="text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Track
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
});

HistoryPanel.displayName = 'HistoryPanel';

export default HistoryPanel;