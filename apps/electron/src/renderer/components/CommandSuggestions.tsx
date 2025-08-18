import React, { useState } from 'react';

interface CommandSuggestionsProps {
  onCommandSelect: (command: string) => void;
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ onCommandSelect }) => {
  const [activeCategory, setActiveCategory] = useState<string>('basic');

  const commandCategories = {
    basic: {
      name: 'Basic Editing',
      icon: '✂️',
      commands: [
        'Trim the first 10 seconds',
        'Cut the video at 30 seconds',
        'Remove the last 15 seconds',
        'Split the video in half'
      ]
    },
    effects: {
      name: 'Effects & Filters',
      icon: '🎨',
      commands: [
        'Add a fade in effect',
        'Apply black and white filter',
        'Add a blur effect',
        'Increase brightness by 20%'
      ]
    },
    audio: {
      name: 'Audio',
      icon: '🔊',
      commands: [
        'Remove the audio track',
        'Lower the volume by 50%',
        'Add background music',
        'Normalize audio levels'
      ]
    },
    transform: {
      name: 'Transform',
      icon: '🔄',
      commands: [
        'Resize to 720p',
        'Rotate 90 degrees',
        'Crop to 16:9 aspect ratio',
        'Speed up by 2x'
      ]
    },
    advanced: {
      name: 'Advanced',
      icon: '⚡',
      commands: [
        'Add text overlay "Hello World"',
        'Create picture-in-picture effect',
        'Add a watermark',
        'Stabilize shaky footage'
      ]
    }
  };

  const handleCommandClick = (command: string) => {
    onCommandSelect(command);
  };

  return (
    <div className="command-suggestions">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-3">Quick Commands</h4>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {Object.entries(commandCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`
                px-4 py-2 text-xs font-medium rounded-xl transition-all duration-200 whitespace-nowrap
                ${activeCategory === key
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 gap-3">
        {commandCategories[activeCategory as keyof typeof commandCategories]?.commands.map((command, index) => (
          <button
            key={index}
            onClick={() => handleCommandClick(command)}
            className="
              group text-left p-4 text-sm bg-white/5 hover:bg-white/10
              text-gray-200 hover:text-white rounded-2xl transition-all duration-200
              border border-white/10 hover:border-white/20 hover:shadow-lg hover:scale-[1.02]
              backdrop-blur-sm
            "
            title={`Click to use: ${command}`}
          >
            <div className="flex items-center justify-between">
              <span className="leading-relaxed">{command}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20">
        <div className="flex items-start space-x-3">
          <div className="text-purple-400 text-lg">💡</div>
          <div className="text-xs text-gray-300 leading-relaxed">
            <p className="font-medium text-white mb-1">Pro Tips:</p>
            <p>• You can describe what you want in your own words!</p>
            <p>• Try: "Make it shorter", "Add some music", "Make it brighter"</p>
            <p>• Be specific: "Trim to exactly 30 seconds"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandSuggestions;
