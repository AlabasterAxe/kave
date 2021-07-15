import { Clip } from "../../../../../common/model";

interface VideoClipProps {
  clip: Clip;
}

export function VideoClip(props: VideoClipProps) {
  return (
    <div className="h-full bg-white rounded-lg border border-gray-300 truncate">
      {props.clip.id},
    </div>
  );
}
