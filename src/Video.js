import React, { useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
const Video = () => {


  const allCountries=[ {
        "name": "MP4",
        "code": "mp4"
    },
   {
        "name": "MP3",
        "code": "mp3"
    },
   {
        "name": "avi",
        "code": "avi"
    },]
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
  const messageRef = useRef(null);
  const [format, setFormat]=useState("")

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.1/dist/umd'
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            messageRef.current.innerHTML = message;
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL (
                `${baseURL}/ffmpeg-core.js`,
                "text/javascript",
            ),
            wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm",
            ),
        });
        setLoaded(true);
    }

  const transcode = async (wasmURL, format) => {
      console.log("format decode", format)
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile(
            "input.webm",
            await fetchFile(wasmURL)
        );
        await ffmpeg.exec(['-i', 'input.webm', `output.${format}`]);
      const data = await ffmpeg.readFile(`output.${format}`);
       const converted = new Blob([data.buffer], { type: format=== "mp3" ? `music/${format}`: `video/${format}` });
      return { data, converted };
     }
  
  const [recBlob, setRecBlob]=useState()

      let localStream;
      let mediaRecorder;
      let recordedChunks = [];
      let blobFile;
      let RecUrl;
      const[recordedUrl, setRecordedUrl]=useState()
     
  const handleStartCaptureClick = async () => {
        let chunks = [];
        try {
          const stream = await navigator.mediaDevices.getUserMedia(
            { video: true, audio: true },
            { mimeType: "video/webm;codecs=h264" }
          );
          const video = document.querySelector("video");
          video.srcObject = stream;
          localStream = stream;
        } catch (err) {
          console.error("Error accessing media devices", err);
        }
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(localStream, {
          mimeType: "video/webm",
        });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        mediaRecorder.onstop = async () => {
          const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
          setRecBlob(recordedBlob)
        const  recordedUr = URL.createObjectURL(recordedBlob);
          setRecordedUrl(recordedUr)
          if (localStream) {
            const video = document.querySelector("video");
            const tracks = localStream.getTracks();
            tracks.forEach((track) => track.stop());
            video.srcObject = null;
            localStream = null;
          }
          // const recordedVideoElement = document.createElement('video');
          // recordedVideoElement.controls = true;
          // recordedVideoElement.src = recordedUrl;
          // document.body.appendChild(recordedVideoElement);
               };
        mediaRecorder.start();     };
      const handleStopCaptureClick = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };
  const handleChange = async(e) => {
    setFormat(e.target.value)
    const converted = await transcode(recBlob, e.target.value);
    console.log("voncerted response", converted)
    
   }

  const conversionStart = async() => {
      const converted = await transcode(recBlob,format);
  }
    return (loaded
        ? (
            <div className='wrapper'>
          {!recordedUrl && <video autoPlay id="after"></video>}
          {recordedUrl && <video autoPlay id="after" src={recordedUrl} controls></video>}
          <div className='btn-wrapper'>
          <button className='rec-btn' onClick={() => { handleStartCaptureClick() }}>start</button>
            <button className='rec-btn' onClick={() => { handleStopCaptureClick(); setRecordedUrl() }}>stop</button>
          </div>
          <p>Choose the format</p>
          <select onChange={(e)=>{handleChange(e)}}>
            {allCountries.map((item,index) => {
              return (
                <option value={item.code} key={index}>{item.name}</option>
            )
          })}
          </select>  
          
      <p ref={messageRef}></p>
            </div>
        )
      : (
        <div style={{display:"flex", flexDirection:"column"}}><span>To use conversion feature click start</span>
          <button className='load-btn' onClick={() => { load() }}>Start</button>
        </div>)
    );
}

export default Video