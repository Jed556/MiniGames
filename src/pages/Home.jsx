import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Code2 } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'qa',
      title: 'Q&A Challenge',
      description: 'Test your knowledge with our interactive trivia game.',
      icon: <HelpCircle size={48} />,
      path: '/qa',
      color: '#3b82f6'
    },
    {
      id: 'codelab',
      title: 'Code Lab Logic',
      description: 'Guide the sprite using visual code blocks. Master loops and algorithms!',
      icon: <Code2 size={48} />,
      path: '/codelab',
      color: '#10b981'
    }
  ];

  return (
    <div className="home-page fade-in">
      <div className="home-header">
        <h1>Select a Game</h1>
        <p>Pick your poison and start the challenge.</p>
      </div>
      
      <div className="games-grid">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="game-card glass-panel"
            onClick={() => navigate(game.path)}
          >
            <div className="game-icon" style={{ color: game.color }}>
              {game.icon}
            </div>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <button className="play-btn" style={{ backgroundColor: game.color }}>
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
