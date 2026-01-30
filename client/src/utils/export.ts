import Konva from 'konva';

export interface ExportOptions {
  filename?: string;
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Export the Konva stage as a PNG image
 */
export function exportToPNG(
  stage: Konva.Stage,
  options: ExportOptions = {}
): void {
  const {
    filename = 'canvas-export',
    pixelRatio = 2, // 2x for retina quality
    backgroundColor = '#ffffff',
  } = options;

  // Get the bounding box of all shapes
  const boundingBox = getStageBoundingBox(stage);

  if (!boundingBox) {
    // No shapes, export empty canvas
    const dataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
    });
    downloadDataURL(dataURL, `${filename}.png`);
    return;
  }

  // Store original stage position and scale
  const originalX = stage.x();
  const originalY = stage.y();
  const originalScaleX = stage.scaleX();
  const originalScaleY = stage.scaleY();

  // Add padding around the content
  const padding = 40;
  const exportX = boundingBox.x - padding;
  const exportY = boundingBox.y - padding;
  const exportWidth = boundingBox.width + padding * 2;
  const exportHeight = boundingBox.height + padding * 2;

  // Temporarily adjust stage for export
  stage.position({ x: -exportX, y: -exportY });
  stage.scale({ x: 1, y: 1 });

  // Create a temporary canvas for background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = exportWidth * pixelRatio;
  tempCanvas.height = exportHeight * pixelRatio;
  const tempCtx = tempCanvas.getContext('2d')!;

  // Fill background
  tempCtx.fillStyle = backgroundColor;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw stage content
  const stageCanvas = stage.toCanvas({
    pixelRatio,
    width: exportWidth,
    height: exportHeight,
  });
  tempCtx.drawImage(stageCanvas, 0, 0);

  // Restore original stage position and scale
  stage.position({ x: originalX, y: originalY });
  stage.scale({ x: originalScaleX, y: originalScaleY });

  // Download
  const dataURL = tempCanvas.toDataURL('image/png');
  downloadDataURL(dataURL, `${filename}.png`);
}

/**
 * Export the Konva stage as an SVG
 */
export function exportToSVG(
  shapes: Array<Record<string, unknown> & {
    type: string;
    x: number;
    y: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
    visible?: boolean;
  }>,
  options: ExportOptions = {}
): void {
  const {
    filename = 'canvas-export',
    backgroundColor = '#ffffff',
  } = options;

  // Filter visible shapes
  const visibleShapes = shapes.filter(s => s.visible !== false);

  if (visibleShapes.length === 0) {
    // Export empty SVG
    const emptySVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
</svg>`;
    downloadSVG(emptySVG, `${filename}.svg`);
    return;
  }

  // Calculate bounding box
  const boundingBox = calculateBoundingBox(visibleShapes);
  const padding = 40;
  const width = boundingBox.width + padding * 2;
  const height = boundingBox.height + padding * 2;
  const offsetX = boundingBox.x - padding;
  const offsetY = boundingBox.y - padding;

  // Build SVG content
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g transform="translate(${-offsetX}, ${-offsetY})">
`;

  // Convert each shape to SVG
  for (const shape of visibleShapes) {
    const svgElement = shapeToSVG(shape);
    if (svgElement) {
      svgContent += `    ${svgElement}\n`;
    }
  }

  svgContent += `  </g>
</svg>`;

  downloadSVG(svgContent, `${filename}.svg`);
}

/**
 * Convert a shape object to SVG element string
 */
function shapeToSVG(shape: Record<string, unknown> & {
  type: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
}): string | null {
  const {
    type,
    x,
    y,
    fill = 'transparent',
    stroke = '#000000',
    strokeWidth = 1,
    rotation = 0,
  } = shape;

  const transform = rotation ? ` transform="rotate(${rotation}, ${x}, ${y})"` : '';
  const style = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"`;

  switch (type) {
    case 'rectangle': {
      const rectShape = shape as unknown as { width: number; height: number; cornerRadius?: number };
      const { width, height, cornerRadius = 0 } = rectShape;
      if (cornerRadius > 0) {
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" ${style}${transform}/>`;
      }
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${style}${transform}/>`;
    }

    case 'ellipse': {
      const ellipseShape = shape as unknown as { radiusX: number; radiusY: number };
      return `<ellipse cx="${x}" cy="${y}" rx="${ellipseShape.radiusX}" ry="${ellipseShape.radiusY}" ${style}${transform}/>`;
    }

    case 'line': {
      const lineShape = shape as unknown as { points: number[] };
      if (lineShape.points && lineShape.points.length >= 4) {
        return `<line x1="${x + lineShape.points[0]}" y1="${y + lineShape.points[1]}" x2="${x + lineShape.points[2]}" y2="${y + lineShape.points[3]}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`;
      }
      return null;
    }

    case 'arrow': {
      const arrowShape = shape as unknown as { points: number[]; pointerLength?: number };
      const points = arrowShape.points;
      const pointerLength = arrowShape.pointerLength ?? 10;
      if (points && points.length >= 4) {
        const x1 = x + points[0];
        const y1 = y + points[1];
        const x2 = x + points[2];
        const y2 = y + points[3];

        // Calculate arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headX1 = x2 - pointerLength * Math.cos(angle - Math.PI / 6);
        const headY1 = y2 - pointerLength * Math.sin(angle - Math.PI / 6);
        const headX2 = x2 - pointerLength * Math.cos(angle + Math.PI / 6);
        const headY2 = y2 - pointerLength * Math.sin(angle + Math.PI / 6);

        return `<g${transform}>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      <polygon points="${x2},${y2} ${headX1},${headY1} ${headX2},${headY2}" fill="${stroke}"/>
    </g>`;
      }
      return null;
    }

    case 'text': {
      const textShape = shape as unknown as { text: string; fontSize?: number; fontFamily?: string };
      const fontSize = textShape.fontSize ?? 16;
      const fontFamily = textShape.fontFamily ?? 'Arial';
      return `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}"${transform}>${escapeXML(textShape.text)}</text>`;
    }

    case 'freehand': {
      const freehandShape = shape as unknown as { points: number[] };
      if (freehandShape.points && freehandShape.points.length >= 4) {
        let pathD = `M ${x + freehandShape.points[0]} ${y + freehandShape.points[1]}`;
        for (let i = 2; i < freehandShape.points.length; i += 2) {
          pathD += ` L ${x + freehandShape.points[i]} ${y + freehandShape.points[i + 1]}`;
        }
        return `<path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${transform}/>`;
      }
      return null;
    }

    case 'star': {
      const starShape = shape as unknown as { numPoints?: number; innerRadius: number; outerRadius: number };
      const numPoints = starShape.numPoints ?? 5;
      const starPoints = generateStarPoints(x, y, numPoints, starShape.innerRadius, starShape.outerRadius);
      return `<polygon points="${starPoints}" ${style}${transform}/>`;
    }

    case 'polygon': {
      const polyShape = shape as unknown as { sides?: number; radius: number };
      const sides = polyShape.sides ?? 6;
      const polyPoints = generatePolygonPoints(x, y, sides, polyShape.radius);
      return `<polygon points="${polyPoints}" ${style}${transform}/>`;
    }

    default:
      return null;
  }
}

