export const predictImage = async (
    imageData: string,
    prompt: string,
    activeModel: "flash" | "pro",
  ) => {
    try {
      const response = await fetch("/api/generateResponseToTextAndImage", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          prompt: prompt,
          imageData: imageData,
          activeModel: activeModel
        }),
      });
      const result = await response.json();
      if (response.ok) {
        return result;
      } else {
        const fetchError = new Error(result.error.message);
        fetchError.fetchResult = result;
        throw fetchError;
      }
    } catch (error) {
      console.log(error)
      if (error.fetchResult) {
        console.error(
          `HTTP request failed with status code ${error.fetchResult.error.code}`,
          error.fetchResult,
        );
        return error.fetchResult;
      }
      return {
        error: {
          message: error.message,
        },
      };
    }
  };
  
export const predictVideo = async (
    videoFileName: string,
    prompt: string,
    activeModel: "flash" | "pro",
  ) => {
    try {
      const response = await fetch("/api/generateResponseToTextAndVideo", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          videoFileName: videoFileName,
          prompt: prompt,
          activeModel: activeModel
        }),
      });
      const result = await response.json();
      if (response.ok) {
        return result;
      } else {
        const fetchError = new Error(result.error.message);
        fetchError.fetchResult = result;
        throw fetchError;
      }
    } catch (error) {
      console.log(error)
      if (error.fetchResult) {
        console.error(
          `HTTP request failed with status code ${error.fetchResult.error.code}`,
          error.fetchResult,
        );
        return error.fetchResult;
      }
      return {
        error: {
          message: error.message,
        },
      };
    }
};
  
export const uploadVideo = async(formData) => {
  try {
    const response = await fetch('/video-upload', {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      const fetchError = new Error(result.error.message);
      fetchError.fetchResult = result;
      throw fetchError;
    }
  } catch (error) {
    console.log(error)
    if (error.fetchResult) {
      console.error(
        `HTTP request failed with status code ${error.fetchResult.error.code}`,
        error.fetchResult,
      );
      return error.fetchResult;
    }
    return {
      error: {
        message: error.message,
      },
    };
  }
}

export const predictLiveVideo = async (
  imageData: string,
  prompt: string,
  activeModel: "flash" | "pro",
) => {
  try {
    const response = await fetch("/api/generateResponseFromLiveVideoToTextAndImage", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        prompt: prompt,
        imageData: imageData,
        activeModel: activeModel,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      return result;
    } else {
      const fetchError = new Error(result.error.message);
      fetchError.fetchResult = result;
      throw fetchError;
    }
  } catch (error) {
    console.log(error)
    if (error.fetchResult) {
      console.error(
        `HTTP request failed with status code ${error.fetchResult.error.code}`,
        error.fetchResult,
      );
      return error.fetchResult;
    }
    return {
      error: {
        message: error.message,
      },
    };
  }
};

export const predictLiveScreenSharing = async (
  imageData: string,
  prompt: string,
  activeModel: "flash" | "pro",
) => {
  try {
    const response = await fetch("/api/generateResponseFromLiveScreenSharingToTextAndImage", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        prompt: prompt,
        imageData: imageData,
        activeModel: activeModel,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      return result;
    } else {
      const fetchError = new Error(result.error.message);
      fetchError.fetchResult = result;
      throw fetchError;
    }
  } catch (error) {
    console.log(error)
    if (error.fetchResult) {
      console.error(
        `HTTP request failed with status code ${error.fetchResult.error.code}`,
        error.fetchResult,
      );
      return error.fetchResult;
    }
    return {
      error: {
        message: error.message,
      },
    };
  }
};

export const s2t = async (
  audio: string,
) => {
  try {
    const response = await fetch('/api/s2t', {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        audio: audio,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      return result;
    } else {
      const fetchError = new Error(result.error.message);
      fetchError.fetchResult = result;
      throw fetchError;
    }
  } catch (error) {
    console.log(error)
    if (error.fetchResult) {
      console.error(
        `HTTP request failed with status code ${error.fetchResult.error.code}`,
        error.fetchResult,
      );
      return error.fetchResult;
    }
    return {
      error: {
        message: error.message,
      },
    };
  }
};