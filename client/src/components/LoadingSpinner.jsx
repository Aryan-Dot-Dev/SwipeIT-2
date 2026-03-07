import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-[3px]',
        lg: 'w-12 h-12 border-4'
    };

    const textClasses = {
        sm: 'text-sm mt-2',
        md: 'text-base mt-3',
        lg: 'text-lg mt-4'
    };

    const spinnerContent = (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative flex justify-center items-center">
                <div className={`absolute ${sizeClasses[size]} rounded-full`} style={{ border: '2px solid #E4DFF5' }}></div>
                <div className={`absolute ${sizeClasses[size]} animate-spin`} style={{ border: '2px solid transparent', borderTopColor: '#9A8CF2', borderRightColor: '#9A8CF2', borderRadius: '50%' }}></div>
            </div>
            {text && (
                <span className={`font-medium text-gray-500 animate-pulse ${textClasses[size]}`}>
                    {text}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center min-h-[50vh]">
                {spinnerContent}
            </div>
        );
    }

    return (
        <div className="flex w-full items-center justify-center p-6">
            {spinnerContent}
        </div>
    );
};
