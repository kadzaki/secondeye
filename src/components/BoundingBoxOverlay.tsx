import { useAtom } from "jotai";
import { activerHoverBoxAtom, responseAtom } from "../atoms";
import { parseBoundingBoxes } from "../utils";
import { canvasHeight, canvasWidth } from "../consts";
import { useRef } from "react";
import { colors } from "../consts";

export function BoundingBoxOverlay() {
  const [response] = useAtom(responseAtom);
  const [activeHoverBox, setActiverHoverBox] = useAtom(activerHoverBoxAtom);
  const bbWrapperRef = useRef<HTMLDivElement | null>(null);

  const boxes = parseBoundingBoxes(response);

  // remove duplicates
  const seen = new Set();
  const uniqueBoxes = boxes.filter((box) => {
    const key = box.text + box.numbers.join(",");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  const formatted: {
    name: string;
    coords: { x: number; y: number; width: number; height: number };
  }[] = uniqueBoxes.map((box) => {
    const coords = box.numbers;
    return {
      name: box.text,
      // convert from ["y_min", "x_min", "y_max", "x_max"];
      // convert from 1000x1000 space to percentage
      coords: {
        x: coords[1] / 1000,
        y: coords[0] / 1000,
        width: coords[3] / 1000 - coords[1] / 1000,
        height: coords[2] / 1000 - coords[0] / 1000,
      },
    };
  });

  return (
    <div
      ref={bbWrapperRef}
      className="overlayCanvas"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: "none",
      }}
    >
      {formatted.map((object, i) => {
        console.log(i);
        const { coords } = object;
        const box = uniqueBoxes[i];
        const string = box.numbers.join("-");
        return (
          <div
            className="tagWrap"
            key={`${object.name}-${string}`}
            data-string={string}
            style={{
              left: coords.x * 100 + ( (coords.width * 100) / 2 ) - 6 + "%",
              top: coords.y * 100 + (coords.height * 100) / 2 + "%",
              width: 0,
              height: 0,
              opacity:
                activeHoverBox === null ? 1 : activeHoverBox === string ? 1 : 0,
              transition: "opacity 0.1s linear",
            }}
          >
            <div style={{backgroundColor: colors[i % colors.length]}}>
              {object.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
