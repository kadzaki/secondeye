import express from "express";
import ViteExpress from "vite-express";
import multer from 'multer';

// Import the Genkit core libraries and plugins.
import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';

import { removeMarkdown } from './src/serverUtils.js';

import { vertexAI } from '@genkit-ai/vertexai';
import { gemini15Flash, gemini15Pro } from '@genkit-ai/vertexai';

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// eslint-disable-next-line no-undef
const geminiApiKey = process.env["GOOGLE_GENAI_API_KEY"];
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Initialize GoogleAIFileManager with your API_KEY.
const fileManager = new GoogleAIFileManager(geminiApiKey);

configureGenkit({
  plugins: [
    vertexAI({ projectId: 'annular-hexagon-269719', location: 'us-central1' }),
  ],
  // Log debug output to tbe console.
  logLevel: "debug",
  // Perform OpenTelemetry instrumentation and enable trace collection.
  enableTracingAndMetrics: true,
});

// TTS client
const ttsClient = new textToSpeech.TextToSpeechClient();

// S2T client
const speechClient = new speech.SpeechClient();

const speechConfig = {
  encoding: 'WEBM_OPUS',
  sampleRateHertz: '48000',
  languageCode: 'en-US',
};

const videoUploadPath = './uploads';

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, videoUploadPath)
  },
  filename: function(req, file, cb) {
    cb(null, `${file.fieldname}_dateVal_${Date.now()}_${file.originalname}`)
  }
})

const videoUpload = multer({storage: storage})

const liveFeedInstructions = `Context: The assistant receives a tiled series of screenshots from a user's live video feed. These screenshots represent sequential frames from the video, capturing distinct moments. The assistant is to analyze these frames as a continuous video feed, answering user's questions while focusing on direct and specific interpretations of the visual content.
1. When the user asks a question, use spatial and temporal information from the video screenshots.
2. Respond with brief, precise answers to the user questions. Go straight to the point, avoid superficial details. Be concise as much as possible.
3. Address the user directly, and assume that what is shown in the images is what the user is doing.
4. Use "you" and "your" to refer to the user.
5. DO NOT mention a series of individual images, a strip, a grid, a pattern or a sequence. Do as if the user and the assistant were both seeing the video.
6. DO NOT be over descriptive.
7. Assistant will not interact with what is shown in the images. It is the user that is interacting with the objects in the images.
7. Keep in mind that the grid of images will show the same object in a sequence of time. E.g. If an identical glass is shown in several consecutive images, it is the same glass and NOT multiple glasses.
8. When asked about spatial questions, provide clear and specific information regarding the location and arrangement of elements within the frames. This includes understanding and describing the relative positions, distances, and orientations of objects and people in the visual field, as if observing a real-time 3D space.
9. If the user gives instructions, follow them precisely.`

const liveScreenSharingInstructions = `Context: The assistant receives a screenshot from a user desktop or mobile screen. The assistant is to analyze the screenshot, answering user's questions while focusing on direct and specific interpretations of the visual content.
1. Respond with brief, precise answers to the user's questions. Go straight to the point, avoid superficial details. Be concise as much as possible.
2. Address the user directly, and assume that what is shown in the  screenshot is what the user is doing.
3. Use "you" and "your" to refer to the user.
4. Assistant will not interact with what is shown in the  screenshot. It is the user that is interacting with what is in the  screenshot.
5. If the user gives instructions, follow them precisely.`;

let history = [];

let liveVideoHistory = [
  { role: 'system', content: [{ text: liveFeedInstructions }] },
];

let liveScreenSharingHistory = [
  { role: 'system', content: [{ text: liveScreenSharingInstructions }] },
];

app.post('/video-upload', videoUpload.array("my-video-file"), (req, res) => {
  res.json({ 'videoFileName': req.files[0].filename });
})

