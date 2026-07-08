import NumberFlow from '@number-flow/react';

/**
 * Thin wrapper around NumberFlow — animates digit changes instead of
 * snapping. Respects prefers-reduced-motion automatically (NumberFlow's
 * own `respectMotionPreference`, independent of framer-motion's MotionConfig).
 */
export default function AnimatedNumber({ value, format, prefix, suffix, className = '', ...rest }) {
  return (
    <NumberFlow
      value={value}
      format={format}
      prefix={prefix}
      suffix={suffix}
      className={`tabular ${className}`.trim()}
      {...rest}
    />
  );
}
