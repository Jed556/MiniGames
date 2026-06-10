import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Play, Square, FastForward, RotateCcw, Plus, Settings, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Flag, Menu, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import CodeBlock from '../features/codelab/CodeBlock';
import './CodeLabGame.css';

const mulberry32 = (a) => {
  return function () {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const blocksDef = {
  'UP': { label: 'MOVE UP', icon: <ArrowUp size={16} strokeWidth={3} />, color: '#9333ea' },
  'DOWN': { label: 'MOVE DOWN', icon: <ArrowDown size={16} strokeWidth={3} />, color: '#9333ea' },
  'LEFT': { label: 'MOVE LEFT', icon: <ArrowLeft size={16} strokeWidth={3} />, color: '#9333ea' },
  'RIGHT': { label: 'MOVE RIGHT', icon: <ArrowRight size={16} strokeWidth={3} />, color: '#9333ea' },
  'LOOP': { label: 'REPEAT', suffix: 'TIMES', icon: <RotateCcw size={16} strokeWidth={3} />, color: '#06b6d4', isLoopStart: true },
};

/* --- DnD Helpers --- */

const DraggablePaletteBlock = ({ id, blockDef }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${id}`,
    data: { type: 'palette', blockId: id }
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-square-btn ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundColor: blockDef.color,
        opacity: isDragging ? 0.4 : 1
      }}
      title={blockDef.label}
    >
      <div style={{ transform: 'scale(1.5)' }}>
        {blockDef.icon}
      </div>
    </button>
  );
};

const SortableSequenceBlock = ({ item, blockDef, children, activePlaybackId, onDelete, onUpdateIterations, index, depth, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'sequence', item }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : (index + 1 + depth),
  };

  return (
    <CodeBlock
      ref={setNodeRef}
      style={style}
      id={item.id}
      label={blockDef.label}
      suffix={blockDef.suffix}
      icon={blockDef.icon}
      color={blockDef.color}
      isLoopStart={blockDef.isLoopStart}
      iterations={item.iterations}
      active={activePlaybackId === item.id}
      isSelected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
      onDelete={onDelete}
      onUpdateIterations={onUpdateIterations}
      dragHandleProps={{ ...attributes, ...listeners }}
    >
      {children}
    </CodeBlock>
  );
};

const DroppableZone = ({ id, items, activeDragId, isActiveOver, isExpanded, children, minHeight = '40px' }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isReceiving = isActiveOver && activeDragId && !items.includes(activeDragId);

  const sortableItems = React.useMemo(() => {
    if (isReceiving) {
      return [...items, activeDragId];
    }
    return items;
  }, [items, isReceiving, activeDragId]);

  return (
    <SortableContext id={id} items={sortableItems} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`droppable-area ${isOver ? 'is-over' : ''} ${isExpanded ? 'is-expanded' : ''} ${isReceiving ? 'is-receiving' : ''}`}
        style={{
          minHeight: isExpanded ? '80px' : (isOver ? '52px' : minHeight),
          flex: id === 'root' ? 1 : 'none',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: isReceiving ? '54px' : (id === 'root' ? '60px' : '24px')
        }}
      >
        {children}
      </div>
    </SortableContext>
  );
};

const DroppablePaletteArea = ({ children }) => {
  const { setNodeRef } = useDroppable({ id: 'palette-zone' });
  return (
    <div
      ref={setNodeRef}
      className="blocks-list"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 0, width: '100%', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}
    >
      {children}
    </div>
  );
};

const DroppableTrash = ({ onClear }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' });
  return (
    <button
      ref={setNodeRef}
      className={`tech-btn trash-btn ${isOver ? 'is-over' : ''}`}
      onClick={onClear}
      style={{
        width: '52px',
        height: '52px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isOver ? 'var(--error-color)' : 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: isOver ? '#fff' : 'var(--error-color)',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.2s',
        marginTop: 'auto'
      }}
      title="Drag block here to delete, or click to clear all"
    >
      <Trash2 size={24} />
    </button>
  );
};

/* --- Main Game Component --- */

const CodeLabGame = () => {
  const { gridSize, useSeed, mapSeed, setMapSeed, showNewMapButton } = useSettings();
  const navigate = useNavigate();
  const [map, setMap] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [playerDir, setPlayerDir] = useState('right');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [spriteAnim, setSpriteAnim] = useState(null); // 'shake', 'sigh', 'jump'
  const [eyeState, setEyeState] = useState('normal'); // 'normal', 'hurt', 'sad', 'happy'

  const [sequence, setSequence] = useState([]);
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);
  const lastActiveDragData = React.useRef(null);
  const [activeOverId, setActiveOverId] = useState(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackSpeedRef = React.useRef(1);
  const shouldStopPlayback = React.useRef(false);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const generateMap = () => {
    const size = gridSize;
    let baseSeedValue = useSeed && mapSeed ? Array.from(mapSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 10000;
    
    let attempt = 0;
    let newMap = [];
    let validMapFound = false;

    while (!validMapFound && attempt < 100) {
      let currentSeedValue = baseSeedValue + attempt;
      const rand = mulberry32(currentSeedValue);

      newMap = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let type = 'empty';
          if (x === 0 && y === 0) type = 'start';
          else if (x === size - 1 && y === size - 1) type = 'end';
          else {
            if (rand() < 0.2 && !(x <= 1 && y === 0) && !(x === 0 && y <= 1) && !(x >= size - 2 && y === size - 1) && !(x === size - 1 && y >= size - 2)) {
              type = 'wall';
            }
          }
          newMap.push({ x, y, type });
        }
      }

      const hasPath = () => {
        const visited = new Set(['0,0']);
        const queue = [{ x: 0, y: 0 }];

        while (queue.length > 0) {
          const { x, y } = queue.shift();
          if (x === size - 1 && y === size - 1) return true;

          const neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 }
          ];

          for (const n of neighbors) {
            if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
              const index = n.y * size + n.x;
              const cell = newMap[index];
              const key = `${n.x},${n.y}`;
              if (cell.type !== 'wall' && !visited.has(key)) {
                visited.add(key);
                queue.push(n);
              }
            }
          }
        }
        return false;
      };

      if (hasPath()) {
        validMapFound = true;
      } else {
        attempt++;
      }
    }

    setMap(newMap);
    setPlayerPos({ x: 0, y: 0 });
    setPlayerDir('right');
    setStatus('idle');
    setMessage('');
    setActivePlaybackId(null);
    setSpriteAnim(null);
    setEyeState('normal');
  };

  useEffect(() => {
    generateMap();
  }, [gridSize, useSeed, mapSeed]);

  // Auto-dismiss status messages after 3 seconds (unless won)
  useEffect(() => {
    if (message && status !== 'won') {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, status]);

  const compileNode = (nodeId) => {
    const node = sequence.find(n => n.id === nodeId);
    if (!node) return [];
    if (node.type === 'LOOP') {
      const iterations = node.iterations || 2;
      const children = sequence.filter(n => n.parentId === node.id);
      let compiledChildren = [];
      children.forEach(child => {
        compiledChildren = compiledChildren.concat(compileNode(child.id));
      });

      let result = [];
      for (let i = 0; i < iterations; i++) {
        result.push({ cmd: node.type, id: node.id });
        result = result.concat(compiledChildren);
      }
      return result;
    }
    return [{ cmd: node.type, id: node.id }];
  };

  const compileSequence = () => {
    const rootNodes = sequence.filter(n => n.parentId === 'root');
    let compiled = [];
    rootNodes.forEach(node => {
      compiled = compiled.concat(compileNode(node.id));
    });
    return compiled;
  };

  const stopSequence = () => {
    shouldStopPlayback.current = true;
    setStatus('idle');
    setMessage('Sequence stopped.');
    setActivePlaybackId(null);
  };

  const executeSequence = async () => {
    if (sequence.length === 0 || status === 'running') return;

    shouldStopPlayback.current = false;

    if (useSeed && mapSeed) console.log(`Starting CodeLab Game with map seed: ${mapSeed}`);

    setStatus('running');
    setPlayerPos({ x: 0, y: 0 });
    setPlayerDir('right');
    setMessage('');
    setSpriteAnim(null);
    setEyeState('normal');

    const compiled = compileSequence();
    let currentPos = { x: 0, y: 0 };

    for (let i = 0; i < compiled.length; i++) {
      const { cmd, id } = compiled[i];
      setActivePlaybackId(id);

      if (cmd.startsWith('LOOP_') || cmd === 'LOOP') {
        await new Promise(resolve => setTimeout(resolve, 200 / playbackSpeedRef.current));
        if (shouldStopPlayback.current) return;
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 400 / playbackSpeedRef.current));
      if (shouldStopPlayback.current) return;
      let nextPos = { ...currentPos };

      if (cmd === 'UP') { nextPos.y -= 1; setPlayerDir('up'); }
      if (cmd === 'DOWN') { nextPos.y += 1; setPlayerDir('down'); }
      if (cmd === 'LEFT') { nextPos.x -= 1; setPlayerDir('left'); }
      if (cmd === 'RIGHT') { nextPos.x += 1; setPlayerDir('right'); }

      if (nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize) {
        setSpriteAnim('shake');
        setEyeState('hurt');
        setStatus('lost');
        setMessage('Out of bounds!');
        setActivePlaybackId(null);
        return;
      }

      const cell = map.find(c => c.x === nextPos.x && c.y === nextPos.y);
      if (cell.type === 'wall') {
        setSpriteAnim('shake');
        setEyeState('hurt');
        setStatus('lost');
        setMessage('Hit a wall!');
        setActivePlaybackId(null);
        return;
      }

      currentPos = nextPos;
      setPlayerPos(currentPos);
    }

    if (currentPos.x === gridSize - 1 && currentPos.y === gridSize - 1) {
      setSpriteAnim('jump');
      setEyeState('happy');
      setStatus('won');
      setMessage('You reached the goal!');

      // Confetti booming from lower left & right corners
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0, y: 1 },
        angle: 60,
        zIndex: 9999
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 1, y: 1 },
        angle: 120,
        zIndex: 9999
      });
    } else {
      setSpriteAnim('sigh');
      setEyeState('sad');
      setStatus('lost');
      setMessage('Sequence ended before reaching the goal.');
    }
    setActivePlaybackId(null);
  };

  const resetGame = () => {
    setPlayerPos({ x: 0, y: 0 });
    setPlayerDir('right');
    setStatus('idle');
    setMessage('');
    setActivePlaybackId(null);
    setSpriteAnim(null);
    setEyeState('normal');
  };

  const deleteBlock = (id) => {
    // Delete block and any children
    const newSeq = sequence.filter(i => i.id !== id && i.parentId !== id);
    setSequence(newSeq);
  };

  const updateLoopIterations = (id, count) => {
    setSequence(seq => seq.map(item => item.id === id ? { ...item, iterations: count } : item));
  };

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    setActiveDragData(event.active.data.current);
    lastActiveDragData.current = event.active.data.current;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    setActiveOverId(over ? over.id : null);

    if (!over) return;
    if (active.data.current?.type !== 'sequence') return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    if (overId === 'trash-zone' || overId === 'palette-zone') return;

    setSequence((prev) => {
      const activeItem = prev.find(i => i.id === activeId);
      if (!activeItem) return prev;

      const overItem = prev.find(i => i.id === overId);

      // 1. Hovering over another item
      if (overItem) {
        if (overItem.parentId === activeItem.parentId) return prev; // Handled by dnd-kit sortable
        if (overItem.parentId === activeId) return prev; // Prevent nesting in self

        const activeIndex = prev.findIndex(i => i.id === activeId);
        const overIndex = prev.findIndex(i => i.id === overId);

        let newSeq = [...prev];
        newSeq[activeIndex] = { ...newSeq[activeIndex], parentId: overItem.parentId };
        return arrayMove(newSeq, activeIndex, overIndex);
      }

      // 2. Hovering over a droppable zone
      if (overId === 'root' || String(overId).startsWith('loop-')) {
        const targetParentId = overId === 'root' ? 'root' : String(overId).replace('loop-', '');
        if (targetParentId === activeItem.parentId) return prev;
        if (targetParentId === activeId) return prev; // Prevent loop into itself

        const activeIndex = prev.findIndex(i => i.id === activeId);
        let newSeq = [...prev];
        newSeq[activeIndex] = { ...newSeq[activeIndex], parentId: targetParentId };
        const item = newSeq.splice(activeIndex, 1)[0];
        newSeq.push(item);
        return newSeq;
      }

      return prev;
    });
  };

  const handleDragEnd = (event) => {
    setActiveDragId(null);
    setActiveDragData(null);
    setActiveOverId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (overId === 'trash-zone' || overId === 'palette-zone') {
      if (active.data.current?.type === 'sequence') {
        deleteBlock(active.data.current.item.id);
      }
      return;
    }

    setSequence((prev) => {
      // 1. Dragging from Palette
      if (active.data.current?.type === 'palette') {
        const blockType = active.data.current.blockId;
        const newItem = { id: `seq-${Date.now()}-${Math.random()}`, type: blockType, parentId: 'root' };
        if (blockType === 'LOOP') newItem.iterations = 2;

        const overItem = prev.find(i => i.id === overId);
        if (overItem) {
          newItem.parentId = overItem.parentId;
          const index = prev.findIndex(i => i.id === overId);
          const newSeq = [...prev];
          newSeq.splice(index, 0, newItem);
          return newSeq;
        }

        if (overId === 'root' || String(overId).startsWith('loop-')) {
          const parentId = overId === 'root' ? 'root' : String(overId).replace('loop-', '');
          newItem.parentId = parentId;
          return [...prev, newItem];
        }
        return prev;
      }

      // 2. Dragging within sequence (Finalize drop)
      if (activeId !== overId) {
        const overItem = prev.find(i => i.id === overId);
        if (overItem) {
          if (overItem.parentId === activeId) return prev;

          const oldIndex = prev.findIndex(i => i.id === activeId);
          const newIndex = prev.findIndex(i => i.id === overId);

          let newSeq = [...prev];
          if (newSeq[oldIndex].parentId !== overItem.parentId) {
            newSeq[oldIndex] = { ...newSeq[oldIndex], parentId: overItem.parentId };
          }
          return arrayMove(newSeq, oldIndex, newIndex);
        }

        if (overId === 'root' || String(overId).startsWith('loop-')) {
          const parentId = overId === 'root' ? 'root' : String(overId).replace('loop-', '');
          if (parentId === activeId) return prev;

          const itemIndex = prev.findIndex(i => i.id === activeId);
          let newSeq = [...prev];
          if (newSeq[itemIndex].parentId !== parentId) {
            newSeq[itemIndex] = { ...newSeq[itemIndex], parentId: parentId };
            const item = newSeq.splice(itemIndex, 1)[0];
            newSeq.push(item);
          }
          return newSeq;
        }
      }
      return prev;
    });
  };

  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const handleBgClick = () => {
    setSelectedBlockId(null);
  };

  // Render tree recursively
  const renderItems = (parentId, depth = 0) => {
    const items = sequence.filter(i => i.parentId === parentId);
    return items.map((item, index) => {
      const def = blocksDef[item.type];
      const childrenItems = sequence.filter(i => i.parentId === item.id);

      const isHovered = activeOverId === item.id || activeOverId === `loop-${item.id}`;

      return (
        <SortableSequenceBlock
          key={item.id}
          item={item}
          blockDef={def}
          activePlaybackId={activePlaybackId}
          onDelete={() => deleteBlock(item.id)}
          onUpdateIterations={(count) => updateLoopIterations(item.id, count)}
          index={index}
          depth={depth}
          isSelected={selectedBlockId === item.id}
          onSelect={() => setSelectedBlockId(item.id)}
        >
          {def.isLoopStart && (
            <DroppableZone
              id={`loop-${item.id}`}
              items={childrenItems.map(i => i.id)}
              activeDragId={activeDragData?.type === 'palette' ? activeDragId : null}
              isActiveOver={activeOverParentId === `loop-${item.id}`}
              isExpanded={isHovered}
              minHeight="20px"
            >
              {renderItems(item.id, depth + 1)}
            </DroppableZone>
          )}
        </SortableSequenceBlock>
      );
    });
  };

  const renderItemsOverlay = (parentId, depth = 0) => {
    const items = sequence.filter(i => i.parentId === parentId);
    return items.map((item, index) => {
      const def = blocksDef[item.type];
      const childrenItems = sequence.filter(i => i.parentId === item.id);
      return (
        <CodeBlock
          key={item.id}
          id={item.id}
          label={def.label}
          icon={def.icon}
          color={def.color}
          suffix={def.suffix}
          isLoopStart={def.isLoopStart}
          iterations={item.iterations}
          style={{ position: 'relative', zIndex: index + 1 + depth }}
        >
          {def.isLoopStart && (
            <div className="droppable-area" style={{ minHeight: '20px' }}>
              {renderItemsOverlay(item.id, depth + 1)}
            </div>
          )}
        </CodeBlock>
      );
    });
  };

  const activeOverParentId = React.useMemo(() => {
    if (!activeOverId) return null;
    if (activeOverId === 'root' || String(activeOverId).startsWith('loop-')) {
      return activeOverId;
    }
    const overItem = sequence.find(i => i.id === activeOverId);
    return overItem ? (overItem.parentId === 'root' ? 'root' : `loop-${overItem.parentId}`) : null;
  }, [activeOverId, sequence]);

  const rootItems = sequence.filter(i => i.parentId === 'root').map(i => i.id);

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="codelab-game fade-in" style={{ position: 'relative' }}>

        {showIntroOverlay && (
          <div className="intro-overlay fade-in">
            <div className="intro-modal glass-panel">
              <h1>Code Lab Logic</h1>
              <p>Drag blocks into the sequence. Put blocks inside Repeat loops to nest them!</p>
              {useSeed && (
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9em' }}>Map Seed</label>
                  <input
                    type="text"
                    value={mapSeed}
                    onChange={(e) => setMapSeed(e.target.value)}
                    placeholder="e.g. 12345"
                    className="tech-input"
                  />
                </div>
              )}
              <button className="start-btn" onClick={() => setShowIntroOverlay(false)}>
                Start Game
              </button>
            </div>
          </div>
        )}

        <div className="codelab-layout">
          <div className="code-panel glass-panel" style={{ display: 'flex', flexDirection: 'row', gap: '20px', padding: '16px', minWidth: '400px', flex: '0 1 auto', width: 'fit-content' }}>

            {/* LEFT COLUMN: Palette + Trash */}
            <div className="palette-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '80px', borderRight: '1px solid var(--glass-border)', paddingRight: '16px', flexShrink: 0 }}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '8px', marginTop: '16px' }}>BLOCKS</div>
              <DroppablePaletteArea>
                {Object.entries(blocksDef).map(([id, b]) => (
                  <DraggablePaletteBlock key={id} id={id} blockDef={b} />
                ))}
              </DroppablePaletteArea>

              <DroppableTrash onClear={() => setSequence([])} />
            </div>

            {/* RIGHT COLUMN: Sequence */}
            <div className="sequence-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Your Sequence</h2>
                <div className="code-actions" style={{ gap: '8px' }}>
                  {status === 'running' ? (
                    <button className="tech-btn play-seq-btn" onClick={stopSequence} style={{ padding: '8px 16px', background: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
                      <Square size={18} /> Stop
                    </button>
                  ) : (
                    <button className="tech-btn play-seq-btn" onClick={executeSequence} disabled={sequence.length === 0} style={{ padding: '8px 16px' }}>
                      <Play size={18} /> Play
                    </button>
                  )}
                </div>
              </div>

              <div className="sequence-list" onClick={handleBgClick} style={{ flex: 1, marginBottom: 0, minWidth: '100%' }}>
                {/* Permanent Start Block */}
                <CodeBlock
                  isStartBlock={true}
                  label="WHEN RUN"
                  icon={<Flag size={16} strokeWidth={3} />}
                  color="#f97316" // Orange like Santa Tracker
                  style={{ zIndex: 0, position: 'relative' }}
                />

                <DroppableZone
                  id="root"
                  items={rootItems}
                  activeDragId={activeDragData?.type === 'palette' ? activeDragId : null}
                  isActiveOver={activeOverParentId === 'root'}
                  minHeight="150px"
                >
                  {renderItems('root')}
                </DroppableZone>
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="map-panel glass-panel" style={{ position: 'relative' }}>
              <div className="map-header">
                <h3>Playroom</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="tech-btn" onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : (s === 2 ? 4 : 1))}>
                    <FastForward size={16} /> {playbackSpeed}x
                  </button>
                  <button className="tech-btn" onClick={resetGame} disabled={status === 'running'}>
                    <RotateCcw size={16} /> Reset
                  </button>
                  {showNewMapButton && (
                    <button className="tech-btn" onClick={generateMap} disabled={status === 'running'}>
                      New Map
                    </button>
                  )}
                </div>
              </div>

              <div className="grid-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '8px' }}>
                <div
                  className="grid-container"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${gridSize}, 1fr)`
                  }}
                >
                  {map.map((cell) => (
                    <div key={`${cell.x}-${cell.y}`} className={`grid-cell ${cell.type}`}></div>
                  ))}

                  {/* Player Sprite Container */}
                  <div
                    className="player-sprite-container"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `calc(100% / ${gridSize})`,
                      height: `calc(100% / ${gridSize})`,
                      transform: `translate(calc(${playerPos.x * 100}%), calc(${playerPos.y * 100}%))`,
                      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      zIndex: 10,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      className={`player-sprite dir-${playerDir} anim-${spriteAnim || 'none'} eyes-${eyeState}`}
                      key={spriteAnim || 'static'}
                    >
                      <div className="sprite-eyes">
                        <div className="eye left-eye"></div>
                        <div className="eye right-eye"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`status-dialog-overlay ${status}`}>
                  <div className="status-dialog" style={{ textAlign: 'center', minWidth: '300px' }}>
                    <h3 style={{ margin: 0, marginBottom: '16px' }}>{status === 'won' ? 'Success!' : 'Oops!'}</h3>
                    <p>{message}</p>
                    {status === 'won' && (
                      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="tech-btn" onClick={() => navigate('/')} style={{ padding: '8px 16px' }}>
                          <Home size={18} style={{ marginRight: '8px' }} /> Go Home
                        </button>
                        <button className="tech-btn" onClick={generateMap} style={{ padding: '8px 16px' }}>
                          <RotateCcw size={18} style={{ marginRight: '8px' }} /> Play Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay for smooth visual dragging */}
      <DragOverlay
        dropAnimation={lastActiveDragData.current?.type === 'palette' ? null : { duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}
        modifiers={[snapCenterToCursor]}
      >
        {activeDragData ? (() => {
          if (activeDragData.type === 'palette') {
            const b = blocksDef[activeDragData.blockId];
            return (
              <CodeBlock
                label={b.label}
                icon={b.icon}
                color={b.color}
                suffix={b.suffix}
                isLoopStart={b.isLoopStart}
                iterations={2}
                style={{ opacity: 0.9, boxShadow: '0 10px 25px rgba(0,0,0,0.4)', transform: 'scale(1.05)', cursor: 'grabbing', width: '260px' }}
              />
            );
          } else if (activeDragData.type === 'sequence') {
            const item = activeDragData.item;
            const b = blocksDef[item.type];
            return (
              <CodeBlock
                label={b.label}
                icon={b.icon}
                color={b.color}
                suffix={b.suffix}
                isLoopStart={b.isLoopStart}
                iterations={item.iterations}
                style={{ opacity: 0.9, boxShadow: '0 10px 25px rgba(0,0,0,0.4)', transform: 'scale(1.05)', cursor: 'grabbing', width: '260px' }}
              >
                {b.isLoopStart && (
                  <div className="droppable-area" style={{ minHeight: '20px' }}>
                    {renderItemsOverlay(item.id, 1)}
                  </div>
                )}
              </CodeBlock>
            );
          }
          return null;
        })() : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CodeLabGame;
