import { Clip } from "../../../../../common/model";

interface VideoClipProps {
  clip: Clip;
}

export function VideoClip(props: VideoClipProps) {
  return (
    <div className="h-full rounded border border-gray-400 truncate">
      {props.clip.id},
    </div>
  );
}
