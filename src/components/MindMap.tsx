import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, useLayoutEffect } from 'react';
import { Plus, Trash2, MousePointer2, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  parentId: string | null;
  type?: 'root' | 'child';
}

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 80;

const MindMapNode = ({ 
  node, 
  onUpdate, 
  onAdd, 
  onDelete, 
  onMouseDown 
}: { 
  node: Node, 
  onUpdate: (id: string, updates: Partial<Node>) => void,
  onAdd: (id: string, direction: 'right' | 'bottom') => void,
  onDelete: (id: string) => void,
  onMouseDown: (e: ReactMouseEvent, id: string) => void
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [node.text]);

  // Observe node size changes
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if significantly different to avoid loops (though contentRect should be stable)
        if (Math.abs((node.width || DEFAULT_WIDTH) - width) > 1 || Math.abs((node.height || DEFAULT_HEIGHT) - height) > 1) {
             // We need to be careful not to cause infinite render loops.
             // Updating state inside observer callback.
             // Use a debounce or check if the update is needed.
             // Actually, for line drawing we need the full box size (border-box).
             // entry.borderBoxSize is available in newer browsers, or use getBoundingClientRect
             
             // We need unscaled dimensions?
             // getBoundingClientRect returns scaled dimensions if transform is applied.
             // But the node itself doesn't have scale transform, the parent container does.
             // So node dimensions should be unscaled relative to the container.
             // However, if the observer fires, it sees the element size.
             // Let's use offsetWidth/offsetHeight.
             const el = entry.target as HTMLElement;
             if (el.offsetWidth !== node.width || el.offsetHeight !== node.height) {
                 onUpdate(node.id, { width: el.offsetWidth, height: el.offsetHeight });
             }
        }
      }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [node.id, node.width, node.height, onUpdate]); // Dependencies might cause loop if not careful.

  // Actually, ResizeObserver loop is a common issue. 
  // Simplified approach: Update size only when text changes (in layout effect).
  // But resizing the node manually isn't supported yet, only auto-resize by content.
  // So relying on text change is enough.
  
  useLayoutEffect(() => {
      if (nodeRef.current) {
          const w = nodeRef.current.offsetWidth;
          const h = nodeRef.current.offsetHeight;
          if (w !== node.width || h !== node.height) {
              onUpdate(node.id, { width: w, height: h });
          }
      }
  }, [node.text, node.width, node.height, onUpdate]);


  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: DEFAULT_WIDTH, // Fixed width for now, grows vertically
      }}
      className={clsx(
        "absolute flex flex-col p-3 rounded-lg shadow-sm border transition-shadow group select-none",
        node.type === 'root' ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-blue-300"
      )}
    >
      {/* Header / Drag Handle */}
      <div 
        className="flex justify-between items-center mb-2 cursor-grab active:cursor-grabbing border-b border-transparent group-hover:border-slate-100 pb-1"
        onMouseDown={(e) => onMouseDown(e, node.id)}
      >
         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {node.type === 'root' ? 'PROBLEM' : 'WHY?'}
         </span>
         <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.type !== 'root' && (
                <button 
                    onClick={() => onDelete(node.id)}
                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                    title="Delete branch"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
            <button 
                onClick={() => onAdd(node.id, 'right')}
                className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded"
                title="Add next Why (Right)"
            >
                <Plus className="w-3 h-3" />
            </button>
         </div>
      </div>

      <textarea
        ref={textareaRef}
        value={node.text}
        onChange={(e) => onUpdate(node.id, { text: e.target.value })}
        className="w-full text-sm bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-700 font-medium overflow-hidden"
        rows={1}
        placeholder={node.type === 'root' ? "Describe the problem..." : "Ask why..."}
        onMouseDown={(e) => e.stopPropagation()} // Allow text selection
      />

      {/* Add Below Button */}
      <button 
        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 text-slate-400 hover:text-blue-500 z-10"
        onClick={() => onAdd(node.id, 'bottom')}
        title="Add Why below"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export const MindMap = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'root', text: 'Define the Problem', x: 50, y: 250, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, parentId: null, type: 'root' },
  ]);
  
  const [scale, setScale] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: ReactMouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Adjust for scale
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
    setDraggingId(id);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setNodes(nodes.map(node => {
      if (node.id === draggingId) {
        return {
          ...node,
          x: mouseX - dragOffset.x,
          y: mouseY - dragOffset.y
        };
      }
      return node;
    }));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const addNode = (parentId: string, direction: 'right' | 'bottom') => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: Node = {
      id: Date.now().toString(),
      text: 'Why?',
      x: 0,
      y: 0,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      parentId,
      type: 'child'
    };
    
    if (direction === 'bottom') {
        newNode.x = parent.x;
        newNode.y = parent.y + (parent.height || DEFAULT_HEIGHT) + 50;
        
        // Adjust if siblings exist below
        const bottomSiblings = nodes.filter(n => 
            n.parentId === parentId && 
            n.y > parent.y + (parent.height || DEFAULT_HEIGHT)/2
        );
        
        if (bottomSiblings.length > 0) {
            const maxX = Math.max(...bottomSiblings.map(n => n.x));
            newNode.x = maxX + (DEFAULT_WIDTH + 20);
        }
    } else {
        // Default to right
        newNode.x = parent.x + (parent.width || DEFAULT_WIDTH) + 50;
        newNode.y = parent.y;

        // Auto-adjust y if there are multiple children to the right
        const rightSiblings = nodes.filter(n => 
            n.parentId === parentId && 
            n.x > parent.x + (parent.width || DEFAULT_WIDTH)/2
        );
        if (rightSiblings.length > 0) {
            const maxY = Math.max(...rightSiblings.map(n => n.y));
            newNode.y = maxY + (DEFAULT_HEIGHT + 20);
        }
    }

    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    const getDescendants = (nodeId: string): string[] => {
        const children = nodes.filter(n => n.parentId === nodeId);
        let descendants = children.map(c => c.id);
        children.forEach(c => {
            descendants = [...descendants, ...getDescendants(c.id)];
        });
        return descendants;
    };

    const idsToDelete = [id, ...getDescendants(id)];
    setNodes(nodes.filter(n => !idsToDelete.includes(n.id)));
  };

  const updateNode = (id: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parent = nodes.find(n => n.id === node.parentId);
      if (!parent) return null;

      const parentWidth = parent.width || DEFAULT_WIDTH;
      const parentHeight = parent.height || DEFAULT_HEIGHT;
      const nodeWidth = node.width || DEFAULT_WIDTH;
      const nodeHeight = node.height || DEFAULT_HEIGHT;

      let startX, startY, endX, endY, controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;

      // Determine if vertical connection (node is below parent)
      // Use a tolerance of 10px to avoid flickering if exactly on line
      if (node.y >= parent.y + parentHeight - 10) {
          // Vertical: Bottom Center -> Top Center
          startX = parent.x + parentWidth / 2;
          startY = parent.y + parentHeight;
          endX = node.x + nodeWidth / 2;
          endY = node.y;

          controlPoint1X = startX;
          controlPoint1Y = startY + (endY - startY) / 2;
          controlPoint2X = endX;
          controlPoint2Y = endY - (endY - startY) / 2;
      } else {
          // Horizontal: Right Center -> Left Center
          startX = parent.x + parentWidth;
          startY = parent.y + parentHeight / 2;
          endX = node.x;
          endY = node.y + nodeHeight / 2;

          controlPoint1X = startX + (endX - startX) / 2;
          controlPoint1Y = startY;
          controlPoint2X = endX - (endX - startX) / 2;
          controlPoint2Y = endY;
      }

      const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

      return (
        <path
          key={`${parent.id}-${node.id}`}
          d={path}
          stroke="#94a3b8"
          strokeWidth="2"
          fill="none"
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-full space-y-2">
         {/* Controls */}
        <div className="flex justify-end space-x-2">
             <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button 
                    onClick={() => setScale(Math.max(0.5, scale - 0.1))} 
                    className="p-1 hover:bg-white rounded shadow-sm"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={() => setScale(Math.min(2, scale + 0.1))} 
                    className="p-1 hover:bg-white rounded shadow-sm"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
             </div>
        </div>

        <div 
          ref={containerRef}
          className="w-full min-h-[600px] bg-slate-50 relative overflow-hidden border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing resize-y"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded shadow backdrop-blur-sm text-xs text-slate-500 pointer-events-none">
            <p className="flex items-center"><MousePointer2 className="w-3 h-3 mr-1"/> Drag nodes to organize</p>
            <p className="flex items-center mt-1"><Plus className="w-3 h-3 mr-1"/> Add 'Why' to drill down</p>
          </div>

          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                {renderConnections()}
              </svg>

              {nodes.map(node => (
                <MindMapNode
                    key={node.id}
                    node={node}
                    onUpdate={updateNode}
                    onAdd={addNode}
                    onDelete={deleteNode}
                    onMouseDown={handleMouseDown}
                />
              ))}
          </div>
        </div>
    </div>
  );
};
