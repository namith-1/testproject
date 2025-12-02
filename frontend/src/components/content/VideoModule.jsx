// v2/src/components/content/VideoModule.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Video, Clock, Loader2, CheckCircle } from 'lucide-react';

// Mock function to determine video duration (in seconds)
// This is a placeholder for a real value stored in the course structure
const MOCK_VIDEO_DURATION_SECONDS = 300; // 5 minutes

const VideoModule = ({ module, enrollmentStatus, onProgressUpdate, isCompleted, isProcessing }) => {
    // State initialized from enrollmentStatus.timeSpent, which maps to the schema's field
    const [currentTime, setCurrentTime] = useState(enrollmentStatus?.timeSpent || 0);
    const intervalRef = useRef(null);
    const completionThreshold = MOCK_VIDEO_DURATION_SECONDS * 0.6; // 60% rule

    const progressPercent = Math.min(100, (currentTime / MOCK_VIDEO_DURATION_SECONDS) * 100);
    const needsCompletion = currentTime >= completionThreshold && !isCompleted;
    
    // Safety check for embed URL
    const embedUrl = module.videoLink && module.videoLink.includes("embed") ? 
                     module.videoLink : 
                     `https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0`; // Fallback

    // Start timer on mount
    useEffect(() => {
        if (!isCompleted) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prevTime => {
                    if (prevTime < MOCK_VIDEO_DURATION_SECONDS) {
                        const newTime = prevTime + 1; // Simulate 1 second watched
                        
                        // Report progress to backend every 30 seconds
                        if (newTime % 10 === 0) {
                            // Saving timeSpent (seconds) to backend, as defined in enrollmentSchema
                            onProgressUpdate(module.id, { timeSpent: newTime });
                        }
                        return newTime;
                    } else {
                        clearInterval(intervalRef.current);
                        return MOCK_VIDEO_DURATION_SECONDS;
                    }
                });
            }, 1000); // 1 second interval
        }

        return () => clearInterval(intervalRef.current);
    }, [isCompleted, module.id, onProgressUpdate]);
    
    // Automatically mark as complete if threshold is reached
    useEffect(() => {
        if (needsCompletion) {
             // Only update if not currently processing another update
             if (!isProcessing) {
                // Mark module as completed and save the final timeSpent
                onProgressUpdate(module.id, { 
                    completed: true, 
                    timeSpent: currentTime 
                });
             }
        }
    }, [needsCompletion, onProgressUpdate, module.id, currentTime, isProcessing]);


    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="content-module-card">
            <h3 className="module-content-header"><Video size={20} /> {module.title}</h3>
            
            <p className="description-text">{module.description}</p>
            
            <div className="video-wrapper">
                <iframe
                    title={module.title}
                    src={embedUrl}
                    allowFullScreen
                    frameBorder="0"
                ></iframe>
            </div>

            <div className="module-progress-bar-container">
                <div className="module-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                <span className="progress-text">
                    {formatTime(currentTime)} / {formatTime(MOCK_VIDEO_DURATION_SECONDS)} Watched 
                    ({progressPercent.toFixed(0)}%)
                </span>
            </div>
            
            <div className="module-action-footer">
                <p className="completion-rule">Rule: Module completes automatically after 60% watch time ({formatTime(completionThreshold)}).</p>
                {isCompleted ? (
                    <button disabled className="btn-complete-module completed">
                        <CheckCircle size={18} /> Completed Automatically
                    </button>
                ) : (
                    <button disabled className="btn-complete-module disabled-btn">
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Watching...'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoModule;