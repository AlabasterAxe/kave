import { useRef, useEffect } from "react";
import { JSONEditor, JSONEditorPropsOptional, Mode } from "vanilla-jsoneditor";

type Props = JSONEditorPropsOptional & {
  hidden?: boolean;
  id?: string;
};

export default function JsonEditor({ id, hidden, ...props }: Props) {
  const refContainer = useRef<HTMLDivElement>(null);
  const refEditor = useRef<JSONEditor | null>(null);

  useEffect(() => {
    // create editor
    if (refContainer.current) {
      refEditor.current = new JSONEditor({
        target: refContainer.current,
        props: {},
      });
    }

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      refEditor.current.updateProps({
        ...props,
        mainMenuBar: false,
        mode: Mode.text,
        navigationBar: false,
        statusBar: false,
      });
    }
  }, [props]);

  return (
    <div
      className="h-full"
      onWheel={(e) => {
        e.stopPropagation();
      }}
      id={id}
      hidden={hidden}
      ref={refContainer}
    ></div>
  );
}
