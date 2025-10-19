"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePopularSearches } from "./usePopularSearches";

export function useSearch(debounceTime: number = 300) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { searches: popularSearches, fetchPopularSearches } = usePopularSearches();

  useEffect(() => {
    fetchPopularSearches();
  }, [fetchPopularSearches]);

  useEffect(() => {
    if (!query) {
      setSuggestions(popularSearches);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounce = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_all", {
        search_term: query,
      });

      if (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } else {
        const results = data.map((d: { title: string; type: string }) => d.title);
        setSuggestions(results);
      }
      setIsLoading(false);
    }, debounceTime);

    return () => clearTimeout(debounce);
  }, [query, debounceTime, popularSearches]);

  const showDropdown = () => {
    if (suggestions.length > 0) {
      setIsDropdownVisible(true);
    }
  };
  const hideDropdown = () => {
    setTimeout(() => {
      setIsDropdownVisible(false);
    }, 100);
  };

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    isDropdownVisible,
    showDropdown,
    hideDropdown,
  };
}