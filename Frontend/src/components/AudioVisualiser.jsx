import { useEffect, useState } from "react";

const AudioVisualiser = () => {
    const [heights, setHeights] = useState([5,5,5]); // Initial heights

    useEffect(() => {
        const interval = setInterval(() => {
            setHeights(heights.map(() => Math.floor(Math.random() * 15) + 5)); // Randomize heights between 5 and 20px
        }, 300);

        return () => clearInterval(interval); // Cleanup on unmount
    }, [heights]);

    return (
        <div className="visualizer">
            {heights.map((height, index) => (
                <div
                    key={index}
                    className="bar"
                    style={{ height: `${height}px` }}
                ></div>
            ))}
        </div>
    );
};

export default AudioVisualiser;