import { useState, useEffect, useRef } from "react";
import { Video, RefreshCw, Mic, MicOff, VideoOff } from "lucide-react";
import Peer from "peerjs";
import { io } from "socket.io-client";

let socket;

function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [status, setStatus] = useState("Searching for a partner...");
  const [isConnected, setIsConnected] = useState(false);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const currentCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (streamRef.current) {
          streamRef.current.srcObject = stream;
        }

        socket = io(import.meta.env.VITE_BACKEND_URL,{
          transports: ["websocket"],
          withCredentials: true,
          pingInterval: 20000, // Ping interval to match server
        });

        const peer = new Peer(undefined, {
          host: import.meta.env.VITE_PEER_URL, 
          port:443, 
          secure: true,   
          path:"/peerjs/myapp"
        });
        
        
        peerRef.current = peer;

        peer.on("open", (peerId) => {
          console.log("PEER ID:", peerId);
          socket.emit("register-peer-id", { peerId });
        });

        socket.on("online_users", ({ onlineUsers }) => {
          setOnlineUsers(onlineUsers);
        });

        socket.on("matched", ({ peerId }) => {
          setStatus("Connected!");
          setIsConnected(true);
          console.log("Matched with:", peerId);
          const call = peer.call(peerId, localStreamRef.current);
          currentCallRef.current = call;

          call.on("stream", (remoteStream) => {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.srcObject = remoteStream;
            }
          });

          call.on("close", () => {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.srcObject = null;
            }
            setStatus("Partner disconnected");
            setIsConnected(false);
          });
        });

        peer.on("call", (call) => {
          call.answer(localStreamRef.current);
          currentCallRef.current = call;

          call.on("stream", (remoteStream) => {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.srcObject = remoteStream;
            }
          });

          call.on("close", () => {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.srcObject = null;
            }
          });
        });

        socket.on("partner-disconnected", () => {
          setIsConnected(false);
          setStatus("Partner disconnected. Searching...");
          console.log("Partner disconnected. Searching for a new one...");

          if (remoteStreamRef.current) {
            remoteStreamRef.current.srcObject = null;
          }

          socket.emit("register-peer-id", { peerId: peer.id });
          console.log(peer.id);
        });
      } catch (err) {
        console.error("Failed to access camera/mic:", err);
      }
    }

    init();
  }, []);

  const handleLeaveCall = () => {
    console.log("NEXT");
    setStatus("Searching for a new partner...");
    setIsConnected(false);

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    if (remoteStreamRef.current?.srcObject) {
      remoteStreamRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      remoteStreamRef.current.srcObject = null;
    }

    if (socket) {
      socket.emit("leave-call");
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks =
        streamRef.current.srcObject instanceof MediaStream
          ? streamRef.current.srcObject.getAudioTracks()
          : [];
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks =
        streamRef.current.srcObject instanceof MediaStream
          ? streamRef.current.srcObject.getVideoTracks()
          : [];
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-purple-400" />
            <span className="text-2xl font-bold text-white">Talksy</span>
          </div>
          <button
            onClick={handleLeaveCall}
            className="flex items-center gap-2 bg-purple-500 text-white px-6 py-2 rounded-full font-medium hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Next Person
          </button>
        </div>
      </nav>

      {/* Video Chat Section */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-400" />
                You
              </h3>
            </div>
            <div className="p-4 relative">
              <video
                autoPlay
                muted
                playsInline
                ref={streamRef}
                className="w-full aspect-video bg-gray-900 rounded-lg"
              ></video>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full ${
                    isMuted ? "bg-red-500" : "bg-gray-700"
                  } hover:bg-opacity-90 transition-colors`}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5 text-white" />
                  ) : (
                    <Mic className="h-5 w-5 text-white" />
                  )}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${
                    !isVideoOn ? "bg-red-500" : "bg-gray-700"
                  } hover:bg-opacity-90 transition-colors`}
                >
                  {!isVideoOn ? (
                    <VideoOff className="h-5 w-5 text-white" />
                  ) : (
                    <Video className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remote Video */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-400" />
                Talking to
              </h3>
              <span className="text-sm text-gray-400">{status}</span>
            </div>
            <div className="p-4 relative">
              {isConnected ? (
                <video
                  autoPlay
                  playsInline
                  ref={remoteStreamRef}
                  className="w-full aspect-video bg-gray-900 rounded-lg"
                ></video>
              ) : (
                <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 text-sm animate-pulse">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Online Counter */}
        <div className="mt-8 flex justify-center">
          <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-300">
                {onlineUsers} Online Now
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
