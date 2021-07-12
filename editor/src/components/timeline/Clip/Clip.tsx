import { useState } from "react";
import {
  Clip,
  File,
  FileType,
  Sequence,
  TimelineViewport,
} from "../../../../../common/model";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { splitClip } from "../../../store/project";
import { selectComposition, selectProject } from "../../../store/store";
import { scaleToScreen } from "../../../util/timeline-transformer";
import { InteractionLog } from "./InteractionLog";
import { VideoClip } from "./VideoClip";

interface ClipProps {
  clip: Clip;
  viewport: TimelineViewport;
  clipStartTime: number;
}

interface ClipDragState {
  interactionTimeSeconds: number;
  dragAmountSeconds: number;
}

// this is a pretty "smart" component that is responsible for rendering a clip and any possible sub-clips
export default function ClipComponent(props: ClipProps) {
  const project = useAppSelector(selectProject);
  const activeComposition = useAppSelector(selectComposition);
  const [clipDragState, setClipDragState] = useState<ClipDragState | null>(
    null
  );
  const dispatch = useAppDispatch();
  const { clip, viewport } = props;

  const onInteractionDragStart = (time: number) => {
    setClipDragState({
      interactionTimeSeconds: time,
      dragAmountSeconds: 0,
    });
  };

  const onInteractionDragUpdate = (delta: number) => {
    const dragState = clipDragState;
    if (dragState) {
      // update the duration of the clip
      setClipDragState({
        interactionTimeSeconds: dragState.interactionTimeSeconds,
        dragAmountSeconds: delta,
      });
    }
  };

  const onInteractionDragEnd = () => {
    if (clipDragState) {
      dispatch(
        splitClip({
          compositionId: activeComposition.id,
          splitOffsetSeconds: clipDragState.interactionTimeSeconds,
        })
      );
    }
    setClipDragState(null);
  };

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
        if (clipDragState) {
          videoTrack = (
            <div className="flex h-full">
              <div
                className="h-full"
                style={{
                  width:
                    scaleToScreen(
                      viewport,
                      clipDragState.interactionTimeSeconds
                    ) + "vw",
                }}
              >
                <VideoClip clip={clip} />
              </div>
              <div
                className="h-full"
                style={{
                  width:
                    scaleToScreen(
                      viewport,
                      clip.durationSeconds -
                        clipDragState.interactionTimeSeconds
                    ) + "vw",
                }}
              >
                <VideoClip clip={clip} />
              </div>
            </div>
          );
        } else {
          videoTrack = <VideoClip clip={clip} />;
        }
        break;
      case FileType.interaction_log:
        interactionTrack = (
          <InteractionLog
            userInteractionLog={trackFile.userInteractionLog}
            compositionId={activeComposition.id}
            offsetSeconds={track.alignmentSeconds - clip.sourceOffsetSeconds}
            viewport={viewport}
            clipStartTimeSeconds={props.clipStartTime}
            clipDurationSeconds={clip.durationSeconds}
            onInteractionDragStart={onInteractionDragStart}
            onInteractionDragUpdate={onInteractionDragUpdate}
            onInteractionDragEnd={onInteractionDragEnd}
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