app.post("/api/generateResponseToTextAndImage", async (req, res) => {
  const { prompt, imageData, activeModel } = req.body;

  let model = gemini15Flash;

  if (activeModel === 'pro') {
    model = gemini15Pro;
  }

  try {
    let response = await generate({
      model,
      prompt: [
        { text: prompt },
        {
          media: {
            url: imageData,
            contentType: 'image/jpeg',
          },
        },
      ],
      history
    });

    history = response.toHistory();

    const text = response.text();
    res.json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generateResponseToTextAndVideo", async (req, res) => {
  const { prompt, videoFileName, activeModel } = req.body;

  const uploadResponse = await fileManager.uploadFile(`${videoUploadPath}/${videoFileName}`, {
    mimeType: "video/mp4",
    displayName: "Video",
  });

  // View the response.
  //console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);
  
  // Poll getFile() on a set interval (10 seconds here) to check file state.
  const name = uploadResponse.file.name;
  let file = await fileManager.getFile(name);

  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".")
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(name)
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Video processing failed.");
  }

  // When file.state is ACTIVE, the file is ready to be used for inference.
  //console.log(`File ${file.displayName} is ready for inference as ${file.uri}`);

  try {
    // At the time of writing this, Genkit did not yet support video file input. I opened an issue about this, and it is being implemented.
    let model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    if (activeModel === 'pro') {
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
      });
    }

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri
        }
      },
      { text: prompt },
    ]);

    const text = result.response.text();

    res.json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generateResponseFromLiveVideoToTextAndImage", async (req, res) => {
  const { prompt, imageData, activeModel } = req.body;

  try {
    let model = gemini15Flash;

    if (activeModel === 'pro') {
      model = gemini15Pro;
    }

    const response = await generate({
      model,
      prompt: [
        { text: prompt },
        {
          media: {
            url: imageData,
            contentType: 'image/jpeg',
          },
        },
      ],
      history: liveVideoHistory
    });

    liveVideoHistory = response.toHistory();

    const text = response.text();

    // Construct the request
    const request = {
      input: {text: removeMarkdown(text)},
      // Select the language and SSML voice gender (optional)
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      // select the type of audio encoding
      audioConfig: {audioEncoding: 'MP3'},
    };
  
    // Performs the text-to-speech request
    const [ttsResponse] = await ttsClient.synthesizeSpeech(request);

    res.json({ text, 'audio': `data:audio/mp3;base64,${ttsResponse.audioContent.toString('base64')}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generateResponseFromLiveScreenSharingToTextAndImage", async (req, res) => {
  const { prompt, imageData, activeModel } = req.body;

  try {
    let model = gemini15Flash;

    if (activeModel === 'pro') {
      model = gemini15Pro;
    }

    const response = await generate({
      model,
      prompt: [
        { text: prompt },
        {
          media: {
            url: imageData,
            contentType: 'image/jpeg',
          },
        },
      ],
      history: liveScreenSharingHistory
    });

    liveScreenSharingHistory = response.toHistory();

    const text = response.text();

    // Construct the request
    const request = {
      input: {text: removeMarkdown(text)},
      // Select the language and SSML voice gender (optional)
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      // select the type of audio encoding
      audioConfig: {audioEncoding: 'MP3'},
    };
  
    // Performs the text-to-speech request
    const [ttsResponse] = await ttsClient.synthesizeSpeech(request);

    res.json({ text, 'audio': `data:audio/mp3;base64,${ttsResponse.audioContent.toString('base64')}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/s2t", async (req, res) => {
  const { audio } = req.body;

  const speechRequest = {
    config: speechConfig,
    audio: {'content': audio},
  };

  try {
    const [response] = await speechClient.recognize(speechRequest);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    //console.log('Transcription: ', transcription);

    res.json({ transcription });
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }

});

// eslint-disable-next-line no-undef
const port = process.env.NODE_ENV === "production" ? 8080 : 3000;

ViteExpress.listen(app, port, () => console.log("Server is listening..."));
