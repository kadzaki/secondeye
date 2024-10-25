import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileArrowUp, faVideo, faEraser, faPencil, faSquare, faPaperPlane, faDisplay } from '@fortawesome/free-solid-svg-icons'
import { Canvas } from './components/Canvas'
import { Video } from './components/Video'
import { LiveVideo } from './components/LiveVideo'
import { useDrawImageToCanvas, useSaveCanvasToLocalStorage } from './hooks'
import { useEffect, useRef, useState } from "react"
import { useAtom } from "jotai";
import { predictImage, predictVideo, predictLiveVideo, uploadVideo } from "./modelUtils";
import { MardownResponse } from "./components/MardownResponse";
import { imagePromptSuffix, videoPromptSuffix, learnFromVideoPrompt, Media_Type, INTERVAL, MAX_SCREENSHOTS } from "./consts";
import { setIntervalAsync } from 'set-interval-async';
import logo from './assets/logo.png';
import {
  inkColorAtom,
  canvasRefAtom,
  responseAtom,
  overlayCanvasRefAtom,
  drawTypeAtom,
  activeModelAtom,
  promptAtom,
  isGeneratingAtom,
} from "./atoms";

function App() {
  const [canvasRef] = useAtom(canvasRefAtom);
  const [overlayCanvasRef] = useAtom(overlayCanvasRefAtom);
  const [drawType, setDrawType] = useAtom(drawTypeAtom);
  const [inkColor, setInkColor] = useAtom(inkColorAtom);
  const [activeModel, setActiveModel] = useAtom(activeModelAtom);
  const [prompt, setPrompt] = useAtom(promptAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const pointsRef = useRef<
    { line: [number, number, number][]; color: string }[]
  >([]);

  const drawImageToCanvas = useDrawImageToCanvas();
  const saveCanvasToLocalStorage = useSaveCanvasToLocalStorage();
  const [response, setResponse] = useAtom(responseAtom);
  const [isUloading, setIsUloading] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');
  const [mediaType, setMediaType] = useState(Media_Type.IMAGE);
  const [webcamImageGrid, setWebcamImageGrid] = useState('');
  const [audioContent, setAudioContent] = useState('');
  const audioPlayerRef = useRef(new Audio());
  const latestWebcamImageGridRef = useRef(webcamImageGrid);
  const [learnTaskFromVideo, setLearnTaskFromVideo] = useState(false);

  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;

    if (audioContent) {
      const playAudio = async () => {
        try {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          audioPlayer.src = audioContent;
          await audioPlayer.play();

        } catch (error) {
          console.error('Error playing audio:', error);
        }
      };

      playAudio();
    }
  }, [audioContent]);
  
  useEffect(() => {
    latestWebcamImageGridRef.current = webcamImageGrid;
  }, [webcamImageGrid]);

  return (
    <>
      <div className="container">
        <a href="/">
          <img src={logo} alt='SecondEye' className='logo' />
        </a>
      </div>
      <div className="container">
          <div className="panel left-panel">
              <div>
                <h2>Media Source</h2>
                <h4>Upload Image or a Video File</h4>
                <label className="custom-file-upload">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, video/mp4"
                    onClick={(e) => {
                      e.currentTarget.value = "";
                    }}
                    onChange={async (e) => {
                      const files = e.currentTarget.files;
                      if (files) {
                        if (files[0].type == 'image/jpeg' || files[0].type == 'image/png') {
                          const imageData = URL.createObjectURL(files[0]);
                          setMediaType(Media_Type.IMAGE);
                          drawImageToCanvas(imageData);
                        } 
                        else if (files[0].type == 'video/mp4') {
                          const formData = new FormData(); 
                          formData.append('my-video-file', files[0], files[0].name);
                          setIsUloading(true);
                          const res = await uploadVideo(formData);
                          setIsUloading(false);
                          setVideoFileName(res.videoFileName);
                          setMediaType(Media_Type.VIDEO);
                        }
                      }
                    }}
                  /><FontAwesomeIcon icon={faFileArrowUp} /> { isUloading ? 'Uploading file...' : 'Select File' }
                </label>
                <button onClick={() => { setMediaType(Media_Type.WEBCAM); }}><FontAwesomeIcon icon={faVideo} /> Use Webcam</button>
                <button onClick={() => { setMediaType(Media_Type.SCREEN); }}><FontAwesomeIcon icon={faDisplay} /> Capture Screen</button>
              </div>
              <hr />
              { mediaType == Media_Type.IMAGE &&
                <>
                  <div>
                    <h2>Tools</h2>
                    <ul className='toolsWrap'>
                      <li><a href="#" title='Pencil' onClick={() => { setDrawType('pen'); }}><FontAwesomeIcon icon={faPencil} /></a></li>
                      <li><a href="#" title='Square' onClick={() => { setDrawType('rec'); }}><FontAwesomeIcon icon={faSquare} /></a></li>
                      <li>
                          <input
                            type="color"
                            value={inkColor}
                            title='Color picker'
                            onChange={(e) => {
                              setInkColor(e.currentTarget.value);
                            }}
                          />
                      </li>
                    </ul>
                    <button
                      onClick={() => {
                        const c = canvasRef.current!;
                        const ctx = c.getContext("2d")!;
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, c.width, c.height);

                        const co = overlayCanvasRef.current!;
                        const ctxo = co.getContext("2d")!;
                        ctxo.clearRect(0, 0, co.width, co.height);
        
                        pointsRef.current = [];
                        saveCanvasToLocalStorage();
                        setResponse("");
                      }}
                    ><FontAwesomeIcon icon={faEraser} /> Clear Canvas</button>
                  </div>
                  <hr />
                </>
              }
              <div className='modelChoiceWrap'>
                <h2>Model</h2>
                <label htmlFor="flash">
                  <input 
                    id='flash' 
                    type="radio" 
                    name='model' 
                    value='flash' 
                    checked={activeModel === "flash"}
                    onChange={() => {
                      setActiveModel("flash");
                    }}
                  />Flash</label>
                <label htmlFor="pro">
                  <input 
                    id='pro' 
                    type="radio" 
                    name='model' 
                    value='pro'
                    checked={activeModel === "pro"}
                    onChange={() => {
                      setActiveModel("pro");
                    }}
                  />Pro</label>
              </div>
          </div>
          <div className="panel main-content">
              { mediaType == Media_Type.IMAGE && <Canvas /> }
              { mediaType == Media_Type.VIDEO && <Video videoFileName={videoFileName} /> }
              { mediaType == Media_Type.WEBCAM && <LiveVideo setWebcamImageGrid={setWebcamImageGrid} streamType={Media_Type.WEBCAM} /> }
              { mediaType == Media_Type.SCREEN && <LiveVideo setWebcamImageGrid={setWebcamImageGrid} streamType={Media_Type.SCREEN} /> }
              <div>
                <label htmlFor="usecase">Use case</label>
                { mediaType == Media_Type.IMAGE &&
                  <select id="usecase" onChange={(e) => { setPrompt(e.currentTarget.value); }}>
                    <option value=""></option>
                    <option value="Define up to 10 unique objects present in the image">Objects definition</option>
                    <option value="Describe each object present in the image">Objects description</option>
                    <option value="Locate the OBJECT/ACTION/EVENT present in the image">Locate an object/action/event</option>
                    <option value="How can i repair the OBJECT present in the image">How to repair</option>
                    <option value="How can i assemble the OBJECT present in the image">How to assemble</option>
                    <option value="Give design feedback on this landing page">Website design feedback</option>
                  </select> }
                { mediaType == Media_Type.VIDEO && 
                  <select id="usecase" onChange={(e) => { 
                      if (e.currentTarget.value == 'LEARN_FROM_VIDEO') {
                        setLearnTaskFromVideo(true);
                        setPrompt('');
                      } else {
                        setPrompt(e.currentTarget.value);
                        setLearnTaskFromVideo(false);
                      }
                    }}>
                    <option value=""></option>
                    <option value="Locate each occurrence of the OBJECT/ACTION/EVENT present in the video">Locate an object/action/event</option>
                    <option value="LEARN_FROM_VIDEO">Learn task from video</option>
                  </select> }
                { mediaType == Media_Type.WEBCAM && 
                <select id="usecase" onChange={(e) => { setPrompt(e.currentTarget.value); }}>
                  <option value=""></option>
                  <option value="Give live commentary of the video stream">Live commentary</option>
                </select> }
                { mediaType == Media_Type.SCREEN && 
                <select id="usecase" onChange={(e) => { setPrompt(e.currentTarget.value); }}>
                  <option value=""></option>
                  <option value="Give live commentary of the video stream">Live commentary</option>
                </select> }
                <label htmlFor="">Custom prompt</label>
                <div>
                  <textarea 
                    value={prompt}
                    placeholder="prompt"
                    rows={5}
                    onChange={(e) => {
                      setPrompt(e.currentTarget.value);
                    }}
                  ></textarea>
                </div>
              </div>
              <div>
                {isGenerating ? (
                  <div>
                    Generating...
                  </div>
                  ) : (
                    <div>
                      <button
                        className='sendBtn'
                        onClick={async () => {
                          setResponse("Generating response...");
                          setIsGenerating(true);
                          try {
                            let res;

                            if (mediaType == Media_Type.IMAGE) {
                                const imgUrl = canvasRef
                                .current!.toDataURL("image/jpeg", 0.5)
                                .replace("data:image/jpeg;base64,", "");

                              res = await predictImage(
                                imgUrl,
                                prompt + imagePromptSuffix,
                                activeModel,
                              );
                            } else if (mediaType == Media_Type.VIDEO) {
                              let videoPrompt = prompt + videoPromptSuffix;

                              if (learnTaskFromVideo) {
                                videoPrompt = learnFromVideoPrompt;
                              }

                              res = await predictVideo(
                                videoFileName,
                                videoPrompt,
                                activeModel,
                              );
                            } else if (mediaType == Media_Type.WEBCAM || mediaType == Media_Type.SCREEN) {
                              const intervalId = setIntervalAsync(async() => {
                                let res = await predictLiveVideo(
                                  latestWebcamImageGridRef.current,
                                  prompt,
                                  activeModel,
                                )

                                if (res) {
                                  if (res['text'] === undefined) {
                                    setResponse("");
                                    alert(
                                      "Something went wrong. Most likely we hit the rate limit. If you're using the Pro model, you can try Flash. If Flash is also not working, you can clone and set up locally or try again later.",
                                    );
                                  } else {
                                    setResponse(res['text']);

                                    if (res['audio'] != undefined) {
                                      setAudioContent(res['audio']);
                                    }
                                  }
                                }
                              }, ( MAX_SCREENSHOTS / (1000 / INTERVAL) ) * 1000 );
                            }

                            if (res) {
                              if (res['text'] === undefined) {
                                setResponse("");
                                alert(
                                  "Something went wrong. Most likely we hit the rate limit. If you're using the Pro model, you can try Flash. If Flash is also not working, you can clone and set up locally or try again later.",
                                );
                              } else {
                                setResponse(res['text']);
                              }
                            }
                          } catch (e) {
                            setResponse("");
                            alert(e.error);
                          }
                          setIsGenerating(false);
                        }}
                      >
                      <FontAwesomeIcon icon={faPaperPlane} /> Send
                    </button>
                  </div>
                )}
              </div>
          </div>
          <div className="panel right-panel">
              <h2>Response</h2>
              <MardownResponse />
          </div>
      </div>
    </>
  )
}

export default App
