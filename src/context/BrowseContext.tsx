import React, { createContext, useContext, useRef } from 'react';

export interface BrowseContextValue {
  /** The stable ref for the #browse-viewport scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const BrowseContext = createContext<BrowseContextValue | null>(null);

export const BrowseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  return (
    <BrowseContext.Provider value={{ scrollContainerRef }}>
      {children}
    </BrowseContext.Provider>
  );
};

export const useBrowseContext = (): BrowseContextValue => {
  const ctx = useContext(BrowseContext);
  if (!ctx) throw new Error('useBrowseContext must be used inside BrowseProvider');
  return ctx;
};
