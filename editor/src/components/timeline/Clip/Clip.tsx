import {
  Clip,
  File,
  FileType,
  Sequence,
  TimelineViewport,
} from "../../../../../common/model";
import { useAppSelector } from "../../../store/hooks";
import { selectComposition, selectProject } from "../../../store/store";
import { InteractionLog } from "./InteractionLog";
import { VideoClip } from "./VideoClip";

interface ClipProps {
  clip: Clip;
  viewport: TimelineViewport;
}

// this is a pretty "smart" component that is responsible for rendering a clip and any possible sub-clips
export default function ClipComponent(props: ClipProps) {
  const project = useAppSelector(selectProject);
  const activeComposition = useAppSelector(selectComposition);
  const { clip, viewport } = props;

  let file = project.files.find((f: File) => f.id === clip.sourceId);
  if (file) {
    return <VideoClip clip={clip} />;
  }

  const seq = project.sequences.find((s: Sequence) => s.id === clip.sourceId);
  if (!seq) {
    return <div>Invalid Clip</div>;
  }

  let videoTrack = null;
  let interactionTrack = null;
  for (const track of seq.tracks) {
    const trackFile: File = project.files.find(
      (f: File) => f.id === track.fileId
    );
    if (!trackFile) {
      return <div>Invalid Track</div>;
    }

    switch (trackFile.type) {
      case FileType.video:
        videoTrack = <VideoClip clip={clip} />;
        break;
      case FileType.interaction_log:
        interactionTrack = (
          <InteractionLog
            userInteractionLog={trackFile.userInteractionLog}
            compositionId={activeComposition.id}
            offsetSeconds={track.alignmentSeconds}
            viewport={viewport}
          />
        );
    }
  }
  return (
    <>
      <div className="h-1/2">{interactionTrack}</div>
      <div className="h-1/2">{videoTrack}</div>
    </>
  );
}
