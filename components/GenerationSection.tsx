// components/GenerationSection.tsx
import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Sparkles, Zap, Wand2, Loader2, AlertCircle, AudioWaveform } from "lucide-react";

interface GenerationSectionProps {
    activeTab: "description" | "custom_lyrics" | "described_lyrics";
    setActiveTab: (tab: "description" | "custom_lyrics" | "described_lyrics") => void;
    isGenerating: boolean;
    handleGenerate: () => void;
    progress: number;
    error: string | null;
    description: string;
    setDescription: (value: string) => void;
    prompt: string;
    setPrompt: (value: string) => void;
    lyrics: string;
    setLyrics: (value: string) => void;
    describedLyrics: string;
    setDescribedLyrics: (value: string) => void;
}

const GenerationSection = React.memo((props: GenerationSectionProps) => {
    const {
        activeTab,
        setActiveTab,
        isGenerating,
        handleGenerate,
        progress,
        error,
        description,
        setDescription,
        prompt,
        setPrompt,
        lyrics,
        setLyrics,
        describedLyrics,
        setDescribedLyrics,
    } = props;

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl mx-4 sm:mx-0">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="text-white flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold text-center sm:text-left">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600">
                        <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Create Your Aika Track
                </CardTitle>
                <CardDescription className="text-slate-300 text-base sm:text-lg text-center sm:text-left mt-2 sm:mt-0">
                    Choose your preferred method and let AI craft your perfect track
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "description" | "custom_lyrics" | "described_lyrics")}>
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-sm p-1 h-auto">
                        <TabsTrigger
                            value="description"
                            className="text-white text-xs sm:text-sm md:text-base data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200 py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[60px] sm:min-h-[48px]"
                        >
                            <Music className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-center leading-tight">Description</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="custom_lyrics"
                            className="text-white text-xs sm:text-sm md:text-base data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200 py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[60px] sm:min-h-[48px]"
                        >
                            <Sparkles className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-center leading-tight">Custom Lyrics</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="described_lyrics"
                            className="text-white text-xs sm:text-sm md:text-base data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200 py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[60px] sm:min-h-[48px]"
                        >
                            <Zap className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-center leading-tight">AI Lyrics</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6 sm:mt-8">
                        <TabsContent value="description" className="space-y-4 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="description" className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    Describe Your Vision
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your musical vision in detail... (e.g., 'An upbeat indie-pop song with dreamy vocals, shimmering guitars, and a nostalgic 90s vibe perfect for summer road trips')"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] sm:min-h-[140px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-sm sm:text-lg resize-none focus:border-violet-400 transition-colors"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="custom_lyrics" className="space-y-4 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="prompt" className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    Musical Style
                                </Label>
                                <Input
                                    id="prompt"
                                    placeholder="e.g., dreamy indie pop with reverb, heavy metal with soaring guitars, chill lo-fi hip hop beats"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-sm sm:text-lg h-12 sm:h-14 focus:border-violet-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="lyrics" className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <AudioWaveform className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    Your Lyrics
                                </Label>
                                <Textarea
                                    id="lyrics"
                                    placeholder="Pour your heart into lyrics... Use [Verse], [Chorus], [Bridge] tags. Example:&#10;[Verse]&#10;Walking down the empty street tonight&#10;[Chorus]&#10;This is where the magic happens..."
                                    value={lyrics}
                                    onChange={(e) => setLyrics(e.target.value)}
                                    className="min-h-[160px] sm:min-h-[200px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-sm sm:text-lg resize-none focus:border-violet-400 transition-colors"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="described_lyrics" className="space-y-4 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="prompt" className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    Musical Style
                                </Label>
                                <Input
                                    id="prompt"
                                    placeholder="e.g., upbeat electronic dance, 128 BPM, festival anthem"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-sm sm:text-lg h-12 sm:h-14 focus:border-violet-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="described_lyrics" className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    Lyrics Concept
                                </Label>
                                <Textarea
                                    id="described_lyrics"
                                    placeholder="Describe the story, theme, or emotion you want the lyrics to convey... (e.g., 'A song about overcoming challenges and rising stronger, with themes of resilience and hope')"
                                    value={describedLyrics}
                                    onChange={(e) => setDescribedLyrics(e.target.value)}
                                    className="min-h-[120px] sm:min-h-[140px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-sm sm:text-lg resize-none focus:border-violet-400 transition-colors"
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="pt-4 sm:pt-6">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full h-12 sm:h-16 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-cyan-700 text-white text-base sm:text-xl font-bold shadow-xl shadow-violet-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.02] disabled:scale-100 disabled:opacity-70"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" />
                                <span>Crafting Your Masterpiece...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                                <span>Create with Aika</span>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 animate-pulse" />
                            </>
                        )}
                    </Button>

                    {isGenerating && (
                        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                            <div className="flex justify-between text-slate-300 text-sm sm:text-base">
                                <span className="font-medium">Creating your unique track...</span>
                                <span className="font-bold text-violet-300">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2 sm:h-3 bg-white/10" />
                            <div className="text-center text-slate-400 text-xs sm:text-sm px-2">
                                <span className="animate-pulse">
                                    <span className="hidden sm:inline">🎵 Aika is composing • Generating lyrics • Creating melodies • Mixing audio 🎵</span>
                                    <span className="sm:hidden">🎵 Creating your track 🎵</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <Alert className="bg-red-500/10 border-red-500/30 text-red-200 backdrop-blur-sm mt-4">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <AlertDescription className="text-sm sm:text-lg">{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
});

GenerationSection.displayName = 'GenerationSection';

export default GenerationSection;