import {
  Clip,
  KaveFile,
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
  clipStartTime: number;
  timelineElement: HTMLElement;
  onInteractionDragStart: (time: number) => void;
  onInteractionDragUpdate: (delta: number) => void;
  onInteractionDragEnd: () => void;
}

// this is a pretty "smart" component that is responsible for rendering a clip and any possible sub-clips
export default function ClipComponent(props: ClipProps) {
  const project = useAppSelector(selectProject);
  const activeComposition = useAppSelector(selectComposition);
  const {
    clip,
    viewport,
    onInteractionDragStart,
    onInteractionDragUpdate,
    onInteractionDragEnd,
  } = props;

  let file = project.files.find((f: KaveFile) => f.id === clip.sourceId);
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
    const trackFile: KaveFile = project.files.find(
      (f: KaveFile) => f.id === track.fileId
    );
    if (!trackFile) {
      return <div>Invalid Track</div>;
    }

    switch (trackFile.type) {
      case FileType.video:
        videoTrack = <VideoClip clip={clip} interaction />;
        break;
      case FileType.interaction_log:
        interactionTrack = (
          <InteractionLog
            file={trackFile}
            compositionId={activeComposition.id}
            offsetSeconds={track.alignmentSeconds - clip.sourceOffsetSeconds}
            viewport={viewport}
            clipStartTimeSeconds={props.clipStartTime}
            clipDurationSeconds={clip.durationSeconds}
            timelineElement={props.timelineElement}
            onDragStart={onInteractionDragStart}
            onDragUpdate={onInteractionDragUpdate}
            onDragEnd={onInteractionDragEnd}
            clipId={clip.id}
          />
        );
    }
  }
  return (
    <>
      {interactionTrack}
      {videoTrack}
    </>
  );
}
