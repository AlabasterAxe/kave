import { MutableRefObject, useRef, useState } from "react";
import { DraggableCore } from "react-draggable";
import styled from "styled-components";
import "./App.css";

const OuterStyle = styled.div`
  background-color: green;
  color: white;
  height: 100px;
  display: flex;
  position: relative;
`;

const DragHandle = styled.div`
  background-color: red;
  height: 100%;
  width: 10px;
  position: absolute;
`;

const LeftDragHandle = styled(DragHandle)`
  left: 0;
`;

const RightDragHandle = styled(DragHandle)`
  right: 0;
`;

const Contents = styled.div`
  display: flex;
  flex-direction: column;
`;

interface ComProps {
  leftPosition: number;
  rightPosition: number;
  leftHandleCallback: (amount: number) => void;
  rightHandleCallback: (amount: number) => void;
  offsetParent: HTMLElement;
}

function Comp(props: ComProps) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const {
    leftPosition,
    rightPosition,
    leftHandleCallback,
    rightHandleCallback,
    offsetParent,
  } = props;
  const style = {
    left: leftPosition,
    width: rightPosition - leftPosition,
  };
  return (
    <OuterStyle style={style}>
      <DraggableCore
        // axis="x"
        nodeRef={leftRef}
        onDrag={(e, data) => {
          leftHandleCallback(data.deltaX);
        }}
        offsetParent={offsetParent}
      >
        <LeftDragHandle ref={leftRef}></LeftDragHandle>
      </DraggableCore>
      <Contents>
        <span>Left: {leftPosition}</span>
        <span>Right: {rightPosition}</span>
      </Contents>
      <DraggableCore
        // axis="x"
        nodeRef={rightRef}
        onDrag={(e, data) => {
          rightHandleCallback(data.deltaX);
        }}
        offsetParent={offsetParent}
      >
        <RightDragHandle ref={rightRef}></RightDragHandle>
      </DraggableCore>
    </OuterStyle>
  );
}

function App() {
  const [leftPosition, setLeftPosition] = useState(0);
  const [rightPosition, setRightPosition] = useState(100);
  const parent: MutableRefObject<HTMLDivElement | null> = useRef(null);
  return (
    <div ref={parent} className="App">
      <Comp
        leftPosition={leftPosition}
        leftHandleCallback={(delta: number) => {
          setLeftPosition(leftPosition + delta);
        }}
        rightPosition={rightPosition}
        rightHandleCallback={(delta: number) => {
          setRightPosition(rightPosition + delta);
        }}
        offsetParent={parent.current!}
      ></Comp>
    </div>
  );
}

export default App;
