import React, { forwardRef } from 'react';
import { Trash2, Menu } from 'lucide-react';
import './CodeBlock.css';

const CodeBlock = forwardRef(({ 
  id,
  label, 
  icon, 
  color, 
  suffix,
  isStartBlock,
  isLoopStart,
  iterations,
  active,
  isSelected,
  onDelete,
  onUpdateIterations,
  onClick,
  dragHandleProps,
  style,
  children 
}, ref) => {
  
  const handleIterationsChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    onUpdateIterations(val);
  };

  return (
    <div 
      ref={ref}
      className={`code-block-item ${isStartBlock ? 'start-block' : ''} ${isLoopStart ? 'loop-start' : ''} ${active ? 'active' : ''} ${isSelected ? 'block-selected' : ''}`}
      style={{ ...style, '--block-color': color }}
      id={id}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      <div className="block-visuals">
        {/* Top Notch Giver (Bump) for normal blocks */}
        {!isStartBlock && <div className="top-giver"></div>}

        {/* Elevation: darker duplicate shifted 4px down */}
        <div className={`block-elevation ${isLoopStart ? 'has-bottom-hole-shifted' : 'has-bottom-hole'}`}></div>

        {/* The main block rectangle */}
        <div className={`block-content ${isLoopStart ? 'has-bottom-hole-shifted' : 'has-bottom-hole'}`} {...(dragHandleProps || {})}>
        <div className="block-drag-area">
          {!isStartBlock && <Menu size={18} strokeWidth={3} className="drag-handle-icon" />}
          {icon && <span className="block-icon">{icon}</span>}
          <span className="block-label">{label}</span>
          {isLoopStart && iterations !== undefined && (
            <>
              <input 
                type="number" 
                value={iterations}
                onChange={handleIterationsChange}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="loop-iterations-input"
                min="1"
                max="99"
              />
              <span className="block-suffix">{suffix}</span>
            </>
          )}
        </div>
        {!isStartBlock && onDelete && (
          <button className="icon-btn-small delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
      </div>

      {isLoopStart && (
        <div className="loop-c-bar">
          <div className="loop-children-container">
            {children}
          </div>
          
          <div className="loop-lip-visuals">
            {/* Elevation for loop bottom lip */}
            <div className="loop-lip-elevation has-bottom-hole"></div>
            {/* Loop bottom lip (has a bottom hole to receive next block's bump) */}
            <div className="loop-end-lip has-bottom-hole">
              {/* Inner top notch giver (bump) to connect to last child */}
              <div className="inner-top-giver"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CodeBlock;
