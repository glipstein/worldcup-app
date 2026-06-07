// Type stubs for react-simple-maps (no @types package available)
declare module 'react-simple-maps' {
  import type { ReactNode, SVGProps } from 'react';

  interface Geography {
    rsmKey: string;
    id: string | number;
    properties: Record<string, unknown>;
  }

  interface GeographiesChildrenArgs {
    geographies: Geography[];
  }

  interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (args: GeographiesChildrenArgs) => ReactNode;
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
}
