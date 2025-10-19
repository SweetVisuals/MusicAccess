import React, { useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

interface TransitionWrapperProps {
  children: React.ReactNode;
  pathname: string;
  timeout?: number;
}

export function TransitionWrapper({
  children,
  pathname,
  timeout = 300
}: TransitionWrapperProps) {
  const nodeRef = useRef(null);
  
  // Use the full pathname as key to ensure proper re-rendering
  // when navigating between dynamic routes with different parameters
  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={pathname}
        nodeRef={nodeRef}
        classNames="page-transition"
        timeout={timeout}
        unmountOnExit
        appear
      >
        <div ref={nodeRef}>
          {children}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}
