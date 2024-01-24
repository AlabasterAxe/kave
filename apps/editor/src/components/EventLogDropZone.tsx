import { FileType, InteractionLogFile, UserInteraction } from "kave-common";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./EventLogDropZone.css";

export interface InteractionLogResult {
    file: InteractionLogFile;
}

export default function EventLogDropZone({
  onNewLog,
}: {
  onNewLog: (payload: InteractionLogResult) => void;
}) {
  const [dropZoneVisible, setDropZoneVisible] = useState<boolean>(false);

  function allowDrag(e: any) {
    e.preventDefault();
  }
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const showDropZone = useCallback(() => {
    setDropZoneVisible(true);
  }, [setDropZoneVisible]);

  const hideDropZone = useCallback(() => {
    setDropZoneVisible(false);
  }, [setDropZoneVisible]);

  const handleDrop = useCallback(
    async (e: any) => {
      e.preventDefault();
      hideDropZone();

      let events: UserInteraction[] = [];
      for (const item of e.dataTransfer.items ?? e.dataTransfer.files) {
        // If dropped items aren't files, ignore them
        if (item.kind === "file") {
          const file = item.getAsFile();
          events.push(...JSON.parse(await file.text()));
        }
      }

      onNewLog({
        file: {
            userInteractionLog: {
                log: events
            },
            type: FileType.interaction_log,
            id: uuidv4()
        }
      });
    },
    [hideDropZone]
  );

  useEffect(() => {
    window.addEventListener("dragenter", showDropZone);
    return () => {
      window.removeEventListener("dragenter", showDropZone);
    };
  }, []);

  useEffect(() => {
    if (!dropZoneRef.current) {
      return;
    }
    dropZoneRef.current.addEventListener("dragenter", allowDrag);
    dropZoneRef.current.addEventListener("dragover", allowDrag);
    dropZoneRef.current.addEventListener("dragleave", hideDropZone);
    dropZoneRef.current.addEventListener("drop", handleDrop);
    return () => {
      dropZoneRef.current?.removeEventListener("dragenter", allowDrag);
      dropZoneRef.current?.removeEventListener("dragover", allowDrag);
      dropZoneRef.current?.removeEventListener("dragleave", hideDropZone);
      dropZoneRef.current?.removeEventListener("drop", handleDrop);
    };
  }, [dropZoneRef, allowDrag, hideDropZone, handleDrop]);
  // 2

  // 4

  return dropZoneVisible ? (
    <div ref={dropZoneRef} className="drop-zone">
      <div>DROP LOG HERE</div>
    </div>
  ) : null;
}
