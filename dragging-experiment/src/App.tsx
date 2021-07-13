import { useRef, useState } from "react";
import Draggable from "react-draggable";
import "./App.css";
import styled from "styled-components";

const CompStyle = styled.div`
  background-color: green;
  height: 100px;
  width: 100px;
  color: white;
`;

interface ComProps {
  dragAmount?: number;
  dragCallback: (amount: number) => void;
}

function Comp(props: ComProps) {
  const ref = useRef(null);
  const { dragAmount, dragCallback } = props;
  return (
    <Draggable
      // axis="x"
      nodeRef={ref}
      onDrag={(e, data) => {
        dragCallback(data.x);
      }}
    >
      <CompStyle ref={ref} className="Comp">
        {dragAmount && dragAmount}
      </CompStyle>
    </Draggable>
  );
}

function App() {
  const [dragDeets, setDragDeets] = useState(0);
  return (
    <div className="App">
      <Comp
        dragAmount={dragDeets}
        dragCallback={(amt: number) => {
          setDragDeets(amt);
        }}
      ></Comp>
    </div>
  );
}

export default App;
