// Helper function to convert polar coordinates to cartesian
export const polarToCartesian = (angle, radius) => {
  // const angleRad = (angle * Math.PI) / 180
  return {
    x: radius * Math.sin(angle),
    y: -radius * Math.cos(angle), // negative because SVG y-axis is flipped
  }
}
