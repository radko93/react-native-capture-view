declare module 'react-test-renderer' {
  import * as React from 'react';

  export interface ReactTestRenderer {
    unmount(): void;
  }

  export function act<T>(callback: () => T): T;

  export function create(element: React.ReactElement): ReactTestRenderer;
}
