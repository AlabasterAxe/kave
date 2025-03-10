import {
  Clip,
  FileType,
  KaveFile,
  Sequence,
  TimelineViewport,
} from "kave-common";
import { useAppSelector } from "../../../store/hooks";
import { selectActiveCompositionId, selectDocument } from "../../../store/store";
import { DragStartEvent, MultiTrackInteractionLog } from "./InteractionLog";
import { VideoClip } from "./VideoClip";

interface ClipProps {
  clip: Clip;
  viewport: TimelineViewport;
  clipStartTime: number;
  timelineElement: HTMLElement;
  onInteractionDragStart: (event: DragStartEvent) => void;
  onInteractionDragUpdate: (delta: number) => void;
  onInteractionDragEnd: () => void;
}

// this is a pretty "smart" component that is responsible for rendering a clip and any possible sub-clips
export default function ClipComponent(props: ClipProps) {
  const document = useAppSelector(selectDocument);
  const activeCompositionId = useAppSelector(selectActiveCompositionId);
  const {
    clip,
    viewport,
    onInteractionDragStart,
    onInteractionDragUpdate,
    onInteractionDragEnd,
  } = props;

  let file = document?.files.find((f: KaveFile) => f.id === clip.sourceId);
  if (file) {
    return <VideoClip clip={clip} />;
  }

  const seq = document?.sequences.find((s: Sequence) => s.id === clip.sourceId);
  if (!seq) {
    return <div>Invalid Clip</div>;
  }

  let interactionTrack = null;
  for (const track of seq.tracks) {
    const trackFile = document?.files.find(
      (f: KaveFile) => f.id === track.fileId
    );
    if (!trackFile) {
      return <div>Invalid Track</div>;
    }
    if (!activeCompositionId) {
      return null;
    }

    switch (trackFile.type) {
      case FileType.interaction_log:
        interactionTrack = (
          <MultiTrackInteractionLog
            compositionId={activeCompositionId}
            clipCompositionOffset={track.alignmentSeconds - clip.sourceOffsetSeconds}
            viewport={viewport}
            clipStartTimeSeconds={props.clipStartTime}
            clipDurationSeconds={clip.durationSeconds}
            timelineElement={props.timelineElement}
            onDragStart={onInteractionDragStart}
            onDragUpdate={onInteractionDragUpdate}
            onDragEnd={onInteractionDragEnd}
            clip={clip}
          />
        );
    }
  }
  return (
    <>
      {interactionTrack}
      <VideoClip clip={clip} interaction />
    </>
  );
}
