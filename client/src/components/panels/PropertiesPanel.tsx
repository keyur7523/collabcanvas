import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { useYjsShapes } from '@/hooks/useYjsShapes';
import { Input } from '@/components/ui/Input';
import { ColorPicker } from './ColorPicker';
import type { Shape, RectangleShape, EllipseShape, TextShape, StarShape, PolygonShape } from '@/types/shapes';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

export function PropertiesPanel() {
  const { selectedIds } = useCanvasContext();
  const { shapes, updateShape } = useYjsShapes();

  if (selectedIds.length === 0) {
    return (
      <div className="p-4 text-sm text-text-secondary">
        Select a shape to edit properties
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="p-4">
        <p className="text-sm text-text-secondary mb-4">
          {selectedIds.length} objects selected
        </p>
      </div>
    );
  }

  const shape = shapes.find((s) => s.id === selectedIds[0]);
  if (!shape) return null;

  const handleChange = (updates: Partial<Shape>) => {
    updateShape(shape.id, updates);
  };

  return (
    <div className="p-4 space-y-6 overflow-auto h-full">
      {/* Position */}
      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="X"
            type="number"
            value={Math.round(shape.x)}
            onChange={(e) => handleChange({ x: Number(e.target.value) })}
          />
          <Input
            label="Y"
            type="number"
            value={Math.round(shape.y)}
            onChange={(e) => handleChange({ y: Number(e.target.value) })}
          />
        </div>
      </Section>

      {/* Size - for shapes that have width/height */}
      {('width' in shape || 'radiusX' in shape || 'radius' in shape || 'outerRadius' in shape) && (
        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            {shape.type === 'rectangle' && (
              <>
                <Input
                  label="W"
                  type="number"
                  value={Math.round((shape as RectangleShape).width)}
                  onChange={(e) => handleChange({ width: Number(e.target.value) } as Partial<RectangleShape>)}
                />
                <Input
                  label="H"
                  type="number"
                  value={Math.round((shape as RectangleShape).height)}
                  onChange={(e) => handleChange({ height: Number(e.target.value) } as Partial<RectangleShape>)}
                />
              </>
            )}
            {shape.type === 'ellipse' && (
              <>
                <Input
                  label="Radius X"
                  type="number"
                  value={Math.round((shape as EllipseShape).radiusX)}
                  onChange={(e) => handleChange({ radiusX: Number(e.target.value) } as Partial<EllipseShape>)}
                />
                <Input
                  label="Radius Y"
                  type="number"
                  value={Math.round((shape as EllipseShape).radiusY)}
                  onChange={(e) => handleChange({ radiusY: Number(e.target.value) } as Partial<EllipseShape>)}
                />
              </>
            )}
            {shape.type === 'star' && (
              <>
                <Input
                  label="Inner R"
                  type="number"
                  value={Math.round((shape as StarShape).innerRadius)}
                  onChange={(e) => handleChange({ innerRadius: Number(e.target.value) } as Partial<StarShape>)}
                />
                <Input
                  label="Outer R"
                  type="number"
                  value={Math.round((shape as StarShape).outerRadius)}
                  onChange={(e) => handleChange({ outerRadius: Number(e.target.value) } as Partial<StarShape>)}
                />
              </>
            )}
            {shape.type === 'polygon' && (
              <Input
                label="Radius"
                type="number"
                value={Math.round((shape as PolygonShape).radius)}
                onChange={(e) => handleChange({ radius: Number(e.target.value) } as Partial<PolygonShape>)}
              />
            )}
          </div>
        </Section>
      )}

      {/* Shape-specific properties */}
      {shape.type === 'rectangle' && (
        <Section title="Corner">
          <Input
            label="Radius"
            type="number"
            value={(shape as RectangleShape).cornerRadius}
            onChange={(e) => handleChange({ cornerRadius: Number(e.target.value) } as Partial<RectangleShape>)}
          />
        </Section>
      )}

      {shape.type === 'star' && (
        <Section title="Points">
          <Input
            label="Number"
            type="number"
            min={3}
            max={20}
            value={(shape as StarShape).numPoints}
            onChange={(e) => handleChange({ numPoints: Number(e.target.value) } as Partial<StarShape>)}
          />
        </Section>
      )}

      {shape.type === 'polygon' && (
        <Section title="Sides">
          <Input
            label="Number"
            type="number"
            min={3}
            max={20}
            value={(shape as PolygonShape).sides}
            onChange={(e) => handleChange({ sides: Number(e.target.value) } as Partial<PolygonShape>)}
          />
        </Section>
      )}

      {shape.type === 'text' && (
        <Section title="Text">
          <textarea
            value={(shape as TextShape).text}
            onChange={(e) => handleChange({ text: e.target.value } as Partial<TextShape>)}
            className="w-full h-20 p-2 text-sm bg-surface border border-border rounded-md text-text resize-none"
          />
          <Input
            label="Font Size"
            type="number"
            value={(shape as TextShape).fontSize}
            onChange={(e) => handleChange({ fontSize: Number(e.target.value) } as Partial<TextShape>)}
          />
        </Section>
      )}

      {/* Appearance */}
      <Section title="Fill">
        <ColorPicker
          label="Color"
          color={shape.fill}
          opacity={shape.fillOpacity}
          onChange={(fill, fillOpacity) => handleChange({ fill, fillOpacity })}
        />
      </Section>

      <Section title="Stroke">
        <ColorPicker
          label="Color"
          color={shape.stroke}
          opacity={shape.strokeOpacity}
          onChange={(stroke, strokeOpacity) => handleChange({ stroke, strokeOpacity })}
        />
        <Input
          label="Width"
          type="number"
          min={0}
          max={50}
          value={shape.strokeWidth}
          onChange={(e) => handleChange({ strokeWidth: Number(e.target.value) })}
        />
      </Section>

      {/* Rotation */}
      <Section title="Rotation">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-180}
            max={180}
            value={shape.rotation}
            onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-sm text-text w-12 text-right">{Math.round(shape.rotation)}°</span>
        </div>
      </Section>
    </div>
  );
}
