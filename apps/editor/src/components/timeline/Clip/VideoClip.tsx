import { Clip } from "../../../../../../lib/common/dist";

interface VideoClipProps {
  clip: Clip;
  interaction?: boolean;
}

export function VideoClip(props: VideoClipProps) {
  const { clip, interaction = false } = props;
  const style = interaction
    ? {
        height: `${1/6 * 100}%`,
        top: `${5/6 * 100}%`,
      }
    : {};
  return (
    <div
      style={style}
      className="h-full w-full bg-white rounded-lg border border-gray-300 truncate absolute"
    >
      {clip.id}
    </div>
  );
}
