import React from 'react';
import eyeImage from './EyeOfHorus..png';

interface IconProps {
    className?: string;
    size?: number | string;
    color?: string; // Kept for compatibility, though not used for the image
}

const EyeOfHorus: React.FC<IconProps> = ({ className = '', size = 24 }) => {
    return (
        <img
            src={eyeImage}
            alt="Eye of Horus"
            className={className}
            style={{
                width: size,
                height: size,
                objectFit: 'contain'
            }}
        />
    );
};

export default EyeOfHorus;
