"use client";

import { motion } from "framer-motion";
import { FC } from "react";

interface SearchDropdownProps {
  suggestions: string[];
  isDropdownVisible: boolean;
  setSearchQuery: (query: string) => void;
  navigate: (path: string) => void;
}

const SearchDropdown: FC<SearchDropdownProps> = ({
  suggestions,
  isDropdownVisible,
  setSearchQuery,
  navigate,
}) => {
  if (!isDropdownVisible) return null;

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/search?query=${suggestion}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full mt-2 w-full rounded-md bg-background/80 shadow-lg backdrop-blur-sm"
    >
      <ul className="py-1 text-white">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="cursor-pointer px-4 py-2 hover:bg-white/10 font-semibold"
            onMouseDown={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default SearchDropdown;