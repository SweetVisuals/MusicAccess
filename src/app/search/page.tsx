"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import SearchResults from "@/components/search/SearchResults";

const SearchPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for "{query}"
      </h1>
      <SearchResults query={query} />
    </div>
  );
};

export default SearchPage;
