import {
    videoRefAtom,
} from "../atoms";
import {useRef, useEffect} from 'react';
import {timestampToSeconds} from '../utils';
import { useAtom, useSetAtom } from "jotai";

export function Video({videoFileName}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoRefA] = useAtom(videoRefAtom);

    const timestamp = "00:29";
    const tsInSeconds = timestampToSeconds(timestamp);

    useEffect(() => {
        videoRefA.current = videoRef.current;
    }, [videoRefA]);

    return (
        <div className='videoWrap'>
            <video width="612" controls ref={videoRef}>
                <source src={`/uploads/${videoFileName}`} type="video/mp4" />
            </video>
        </div>
    );
}