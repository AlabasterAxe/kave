import { Clip } from "../../../../../common/model";

interface VideoClipProps {
  clip: Clip;
  interaction?: boolean;
}

export function VideoClip(props: VideoClipProps) {
  const { clip, interaction = false } = props;
  const style = interaction
    ? {
        height: "66.7%",
        top: "33.3%",
      }
    : {};
  return (
    <div
      style={style}
      className="h-full w-full bg-white rounded-lg border border-gray-300 truncate absolute"
    >
      {clip.id},
    </div>
  );
}
