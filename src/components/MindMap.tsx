import { useState, useRef, MouseEvent } from 'react';
import { Plus, Trash2, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  type?: 'root' | 'child';
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export const MindMap = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'root', text: 'Define the Problem', x: 50, y: 250, parentId: null, type: 'root' },
  ]);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
    setDraggingId(id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

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

  const addNode = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: Node = {
      id: Date.now().toString(),
      text: 'Why?',
      x: parent.x + 250,
      y: parent.y,
      parentId,
      type: 'child'
    };
    
    // Auto-adjust y if there are multiple children to avoid overlap
    const siblings = nodes.filter(n => n.parentId === parentId);
    if (siblings.length > 0) {
        newNode.y = parent.y + (siblings.length * 100);
    }

    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    // Recursively delete children
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

  const updateNodeText = (id: string, text: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, text } : n));
  };

  // Calculate Bezier curves for connections
  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parent = nodes.find(n => n.id === node.parentId);
      if (!parent) return null;

      const startX = parent.x + NODE_WIDTH;
      const startY = parent.y + NODE_HEIGHT / 2;
      const endX = node.x;
      const endY = node.y + NODE_HEIGHT / 2;

      const controlPoint1X = startX + (endX - startX) / 2;
      const controlPoint1Y = startY;
      const controlPoint2X = endX - (endX - startX) / 2;
      const controlPoint2Y = endY;

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
    <div 
      ref={containerRef}
      className="w-full h-[600px] bg-slate-50 relative overflow-hidden border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded shadow backdrop-blur-sm text-xs text-slate-500 pointer-events-none">
        <p className="flex items-center"><MousePointer2 className="w-3 h-3 mr-1"/> Drag nodes to organize</p>
        <p className="flex items-center mt-1"><Plus className="w-3 h-3 mr-1"/> Add 'Why' to drill down</p>
      </div>

      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {renderConnections()}
      </svg>

      {nodes.map(node => (
        <div
          key={node.id}
          style={{
            transform: `translate(${node.x}px, ${node.y}px)`,
            width: NODE_WIDTH,
            // height: NODE_HEIGHT,
          }}
          className={clsx(
            "absolute flex flex-col p-3 rounded-lg shadow-sm border transition-shadow group",
            node.type === 'root' ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-blue-300"
          )}
        >
          {/* Header / Drag Handle */}
          <div 
            className="flex justify-between items-center mb-2 cursor-grab active:cursor-grabbing border-b border-transparent group-hover:border-slate-100 pb-1"
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          >
             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {node.type === 'root' ? 'PROBLEM' : 'WHY?'}
             </span>
             <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {node.type !== 'root' && (
                    <button 
                        onClick={() => deleteNode(node.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                        title="Delete branch"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
                <button 
                    onClick={() => addNode(node.id)}
                    className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded"
                    title="Add next Why"
                >
                    <Plus className="w-3 h-3" />
                </button>
             </div>
          </div>

          <textarea
            value={node.text}
            onChange={(e) => updateNodeText(node.id, e.target.value)}
            className="w-full text-sm bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-700 font-medium"
            rows={2}
            placeholder={node.type === 'root' ? "Describe the problem..." : "Ask why..."}
          />
        </div>
      ))}
    </div>
  );
};
