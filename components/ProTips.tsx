// components/ProTips.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const ProTips = React.memo(() => (
  <Card className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border-violet-500/20 backdrop-blur-xl">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2 text-lg">
        <Sparkles className="w-5 h-5 text-violet-400" />
        Pro Tips
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-slate-300 text-sm space-y-2">
        <p>💡 Be specific with genres and emotions for better results</p>
        <p>⏱️ Higher quality settings = longer generation time</p>
        <p>🎵 Use [Verse], [Chorus], [Bridge] tags in custom lyrics</p>
        <p>🎲 Try different seeds for unique variations</p>
        <p>🚀 This is project #2/52 - your feedback shapes what I build next!</p>
      </div>
    </CardContent>
  </Card>
));

ProTips.displayName = 'ProTips';

export default ProTips;