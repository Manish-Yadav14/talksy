import React from 'react';
import { Video, ArrowRight } from 'lucide-react';
import {useNavigate} from 'react-router-dom'

function Hero() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-indigo-600" />
            <span className="text-2xl font-bold text-white">Talksy</span>
          </div>
          <button
            onClick={()=>navigate('/meeting')}
            className="bg-indigo-500 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-600 transition-colors cursor-pointer">
            Start Meeting
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Meet New People Through
              <span className="text-indigo-600"> Video Chat</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Make new friends, practice languages, or just have fun conversations in real-time video.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={()=>navigate('/meeting')}
                className="flex items-center justify-center gap-2 bg-indigo-500 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-600 transition-colors  cursor-pointer">
                Start Meeting People
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              alt="Video chat illustration"
              className="rounded-2xl shadow-2xl opacity-80"
            />
            {/* <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">12 People Online</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;