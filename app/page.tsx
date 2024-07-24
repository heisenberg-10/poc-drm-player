"use client";

import Settings from "@/components/Settings/Settings";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Film } from "lucide-react";
import { useState } from "react";

export default function Home() {

  const [challenge, setChallenge] = useState<{
    message: any;
    messageType: any;
  }>({ message: "", messageType: "" });

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center gap-6 md:w-[800px] pt-2">
        <Label className="text-3xl flex items-center">
          <Film width="54px" height="54px" />
          MDRM Poc
        </Label>
        <Settings setChallenge={setChallenge} />
        <video
          controls
          className="w-full h-auto bg-black border border-black rounded-3xl"
        />
        <Textarea disabled value={`Challenge : ${challenge.message || ""}`} />
        <Textarea disabled value={`Challenge type : ${challenge.messageType || ""}`} />
      </div>
    </>
  );
}
