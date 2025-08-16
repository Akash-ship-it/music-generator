// components/SettingsPanel.tsx
import React, { useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  Clock,
  Shuffle,
  Headphones,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { GenerationConfig } from "../types";

interface SettingsPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
}

const SettingsPanel = React.memo((props: SettingsPanelProps) => {
  const { config, setConfig } = props;

  const generateRandomSeed = useCallback(() => {
    setConfig((prev) => ({ ...prev, seed: Math.floor(Math.random() * 1000000) }));
  }, [setConfig]);

  const resetConfig = useCallback(() => {
    setConfig({
      audio_duration: 180,
      seed: -1,
      guidance_scale: 15,
      infer_step: 60,
      instrumental: false,
    });
  }, [setConfig]);

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl sticky top-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700">
                <Settings className="w-5 h-5 text-white" />
              </div>
              Fine-tune
            </CardTitle>
            <CardDescription className="text-slate-300">Customize your generation parameters</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={resetConfig}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                <p>Reset all parameters to default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-4">
          <Label className="text-white font-semibold flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-violet-400" />
            Duration: <span className="text-violet-300">{config.audio_duration}s</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                  <p>
                    Set the length of your generated track. Longer durations create more complete songs but take more time to generate.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Slider
            value={[config.audio_duration]}
            min={30}
            max={300}
            step={10}
            onValueChange={(value) => setConfig((prev) => ({ ...prev, audio_duration: value[0] }))}
            className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-cyan-400 [&>span:first-child>span]:to-blue-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-cyan-500/20"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>30s</span>
            <span>5min</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-white font-semibold flex items-center gap-2 text-base">
            Creativity: <span className="text-violet-300">{config.guidance_scale}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                  <p>
                    Controls how closely the AI follows your prompt. Lower values stick closer to your description, higher values allow more creative interpretation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Slider
            value={[config.guidance_scale]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={(value) => setConfig((prev) => ({ ...prev, guidance_scale: value[0] }))}
            className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-violet-400 [&>span:first-child>span]:to-purple-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-violet-500/20"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Conservative</span>
            <span>Creative</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-white font-semibold flex items-center gap-2 text-base">
            Quality: <span className="text-violet-300">{config.infer_step}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                  <p>Higher values produce better quality audio but take longer to generate. 60+ recommended for final tracks.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Slider
            value={[config.infer_step]}
            min={20}
            max={100}
            step={5}
            onValueChange={(value) => setConfig((prev) => ({ ...prev, infer_step: value[0] }))}
            className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-emerald-400 [&>span:first-child>span]:to-green-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-emerald-500/20"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Fast</span>
            <span>Premium</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-white font-semibold flex items-center gap-2 text-base">
            <Shuffle className="w-4 h-4 text-violet-400" />
            Seed
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                  <p>
                    Random number that controls variation. Use the same seed to reproduce similar results, or -1 for random generation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={config.seed}
              onChange={(e) => setConfig((prev) => ({ ...prev, seed: parseInt(e.target.value) || -1 }))}
              className="flex-1 bg-white/5 border-white/20 text-white h-12 focus:border-violet-400 focus:ring-violet-400/20"
              placeholder="Random"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={generateRandomSeed}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                  <p>Generate random seed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-white font-semibold flex items-center gap-2 text-base">
            <Headphones className="w-4 h-4 text-violet-400" />
            Audio Type
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-2" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                  <p>
                    Choose between instrumental music (no vocals) or full tracks with singing. Perfect for background music or complete songs.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/3 border border-white/10 hover:border-white/20 hover:from-white/8 hover:to-white/5 transition-all duration-200 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${config.instrumental ? "bg-orange-400" : "bg-violet-400"}`}></div>
              <span className="text-slate-300 font-medium">
                {config.instrumental ? "Instrumental only" : "With vocals"}
              </span>
            </div>
            <Switch
              checked={config.instrumental}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, instrumental: checked }))}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-amber-500 data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-violet-500 data-[state=unchecked]:to-fuchsia-500 transition-all duration-200 shadow-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default SettingsPanel;