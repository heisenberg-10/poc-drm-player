import { useEffect, useMemo, useState } from "react";
import RxPlayer from "rx-player";

export default function usePlayer(): { player: RxPlayer | null } {
  // Init player
  const [videoElement, setVideoElement] = useState<
    HTMLVideoElement | undefined
  >(undefined);

  useEffect(() => {
    if (videoElement) return;
    const element = document.querySelector("video");
    if (!element) return;
    setVideoElement(element);
  }, [videoElement]);

  const player = useMemo(
    () =>
      videoElement
        ? new RxPlayer({
            videoElement,
          })
        : null,
    [videoElement]
  );

  return {
    player,
  };
}
