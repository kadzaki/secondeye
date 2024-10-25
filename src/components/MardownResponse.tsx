import { responseAtom, activerHoverBoxAtom } from "../atoms";
import { useAtom } from "jotai";
import Markdown from "react-markdown";
import { replaceLinkFormat } from "../utils";
import { useEffect, useRef } from "react";
import breaks from "remark-breaks";
import { colors } from "../consts";
import {
  videoRefAtom,
} from "../atoms";
import {timestampToSeconds} from '../utils';

export function MardownResponse() {
  const [, setActiveHoverBox] = useAtom(activerHoverBoxAtom);
  const markdownWrapperRef = useRef<HTMLDivElement | null>(null);
  const [response] = useAtom(responseAtom);
  const [videoRef] = useAtom(videoRefAtom);

  useEffect(() => {
    function handleMouseOver(event: MouseEvent) {
      // Check if the target of the event is an 'a' element
      const target = event.target as HTMLElement;
      if (target && target.tagName === "A") {
        const targetRef = target.getAttribute("href");
        if (targetRef && targetRef.startsWith("#bb-")) {
          setActiveHoverBox(targetRef.replace("#bb-", ""));
        }
      }
    }
    function handleMouseEnter() {
      setActiveHoverBox("active");
    }
    function handleMouseLeave() {
      setActiveHoverBox(null);
    }
    function handleClick(e) {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "A") {
        const targetRef = target.getAttribute("href");
        if (targetRef && targetRef.startsWith("#bb-")) {
          const parts = targetRef.split('-');
          (videoRef.current as HTMLVideoElement).currentTime = timestampToSeconds(parts[1]);
        }
      }
    }

    if (markdownWrapperRef.current) {
      markdownWrapperRef.current.addEventListener("mouseover", handleMouseOver);
      markdownWrapperRef.current.addEventListener("mouseenter", handleMouseEnter);
      markdownWrapperRef.current.addEventListener("mouseleave", handleMouseLeave);
      markdownWrapperRef.current.addEventListener("click", handleClick);
    }
    return () => {
      if (markdownWrapperRef.current) {
        markdownWrapperRef.current.removeEventListener(
          "mouseover",
          handleMouseOver
        );
        markdownWrapperRef.current.removeEventListener(
          "mouseenter",
          handleMouseEnter
        );
        markdownWrapperRef.current.removeEventListener(
          "mouseleave",
          handleMouseLeave
        );
      }
    };

  }, [markdownWrapperRef, setActiveHoverBox]);

  useEffect(() => {
    if (markdownWrapperRef.current) {
      const tags = [...markdownWrapperRef.current?.getElementsByTagName('a')];
      tags.forEach((tag, i) => { 
        tag.style.backgroundColor = colors[i % colors.length];
      });
    }
  }, [response]);

  return (
    <div ref={markdownWrapperRef}>
      <Markdown remarkPlugins={breaks}>
        {replaceLinkFormat(response)}
      </Markdown>
    </div>
  );
}

