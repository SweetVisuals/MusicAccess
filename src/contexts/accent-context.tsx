'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'

export type Accent = 'American' | 'British'

interface AccentContextType {
  accent: Accent
  setAccent: (accent: Accent) => void
}

const AccentContext = createContext<AccentContextType | undefined>(undefined)

export const AccentProvider = ({ children }: { children: ReactNode }) => {
  const [accent, setAccent] = useState<Accent>('American')

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  )
}

export const useAccent = () => {
  const context = useContext(AccentContext)
  if (context === undefined) {
    throw new Error('useAccent must be used within an AccentProvider')
  }
  return context
}