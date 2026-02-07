import React from 'react';

const VeinyCracks = ({ width = 1820, height = 1620, count = 20, segments = 6, rng, skew = 'skewX(-30deg)' }) => {
  const existingPoints = [];

  const generateCrack = (x, y, angle, depth = 0, maxDepth = 2) => {
    const points = [[x, y]];

    for (let i = 0; i < segments; i++) {
      const length = 20 + rng() * 40;
      angle += (rng() - 0.5) * 90; // more chaotic turns

      const nextX = x + length * Math.cos(angle * Math.PI / 180);
      const nextY = y + length * Math.sin(angle * Math.PI / 180);

      // If close to any existing point, snap and stop there
      for (const [px, py] of existingPoints) {
        const dx = px - nextX;
        const dy = py - nextY;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          points.push([px, py]);
          return [points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')];
        }
      }

      x = nextX;
      y = nextY;
      points.push([x, y]);
    }

    // Add final point to the set
    existingPoints.push(...points);

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

    const branches = [];
    if (depth < maxDepth && rng() < 0.5) {
      const branchIndex = 1 + Math.floor(rng() * (points.length - 2));
      const [bx, by] = points[branchIndex];
      branches.push(
        ...generateCrack(bx, by, angle + (rng() > 0.5 ? 45 : -45), depth + 1, maxDepth)
      );
    }

    return [path, ...branches];
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
        transform: skew ? skew : 'skewX(-30deg)',
      }}
    >
      {Array.from({ length: count }).flatMap((_, i) => {
        const x = rng() * width;
        const y = rng() * height;
        const angle = rng() * 360;
        const cracks = generateCrack(x, y, angle);
        return cracks.map((d, j) => (
          <path
            key={`${i}-${j}`}
            d={d}
            stroke="#000"
            strokeWidth={j === 0 ? 0.4 : 0.25}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0.4 + rng() * 0.3,
              filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.3))',
            }}
          />
        ));
      })}
    </svg>
  );
};

export default VeinyCracks;
