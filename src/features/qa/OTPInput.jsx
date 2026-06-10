import React, { useRef, useEffect } from 'react';
import './OTPInput.css';

const OTPInput = ({ length, values, onChange, disabledIndices }) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (e, index) => {
    const val = e.target.value.toUpperCase();
    if (!/^[A-Z]*$/.test(val)) return;

    const newValues = [...values];
    newValues[index] = val.slice(-1); // Only take the last character
    onChange(newValues);

    // Move to next input
    if (val && index < length - 1) {
      let nextIndex = index + 1;
      while (nextIndex < length && disabledIndices.includes(nextIndex)) {
        nextIndex++;
      }
      if (nextIndex < length) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        let prevIndex = index - 1;
        while (prevIndex >= 0 && disabledIndices.includes(prevIndex)) {
          prevIndex--;
        }
        if (prevIndex >= 0) {
          inputRefs.current[prevIndex].focus();
        }
      } else {
        const newValues = [...values];
        newValues[index] = '';
        onChange(newValues);
      }
    }
  };

  return (
    <div className="otp-container">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          value={values[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabledIndices.includes(index)}
          className={`otp-input ${disabledIndices.includes(index) ? 'hinted' : ''}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      ))}
    </div>
  );
};

export default OTPInput;
