import { FileType, KaveFile } from "kave-common";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./EventLogDropZone.css";

export interface FileDropEvent {
    files: KaveFile[];
}

export default function FileDropZone({
  onFileDrop,
}: {
  onFileDrop: (event: FileDropEvent) => void;
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
    async (e: DragEvent) => {
      e.preventDefault();
      hideDropZone();

      let files: KaveFile[] = [];
      for (const item of e.dataTransfer?.items ?? e.dataTransfer?.files ?? []) {
        // If dropped items aren't files, ignore them
        if ((item as DataTransferItem).kind === "file") {
          const file = (item as DataTransferItem).getAsFile();

          if (!file) {
            return;
          }
          const nameParts = file.name.split(".");
          if (nameParts.length < 2) {
            return;
          }
          switch (nameParts[nameParts.length - 1]) {
            case "json":
              files.push(
                {
                  userInteractionLog: JSON.parse(await file.text()),
                  type: FileType.interaction_log,
                  id: uuidv4()
              });
              break;
            default:
              files.push({
                fileUri: URL.createObjectURL(file),
                type: FileType.video,
                id: uuidv4(),
                resolution: {
                  x: 1920,
                  y: 1080,
                },
              })
          }
        }
      }

      onFileDrop({
        files 
      });
    },
    [hideDropZone]
  );

  useEffect(() => {
    window.addEventListener("dragenter", showDropZone);
    return () => {
      window.removeEventListener("dragenter", showDropZone);
    };
  }, [showDropZone]);

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
