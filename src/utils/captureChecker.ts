
interface CaptureCheckResult {
  allowed: boolean;
  calculation: string;
  blockReason?: string;
  action: 'normal' | 'break' | 'none';
}

/**
 * Validates whether a Tiger can capture a Goat.
 * 
 * Rules:
 * 1. If Goat is NOT protected by a Math Wall:
 *    Tiger Cell Value + Goat Cell Value >= 6
 * 
 * 2. If Goat IS protected by a Math Wall:
 *    Tiger Cell Value + Goat Cell Value >= 8 (Wall break)
 */
export function checkTigerCapture(
  tigerCoord: string,
  goatCoord: string,
  isGoatProtected: boolean,
  cellNumbers: Record<string, number>
): CaptureCheckResult {
  const tigerValue = cellNumbers[tigerCoord] || 0;
  const goatValue = cellNumbers[goatCoord] || 0;
  const sum = tigerValue + goatValue;

  if (isGoatProtected) {
    const isAllowed = sum >= 8;
    return {
      allowed: isAllowed,
      calculation: `Wall break check: ${tigerValue} + ${goatValue} = ${sum}`,
      action: 'break',
      blockReason: isAllowed 
        ? undefined 
        : `Goat is protected by a Math Wall! Capture requires sum >= 8, but ${tigerValue} + ${goatValue} = ${sum} (blocked).`
    };
  } else {
    const isAllowed = sum >= 6;
    return {
      allowed: isAllowed,
      calculation: `Tiger capture check: ${tigerValue} + ${goatValue} = ${sum}`,
      action: 'normal',
      blockReason: isAllowed 
        ? undefined 
        : `Normal capture requires sum >= 6, but ${tigerValue} + ${goatValue} = ${sum} (blocked).`
    };
  }
}
