import React, { useState } from "react";

interface InputControlProps {
  onProcessInput: (input: string) => void;
}

export function InputControl({ onProcessInput }: InputControlProps) {
  const [inputText, setInputText] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleButtonClick = () => {
    if (inputText.trim()) {
      onProcessInput(inputText);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleButtonClick();
    }
  };

  return (
    <div className='mt-5 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 p-4 pointer-events-auto'>
      <input
        type='text'
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder='Enter command (e.g., "more particles", "change color to blue")'
        className='px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm w-full sm:min-w-[300px] dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
      />
      <button
        onClick={handleButtonClick}
        className='p-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 flex items-center justify-center sm:w-auto w-full sm:h-[42px] sm:px-4'
        aria-label='Process Input'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          className='w-5 h-5'
        >
          <path d='M3.105 3.105a1.5 1.5 0 012.122-.001L19.43 10.43a1.5 1.5 0 010 2.122L5.227 16.895a1.5 1.5 0 01-2.122-.001l-.095-.095a1.5 1.5 0 01.001-2.122L5.43 12H10a.75.75 0 000-1.5H5.43L3.009 7.345a1.5 1.5 0 01-.001-2.122l.095-.095z' />
        </svg>
      </button>
    </div>
  );
}