/**
 * Generate star polygon points
 */
function generateStarPoints(
  cx: number,
  cy: number,
  numPoints: number,
  innerRadius: number,
  outerRadius: number
): string {
  const points: string[] = [];
  const angleStep = Math.PI / numPoints;

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    points.push(`${px},${py}`);
  }

  return points.join(' ');
}

/**
 * Generate regular polygon points
 */
function generatePolygonPoints(
  cx: number,
  cy: number,
  sides: number,
  radius: number
): string {
  const points: string[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    points.push(`${px},${py}`);
  }

  return points.join(' ');
}

/**
 * Calculate bounding box of all shapes
 */
function calculateBoundingBox(shapes: Array<{ x: number; y: number; [key: string]: unknown }>) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of shapes) {
    const bounds = getShapeBounds(shape);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get bounds for a single shape
 */
function getShapeBounds(shape: { x: number; y: number; type?: string; [key: string]: unknown }) {
  const { x, y, type } = shape;

  switch (type) {
    case 'rectangle': {
      const rectShape = shape as unknown as { width: number; height: number };
      return { x, y, width: rectShape.width, height: rectShape.height };
    }
    case 'ellipse': {
      const ellipseShape = shape as unknown as { radiusX: number; radiusY: number };
      return { x: x - ellipseShape.radiusX, y: y - ellipseShape.radiusY, width: ellipseShape.radiusX * 2, height: ellipseShape.radiusY * 2 };
    }
    case 'star': {
      const starShape = shape as unknown as { outerRadius: number };
      return { x: x - starShape.outerRadius, y: y - starShape.outerRadius, width: starShape.outerRadius * 2, height: starShape.outerRadius * 2 };
    }
    case 'polygon': {
      const polyShape = shape as unknown as { radius: number };
      return { x: x - polyShape.radius, y: y - polyShape.radius, width: polyShape.radius * 2, height: polyShape.radius * 2 };
    }
    case 'text': {
      return { x, y, width: 100, height: 30 }; // Approximate
    }
    case 'line':
    case 'arrow':
    case 'freehand': {
      const lineShape = shape as unknown as { points: number[] };
      if (lineShape.points && lineShape.points.length >= 2) {
        const xs = lineShape.points.filter((_, i) => i % 2 === 0);
        const ys = lineShape.points.filter((_, i) => i % 2 === 1);
        const minPX = Math.min(...xs);
        const maxPX = Math.max(...xs);
        const minPY = Math.min(...ys);
        const maxPY = Math.max(...ys);
        return {
          x: x + minPX,
          y: y + minPY,
          width: maxPX - minPX || 10,
          height: maxPY - minPY || 10,
        };
      }
      return { x, y, width: 10, height: 10 };
    }
    default:
      return { x, y, width: 50, height: 50 };
  }
}

/**
 * Get bounding box from Konva stage (using layers)
 */
function getStageBoundingBox(stage: Konva.Stage) {
  const layers = stage.getLayers();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasShapes = false;

  layers.forEach((layer) => {
    layer.getChildren().forEach((child) => {
      // Skip grid and cursor layers (check by name or position)
      if (child.listening() === false && child.getClassName() === 'Group') {
        return; // Skip non-interactive groups (likely grid)
      }

      const rect = child.getClientRect({ relativeTo: stage });
      if (rect.width > 0 && rect.height > 0) {
        hasShapes = true;
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
      }
    });
  });

  if (!hasShapes) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download a data URL as a file
 */
function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download SVG content as a file
 */
function downloadSVG(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
