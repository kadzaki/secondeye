export const canvasWidth = 612;
export const canvasHeight = 612;
export const colors = ['#FF5252', '#2196F3', '#8BC34A', '#E91E63', '#7C4DFF', '#FF5722', '#607D8B', '#795548', '#009688', '#00BCD4'];

export enum Media_Type {
    IMAGE = 'image',
    VIDEO = 'video',
    WEBCAM = 'webcam',
    SCREEN = 'screen',
}

export const INTERVAL = 1000;
export const IMAGE_WIDTH = 512;
export const IMAGE_QUALITY = 0.6;
export const COLUMNS = 4;
export const MAX_SCREENSHOTS = 10;
export const transparentPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2lXzAAAACV0RVh0ZGF0ZTpjcmVhdGU9MjAyMy0xMC0xOFQxNTo0MDozMCswMDowMEfahTAAAAAldEVYdGRhdGU6bW9kaWZ5PTIwMjMtMTAtMThUMTU6NDA6MzArMDA6MDBa8cKfAAAAAElFTkSuQmCC";

export const defaultPrompt = "Define each object present in the image";
export const imagePromptSuffix = '. When you reference an object put its name and bounding box in the format: [object name](y_min x_min y_max x_max) and pass the other information.';
export const videoPromptSuffix = '. When you reference an object or a person put its name and timestamps in the format: [object name](MM:SS) and pass the other information.';
export const learnFromVideoPrompt = `You will receive a continuous feed of image frames from a video at a rate of 1 frame per second. Analyze these frames sequentially to generate a detailed and comprehensive description of the task being performed in the video. Pay attention to the following aspects:
**Task Overview:** Provide a summary of the task, including the main objective and the context in which it is performed.
**Step-by-Step Actions:** Break down the task into individual steps. Describe each action performed, including the sequence and timing, tools or objects used, and the specific movements or interactions involved.
**Environmental Factors:** Note the setting and any environmental conditions that might impact the task (e.g., lighting, background elements, positioning of objects).
**Human Elements:** Describe the actions, body language, and facial expressions of any people involved in the task. Note any verbal or non-verbal communication.
**Accuracy and Precision:** Pay special attention to the precision of actions, and identify any critical points where accuracy is essential.
**Anomalies or Variations:** Identify any deviations or variations from what appears to be the standard procedure of the task.
**Outcome:** Describe the final outcome of the task, including any indicators of success or failure.`;

export const reviewTaskLivePrompt = `You will now receive a real-time continuous feed of image frames where the same task is being performed. Use the detailed description you previously generated to monitor and guide the performer. Provide real-time feedback, corrections, and guidance based on the following criteria:
**Consistency with the Original Task:** Ensure that each step is being performed as described in the initial video. Highlight any deviations and suggest corrections.
**Precision and Accuracy:** Monitor the performer’s actions for accuracy, especially at critical points. Provide immediate feedback if adjustments are needed.
**Timing and Sequence:** Verify that the task is being performed in the correct sequence and at the appropriate pace. Suggest adjustments if the timing is off.
**Environmental Alignment:** Ensure that the current environment is consistent with the conditions required for the task. Provide guidance if the environment needs to be adjusted.
**Outcome Prediction:** Based on the current performance, predict the likely outcome and suggest any necessary changes to achieve the desired result.`;