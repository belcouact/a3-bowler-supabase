import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, useLayoutEffect, useCallback } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Palette } from 'lucide-react';
import clsx from 'clsx';
import { MindMapNodeData } from '../context/AppContext';
import { generateShortId } from '../utils/idUtils';

type Node = MindMapNodeData;

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 80;

const COLORS = [
  { name: 'White', value: '#ffffff', border: '#e2e8f0' },
  { name: 'Blue', value: '#eff6ff', border: '#bfdbfe' },
  { name: 'Green', value: '#f0fdf4', border: '#bbf7d0' },
  { name: 'Yellow', value: '#fefce8', border: '#fef08a' },
  { name: 'Red', value: '#fef2f2', border: '#fecaca' },
  { name: 'Purple', value: '#faf5ff', border: '#e9d5ff' },
];

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const nodeDataRef = useRef(node);

  useLayoutEffect(() => {
    nodeDataRef.current = node;
  });

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (textareaRef.current && !node.customHeight) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [node.text, node.customHeight]);

  // Observe node size changes (only update model if size changes significantly and not resizing manually)
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const currentNode = nodeDataRef.current;
        
        // Only update if difference is significant
        if (Math.abs((currentNode.width || DEFAULT_WIDTH) - el.offsetWidth) > 2 || Math.abs((currentNode.height || DEFAULT_HEIGHT) - el.offsetHeight) > 2) {
             onUpdate(currentNode.id, { width: el.offsetWidth, height: el.offsetHeight });
        }
      }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [onUpdate]);

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = nodeRef.current?.offsetWidth || DEFAULT_WIDTH;
    const startHeight = nodeRef.current?.offsetHeight || DEFAULT_HEIGHT;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        const newWidth = Math.max(100, startWidth + deltaX);
        const newHeight = Math.max(50, startHeight + deltaY);
        
        onUpdate(node.id, { 
            customWidth: newWidth, 
            customHeight: newHeight,
            width: newWidth, 
            height: newHeight 
        });
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.customWidth || DEFAULT_WIDTH,
        height: node.customHeight,
        backgroundColor: node.color || (node.type === 'root' ? '#eff6ff' : '#ffffff'),
        borderColor: node.color ? COLORS.find(c => c.value === node.color)?.border : undefined,
      }}
      className={clsx(
        "absolute flex flex-col p-3 rounded-lg shadow-sm border transition-shadow group select-none",
        !node.color && (node.type === 'root' ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-blue-300")
      )}
    >
      {/* Header / Drag Handle */}
      <div 
        className="flex justify-between items-center mb-2 cursor-grab active:cursor-grabbing border-b border-transparent group-hover:border-slate-100 pb-1 relative"
        onMouseDown={(e) => onMouseDown(e, node.id)}
      >
         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {node.type === 'root' ? 'PROBLEM' : 'WHY?'}
         </span>
         <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
            {/* Color Picker Trigger */}
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowColorPicker(!showColorPicker);
                    }}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded"
                    title="Change Color"
                >
                    <Palette className="w-3 h-3" />
                </button>
                
                {/* Color Picker Popup */}
                {showColorPicker && (
                    <div className="absolute top-full right-0 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 flex gap-1 z-50 min-w-[140px] flex-wrap" onMouseDown={e => e.stopPropagation()}>
                        {COLORS.map((color) => (
                            <button
                                key={color.name}
                                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.value }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(node.id, { color: color.value });
                                    setShowColorPicker(false);
                                }}
                                title={color.name}
                            />
                        ))}
                    </div>
                )}
            </div>

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
        style={{ 
            height: node.customHeight ? '100%' : undefined,
            resize: 'none'
        }}
        className={clsx(
            "w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 font-medium overflow-hidden",
            node.customHeight ? "flex-1" : ""
        )}
        rows={1}
        placeholder={node.type === 'root' ? "Describe the problem..." : "Ask why..."}
        onMouseDown={(e) => e.stopPropagation()} // Allow text selection
      />

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
        onMouseDown={handleResizeStart}
        title="Resize"
      >
         <div className="w-2 h-2 border-r-2 border-b-2 border-slate-300"></div>
      </div>

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

interface MindMapProps {
  initialNodes?: MindMapNodeData[];
  onChange?: (nodes: MindMapNodeData[]) => void;
}

export const MindMap = ({ initialNodes, onChange }: MindMapProps) => {
  const [nodes, setNodes] = useState<Node[]>(
    initialNodes && initialNodes.length > 0
      ? initialNodes
      : [
          {
            id: 'root',
            text: 'Define the Problem',
            x: 50,
            y: 250,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            parentId: null,
            type: 'root',
          },
        ]
  );
  
  const [scale, setScale] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  // Update ref when onChange prop changes to avoid effect dependency
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent of changes
  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current(nodes);
    }
  }, [nodes]);

  // Sync with external updates
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0 && draggingId === null) {
        setNodes(prev => {
            // Optimization: check reference equality first
            if (prev === initialNodes) {
                return prev;
            }
            // Deep comparison to prevent unnecessary updates/loops
            if (JSON.stringify(prev) === JSON.stringify(initialNodes)) {
                return prev;
            }
            return initialNodes;
        });
    }
  }, [initialNodes, draggingId]); 

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
      id: generateShortId(),
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

  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

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
          stroke="#475569"
          strokeWidth="3"
          fill="none"
        />
      );
    });
  };

  return (
    <div className="flex flex-col space-y-2">
        <div 
          ref={containerRef}
          className="w-full h-[600px] bg-slate-50 relative overflow-hidden border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing resize-y"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute top-4 right-4 z-20 flex items-center bg-white/80 rounded-md p-1 shadow backdrop-blur-sm border border-slate-200">
                <button 
                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}  
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-12 text-center select-none">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={() => setScale(Math.min(2, scale + 0.1))} 
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
          </div>

          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%', position: 'relative' }}>
              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                style={{ overflow: 'visible', zIndex: 0 }}
                width="100%"
                height="100%"
              >
                {renderConnections()}
              </svg>

              <div className="relative" style={{ zIndex: 10 }}>
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
    </div>
  );
};
