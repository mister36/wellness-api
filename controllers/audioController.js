const fs = require("fs");
const { promisify } = require("util");
const Stream = require("stream");
const path = require("path");
const _ = require("lodash");

// const es = require("event-stream");
const textToSpeech = require("@google-cloud/text-to-speech");
const {
  startingVoice,
  sessionVoice,
  heroBank,
  riseBank,
} = require("../utils/phraseBank");
const {
  streaming,
  streamingVoice,
  serveStaticAudio,
} = require("../utils/factory");

const durationToBytes = (duration = 60, bitrate = 320) => {
  // Converts duration of song to size in bytes
  // Duration in seconds, bitrate in kbps
  return ((duration * bitrate) / 8) * 1024;
};

const googleResponse = async (request) => {
  const client = new textToSpeech.v1beta1.TextToSpeechClient();
  // const client = new textToSpeech.TextToSpeechClient();
  try {
    const [response] = await client.synthesizeSpeech(request);

    return response;
  } catch (error) {
    console.error(error);
  }
};

exports.getBackgroundAudioOpus = serveStaticAudio("audio/opus");
exports.getBackgroundAudioMP3 = serveStaticAudio("audio/mpeg");
exports.getSoundEffect = serveStaticAudio("audio/mpeg");

exports.getGoogleVoice = async (req, res, next) => {
  const { firstName, firstVoice, genre } = req.query;
  let ssmlArr;

  // Error if no first name or genre provided
  if (!firstName || !genre) {
    return res.status(400).json({
      status: "fail",
      message: "Must enter a first name and genre",
    });
  }

  // checks genre, returns error if one provided isn't available
  if (firstVoice) {
    ssmlArr = startingVoice(firstName);
  } else if (genre === "hero") {
    ssmlArr = heroBank(firstName);
  } else if (genre === "rise") {
    ssmlArr = riseBank(firstName);
  } else {
    return res.status(400).json({
      status: "fail",
      message: "Must enter a valid genre",
    });
  }
  // Random statement
  const ssml = ssmlArr[_.random(0, ssmlArr.length - 1, false)];

  // console.log(ssml);

  const request = {
    input: {
      ssml,
    },
    voice: {
      languageCode: "en-US",
      name: "en-US-Wavenet-D",
    },
    audioConfig: {
      audioEncoding: "MP3_64_KBPS",
      effectsProfileId: ["large-home-entertainment-class-device"],
      // sampleRateHertz: 96000,
      volumeGainDb: 4,
      pitch: -2.5,
    },
  };

  try {
    const response = await googleResponse(request);

    res.set({ "Content-Type": "audio/mpeg" });
    res.send(response.audioContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Server error",
    });
  }
};

// async (req, res, next) => {
//   const { name } = req.query;

//   if (!name) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Must enter a name",
//     });
//   }

//   if (!sounds.includes(name)) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Invalid sound name",
//     });
//   }

//   const path = `${__dirname}/../sounds/${name}.opus`;

//   try {
//     await streaming(req, res, path, "audio/opus");
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: "Error",
//       message: "Server error",
//     });
//   }
// };
