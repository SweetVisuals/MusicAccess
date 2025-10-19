'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'

interface RhymeHighlightContextType {
  rhymeHighlightEnabled: boolean
  setRhymeHighlightEnabled: (enabled: boolean) => void
}

const RhymeHighlightContext = createContext<RhymeHighlightContextType | undefined>(undefined)

export const RhymeHighlightProvider = ({ children }: { children: ReactNode }) => {
  const [rhymeHighlightEnabled, setRhymeHighlightEnabled] = useState<boolean>(true)

  return (
    <RhymeHighlightContext.Provider value={{ rhymeHighlightEnabled, setRhymeHighlightEnabled }}>
      {children}
    </RhymeHighlightContext.Provider>
  )
}

export const useRhymeHighlight = () => {
  const context = useContext(RhymeHighlightContext)
  if (context === undefined) {
    throw new Error('useRhymeHighlight must be used within a RhymeHighlightProvider')
  }
  return context
}