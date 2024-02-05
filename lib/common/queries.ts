import { Clip, FileType, InteractionLogFile, KaveDoc, UserInteraction } from './model';


export function getInteractionLogForSourceId(
    state: KaveDoc,
    sourceId: string
  ): { file: InteractionLogFile; offset: number } | undefined {
    const sequence = state.sequences.find((f) => f.id === sourceId);
  
    if (!sequence) {
      return undefined;
    }
  
    let interactionLogFile: InteractionLogFile | undefined;
    const track = sequence.tracks.find((t) => {
      const file = state.files.find((f) => f.id === t.fileId);
      if (file?.type === FileType.interaction_log) {
        interactionLogFile = file;
        return true;
      }
      return false;
    });
  
    if (!interactionLogFile || !track) {
      return undefined;
    }
  
    return { file: interactionLogFile, offset: track.alignmentSeconds };
  }
  
  export function getClipForTime(
    project: KaveDoc,
    compositionId: string,
    time: number
  ): { clip: Clip; offset: number } | undefined {
    const comp = project.compositions.find((c) => c.id === compositionId);
    if (!comp) {
      return undefined;
    }
    let curTime = 0;
    for (const clip of comp.clips) {
      if (curTime + clip.durationSeconds > time) {
        return { clip, offset: time - curTime };
      }
      curTime += clip.durationSeconds;
    }
    return undefined;
  }
  
  /** This function returns the list of UserInteraction objects with their timings relative to the clip's start time.
   *  e.g. if the event has a time of 500ms that means it occurs 500ms after the clip starts.
   */
  export function getInteractionLogEventsForClip(
    project: KaveDoc | null,
    clip: Clip
  ): UserInteraction[] {
    if (!project) {
      return [];
    }
    const sequence = project.sequences.find((f) => f.id === clip.sourceId);
  
    if (!sequence) {
      return [];
    }
  
    let interactionLogFile: InteractionLogFile | undefined;
    const track = sequence.tracks.find((t) => {
      const file = project.files.find((f) => f.id === t.fileId);
      if (file?.type === FileType.interaction_log) {
        interactionLogFile = file;
        return true;
      }
      return false;
    });
  
    if (!interactionLogFile || !track) {
      return [];
    }
  
    const sequenceTrackOffset = -track.alignmentSeconds; 
    const interactionLogStartTime = interactionLogFile.userInteractionLog?.log[0]?.time ?? 0;
    const clipInteractionLogOffsetSeconds = clip.sourceOffsetSeconds + sequenceTrackOffset + interactionLogStartTime / 1000;

    const events = [];
    for (const event of interactionLogFile.userInteractionLog?.log ?? []) {
        const eventTimeSeconds = event.time / 1000 - clipInteractionLogOffsetSeconds;
        if (eventTimeSeconds < 0) {
            continue;
        }
        if (eventTimeSeconds > clip.durationSeconds) {
            break;
        }
        events.push({
            ...event,
            time: eventTimeSeconds * 1000,
        });
    }
  
    return events;
  }

export function getInteractionLogEventsForComposition(
    project: KaveDoc,
    compositionId: string
  ): UserInteraction[] {
    const composition = project.compositions.find((c) => c.id === compositionId);
  
    if (!composition) {
      throw new Error(`Composition ${compositionId} not found`);
    }
  
    const events: UserInteraction[] = [];
    let clipCompositionOffset = 0;
    for (const clip of composition.clips) {
      const log = getInteractionLogEventsForClip(project, clip) ?? {}
  
      if (!log) {
        continue;
      }
  
      for (const event of log ?? []) {
        events.push({
          ...event,
          time: event.time + clipCompositionOffset * 1000,
        });
      }
      clipCompositionOffset += clip.durationSeconds;
    }
  
    return events;
  }