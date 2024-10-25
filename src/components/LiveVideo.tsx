import {useRef, useEffect, useState} from 'react';
import mergeImages from "merge-images";
import {s2t} from '../modelUtils';
import { AudioRecorder } from 'react-audio-voice-recorder';
import { predictLiveVideo, predictLiveScreenSharing } from "../modelUtils";
import { INTERVAL, 
    IMAGE_WIDTH, 
    IMAGE_QUALITY,
    COLUMNS,
    MAX_SCREENSHOTS,
    transparentPixel, 
    Media_Type
  } from "../consts";

import { responseAtom, activeModelAtom } from "../atoms";
import { useAtom } from "jotai";

export function LiveVideo({setWebcamImageGrid, streamType}) {
    const webcamRef = useRef<HTMLVideoElement | null>(null);
    const webcamCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [liveImageGrid, setLiveImageGrid] = useState('');
    const audioPlayerRef = useRef(new Audio());
    const [response, setResponse] = useAtom(responseAtom);
    const [activeModel, setActiveModel] = useAtom(activeModelAtom);

    let currentFrames: any[] = [];

    const addAudioElement = async(blob) => {

      setResponse("Generating response...");

      var reader = new FileReader();
      reader.readAsDataURL(blob); 

      reader.onloadend = await function() {
        let base64 = reader.result;
        if (base64) {
          base64 = base64.split(',')[1];
          s2t(base64).then( promptContent => { 

            if (promptContent.transcription) {
              if (streamType == Media_Type.WEBCAM) {

                let res = predictLiveVideo(
                  liveImageGrid,
                  promptContent.transcription,
                  activeModel,
                ).then( res => {
                  
                  if (res) {
                    if (res['text'] === undefined) {
                      alert(
                        "Something went wrong. Most likely we hit the rate limit. If you're using the Pro model, you can try Flash. If Flash is also not working, you can clone and set up locally or try again later.",
                      );
                    } else {
                      setResponse(res['text']);
  
                      if (res['audio'] != undefined) {
                        const audioPlayer = audioPlayerRef.current;
                        audioPlayer.pause();
                        audioPlayer.currentTime = 0;
                        audioPlayer.src = res['audio'];
                        audioPlayer.play();
                      }
                    }
                  }
  
                } );

              } else if (streamType == Media_Type.SCREEN) {
                captureLatestFrame().then(latestFrame => {

                  if (latestFrame) {
                    let res = predictLiveScreenSharing(
                      latestFrame,
                      promptContent.transcription,
                      activeModel,
                    ).then( res => {
                      
                      if (res) {
                        if (res['text'] === undefined) {
                          alert(
                            "Something went wrong. Most likely we hit the rate limit. If you're using the Pro model, you can try Flash. If Flash is also not working, you can clone and set up locally or try again later.",
                          );
                        } else {
                          setResponse(res['text']);
      
                          if (res['audio'] != undefined) {
                            const audioPlayer = audioPlayerRef.current;
                            audioPlayer.pause();
                            audioPlayer.currentTime = 0;
                            audioPlayer.src = res['audio'];
                            audioPlayer.play();
                          }
                        }
                      }
      
                    } );
                  }

                });

              }

            }
            
          } );
        }
      }

    }

    async function getImageDimensions(src) {
        return new Promise((resolve, reject) => {
          const img = new globalThis.Image();
      
          img.onload = function () {
            resolve({
              width: this.width,
              height: this.height,
            });
          };
      
          img.onerror = function () {
            reject(new Error("Failed to load image."));
          };
      
          img.src = src;
        });
    }

    async function imagesGrid({
        base64Images,
        columns = COLUMNS,
        gridImageWidth = IMAGE_WIDTH,
        quality = IMAGE_QUALITY,
      }) {
        if (!base64Images.length) {
          return transparentPixel;
        }
      
        const dimensions = await getImageDimensions(base64Images[0]);
      
        // Calculate the aspect ratio of the first image
        const aspectRatio = dimensions.width / dimensions.height;
      
        const gridImageHeight = gridImageWidth / aspectRatio;
      
        const rows = Math.ceil(base64Images.length / columns); // Number of rows
      
        // Prepare the images for merging
        const imagesWithCoordinates = base64Images.map((src, index) => ({
          src,
          x: (index % columns) * gridImageWidth,
          y: Math.floor(index / columns) * gridImageHeight,
        }));
      
        // Merge images into a single base64 string
        return await mergeImages(imagesWithCoordinates, {
          format: "image/jpeg",
          quality,
          width: columns * gridImageWidth,
          height: rows * gridImageHeight,
        });
    }

    const captureScreen = async() => {
      try {
        var displayMediaOptions = {
          video: {
            cursor: "always",
          },
          audio: false,
        };

        (webcamRef.current as HTMLVideoElement).srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      } catch (error) {
        console.log(error);
      }
    }

    // Capture frames
    const captureFrame = async () => {
      if (webcamRef.current && webcamCanvasRef.current) {
          const context = webcamCanvasRef.current.getContext("2d");
          const originalWidth = webcamRef.current.videoWidth;
          const originalHeight = webcamRef.current.videoHeight;
          const aspectRatio = originalHeight / originalWidth;

          // Set new width while maintaining aspect ratio
          webcamCanvasRef.current.width = 512;
          webcamCanvasRef.current.height = 512 * aspectRatio;

          context?.drawImage(webcamRef.current, 0, 0, webcamCanvasRef.current.width, webcamCanvasRef.current.height);
          // Compress and convert image to JPEG format
          const quality = 1; // Adjust the quality as needed, between 0 and 1
          const base64Image = webcamCanvasRef.current.toDataURL("image/jpeg", quality);

          if (base64Image !== "data:,") {
              currentFrames.push(base64Image);
          }

          currentFrames = currentFrames.slice(-MAX_SCREENSHOTS);

          const imageUrl = await imagesGrid({ base64Images: currentFrames });
          setWebcamImageGrid(imageUrl);
          setLiveImageGrid(imageUrl);
      }
    }

    const captureLatestFrame = async () => {
      if (webcamRef.current && webcamCanvasRef.current) {
          const context = webcamCanvasRef.current.getContext("2d");

          // Set new width while maintaining aspect ratio
          webcamCanvasRef.current.width = webcamRef.current.videoWidth;
          webcamCanvasRef.current.height = webcamRef.current.videoHeight;

          context?.drawImage(webcamRef.current, 0, 0, webcamCanvasRef.current.width, webcamCanvasRef.current.height);
          // Compress and convert image to JPEG format
          const quality = 1; // Adjust the quality as needed, between 0 and 1
          const base64Image = webcamCanvasRef.current.toDataURL("image/jpeg", quality);

          if (base64Image !== "data:,") {
            return base64Image;
          }
      }

      return null;
    }

    useEffect(() => {
        if (streamType == Media_Type.WEBCAM) {
          // Stream from webcam
          if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    (webcamRef.current as HTMLVideoElement).srcObject = stream;
                })
                .catch((error) => {
                    console.error('Error accessing webcam:', error);
                });
          } else {
              console.error('getUserMedia not supported in this browser.');
          }
        } else if (streamType == Media_Type.SCREEN) {
            if (navigator.mediaDevices.getUserMedia) {
              captureScreen();
            } else {
              console.error('getUserMedia not supported in this browser.');
            }
        }

        const intervalId = setInterval(captureFrame, INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return (
        <>
          <div className='webcamWrap'>
              <video width="512" autoPlay ref={webcamRef}></video>
              <canvas ref={webcamCanvasRef} style={{ display: "none" }} />
          </div>
          <AudioRecorder 
            onRecordingComplete={addAudioElement}
            audioTrackConstraints={{
              noiseSuppression: true,
              echoCancellation: true,
            }} 
            downloadFileExtension="webm"
          />
        </>
    );
}