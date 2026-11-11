import Svg, { Circle, Path, Rect } from "react-native-svg";

type P = { name: IconName; size?: number; color?: string };
export type IconName =
  | "cal"
  | "people"
  | "spark"
  | "card"
  | "search"
  | "back"
  | "plus"
  | "phone"
  | "copy"
  | "share"
  | "qr"
  | "edit"
  | "mic"
  | "send"
  | "check"
  | "x";

export function Icon({ name, size = 22, color = "#F5F5F7" }: P) {
  const s = {
    stroke: color,
    strokeWidth: 1.8,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "cal" && (
        <>
          <Rect x={3} y={4.5} width={18} height={16} rx={2.5} {...s} />
          <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" {...s} />
        </>
      )}
      {name === "people" && (
        <>
          <Circle cx={9} cy={8} r={3.5} {...s} />
          <Path
            d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c1.9.6 3.2 2.3 3.5 5.3"
            {...s}
          />
        </>
      )}
      {name === "spark" && (
        <>
          <Path d="M11 2.5l1.9 5.6 5.6 1.9-5.6 1.9L11 17.5l-1.9-5.6L3.5 10l5.6-1.9z" fill={color} />
          <Path d="M18.5 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill={color} />
        </>
      )}
      {name === "card" && (
        <>
          <Rect x={2.5} y={5} width={19} height={14} rx={2.5} {...s} />
          <Circle cx={8.5} cy={11} r={2.2} {...s} />
          <Path d="M5.5 16c.5-1.5 1.6-2.3 3-2.3s2.5.8 3 2.3M14.5 10h4M14.5 13.5h3" {...s} />
        </>
      )}
      {name === "search" && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...s} />
          <Path d="m20 20-4-4" {...s} />
        </>
      )}
      {name === "back" && <Path d="M15 5l-7 7 7 7" {...s} strokeWidth={2.2} />}
      {name === "plus" && <Path d="M12 5v14M5 12h14" {...s} strokeWidth={2.2} />}
      {name === "phone" && (
        <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...s} />
      )}
      {name === "copy" && (
        <>
          <Rect x={8} y={8} width={12} height={12} rx={2} {...s} />
          <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" {...s} />
        </>
      )}
      {name === "share" && <Path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...s} />}
      {name === "qr" && (
        <>
          <Rect x={3} y={3} width={7} height={7} rx={1.5} {...s} />
          <Rect x={14} y={3} width={7} height={7} rx={1.5} {...s} />
          <Rect x={3} y={14} width={7} height={7} rx={1.5} {...s} />
          <Path d="M14 14h3v3h-3zM20 20h1M17 20h1" {...s} />
        </>
      )}
      {name === "edit" && <Path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" {...s} />}
      {name === "mic" && (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} {...s} />
          <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" {...s} />
        </>
      )}
      {name === "send" && <Path d="M12 19V5M5 12l7-7 7 7" {...s} strokeWidth={2.4} />}
      {name === "check" && <Path d="M5 12.5l4.5 4.5L19 7.5" {...s} strokeWidth={2.4} />}
      {name === "x" && <Path d="M6 6l12 12M18 6 6 18" {...s} strokeWidth={2.2} />}
    </Svg>
  );
}
