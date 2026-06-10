import React, { useState, useEffect } from 'react';
import OTPInput from '../features/qa/OTPInput';
import { useSettings } from '../context/SettingsContext';
import { Lightbulb, ChevronRight, Clock, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './QAGame.css';



const QAGame = () => {
  const { qaHints, autoAdjustHints, showHintButton, qaQuestions, qaTimer, randomizeQuestions, qaQuestionLimit } = useSettings();
  const navigate = useNavigate();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [values, setValues] = useState([]);
  const [disabledIndices, setDisabledIndices] = useState([]);
  const [hintsLeft, setHintsLeft] = useState(qaHints);
  const [status, setStatus] = useState('playing'); // playing, won, timeout
  const [timeLeft, setTimeLeft] = useState(qaTimer || 0);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);

  useEffect(() => {
    let qs = qaQuestions && qaQuestions.length > 0 ? [...qaQuestions] : [{ q: "No questions available", a: "ERROR" }];
    
    if (randomizeQuestions && qs[0].a !== "ERROR") {
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }
    }
    
    if (qaQuestionLimit > 0 && qaQuestionLimit < qs.length && qs[0].a !== "ERROR") {
      qs = qs.slice(0, qaQuestionLimit);
    }
    
    setActiveQuestions(qs);
    setCurrentQIndex(0);
  }, [qaQuestions, randomizeQuestions, qaQuestionLimit]);

  const questions = activeQuestions.length > 0 ? activeQuestions : [{ q: "Loading...", a: "" }];
  const answer = questions[currentQIndex]?.a || "";

  useEffect(() => {
    setValues(Array(answer.length).fill(''));
    setDisabledIndices([]);
    
    let initialHints = qaHints;
    if (autoAdjustHints && answer.length > 0) {
      initialHints = Math.min(qaHints, Math.max(0, Math.floor((answer.length - 1) / 2)));
    }
    setHintsLeft(initialHints);
    
    setStatus('playing');
    setTimeLeft(qaTimer || 0);
  }, [currentQIndex, answer, qaHints, autoAdjustHints, qaTimer]);

  useEffect(() => {
    if (answer && values.join('') === answer && status === 'playing') {
      setStatus('won');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [values, answer, status]);

  useEffect(() => {
    if (qaTimer > 0 && status === 'playing' && !showIntroOverlay) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            setStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [qaTimer, status, showIntroOverlay]);

  const handleHint = () => {
    if (hintsLeft <= 0 || status !== 'playing') return;

    const availableIndices = [];
    for (let i = 0; i < answer.length; i++) {
      if (!disabledIndices.includes(i) && values[i] !== answer[i]) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length === 0) return;

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newValues = [...values];
    newValues[randomIndex] = answer[randomIndex];
    
    setValues(newValues);
    setDisabledIndices([...disabledIndices, randomIndex]);
    setHintsLeft(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setCurrentQIndex(0); // Restart
    }
  };

  return (
    <div className="qa-game fade-in" style={{ position: 'relative' }}>
      {showIntroOverlay && (
        <div className="intro-overlay fade-in">
          <div className="intro-modal glass-panel">
            <h1>Q&A Challenge</h1>
            <p>Type the correct answer to the question before the timer runs out!</p>
            <button className="start-btn" onClick={() => setShowIntroOverlay(false)}>
              Start Game
            </button>
          </div>
        </div>
      )}

      <div className="qa-header glass-panel">
        <h1>Q&A Challenge</h1>
        <p>Question {currentQIndex + 1} of {questions.length}</p>
      </div>

      <div className="qa-board glass-panel">
        <h2 className="question-text">{questions[currentQIndex].q}</h2>
        
        <OTPInput 
          length={answer.length}
          values={values}
          onChange={setValues}
          disabledIndices={disabledIndices}
        />

        <div className="qa-controls">
          {qaTimer > 0 && (
            <div className="tech-btn timer-pill" style={{ cursor: 'default' }}>
              <Clock size={20} color={timeLeft <= 5 ? '#ef4444' : 'currentColor'} />
              <span style={{ color: timeLeft <= 5 ? '#ef4444' : 'inherit' }}>
                {timeLeft}s
              </span>
            </div>
          )}

          {showHintButton && (
            <button 
              className="tech-btn hint-btn" 
              onClick={handleHint}
              disabled={hintsLeft <= 0 || status !== 'playing'}
            >
              <Lightbulb size={20} />
              Hint
              <span className="hint-badge">{hintsLeft}</span>
            </button>
          )}
        </div>

        {(status === 'won' || status === 'timeout') && (
          <div className="qa-status-overlay">
            <div className={`qa-status-dialog ${status === 'won' ? 'won' : 'timeout'}`}>
              <h3 style={{ margin: 0, marginBottom: '16px' }}>{status === 'won' ? 'Correct!' : "Time's up!"} The answer is {answer}.</h3>
              {currentQIndex < questions.length - 1 ? (
                <button className="tech-btn next-btn" onClick={handleNext} style={{ justifyContent: 'space-between', width: '200px' }}>
                  Next Question <ChevronRight size={20} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
                  <button className="tech-btn next-btn" onClick={() => navigate('/')} style={{ justifyContent: 'space-between', width: '160px' }}>
                    <Home size={20} /> Go Home
                  </button>
                  <button className="tech-btn next-btn" onClick={handleNext} style={{ justifyContent: 'space-between', width: '160px' }}>
                    Play Again <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAGame;
