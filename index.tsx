import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

const MAX_CHARS = 1000;

interface Entry {
  id: number;
  text: string;
  favorited: boolean;
  timestamp: Date;
}

// Web Speech API interfaces for broader compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleAddEntry = () => {
    if (inputText.trim() === '') return;

    const newEntry: Entry = {
      id: Date.now(),
      text: inputText.trim(),
      favorited: false,
      timestamp: new Date(),
    };

    setEntries([newEntry, ...entries]);
    setInputText('');
  };

  const handleToggleFavorite = (id: number) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, favorited: !entry.favorited } : entry
      )
    );
  };

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText(''); // Clear previous text
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const displayedEntries = useMemo(() => {
    let sortedAndFiltered = [...entries];
    switch (sortOrder) {
      case 'oldest':
        sortedAndFiltered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        break;
      case 'favorites':
        sortedAndFiltered = sortedAndFiltered
          .filter(entry => entry.favorited)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case 'newest':
      default:
        // The default entry order is already newest first.
        // We just need to make sure it's explicitly sorted in case the base array order changes.
        sortedAndFiltered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
    }
    return sortedAndFiltered;
  }, [entries, sortOrder]);

  return (
    <div className="app-container">
      <h1>Shit Kate Says</h1>
      <div className="input-form">
        <div className="textarea-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or record your note..."
            maxLength={MAX_CHARS}
            aria-label="Note input"
          />
          <span className="char-counter">{inputText.length} / {MAX_CHARS}</span>
        </div>
        <div className="controls">
          <button
            className={`icon-button ${isRecording ? 'recording' : ''}`}
            onClick={handleToggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span className="material-icons">{isRecording ? 'mic' : 'mic_none'}</span>
          </button>
          <button
            className="submit-button"
            onClick={handleAddEntry}
            disabled={inputText.trim().length === 0}
            aria-label="Add Note"
          >
            Add Note
          </button>
        </div>
      </div>
      
      <div className="filter-controls">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          className="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="favorites">Favorites</option>
        </select>
      </div>

      <div className="entries-list" aria-live="polite">
        {displayedEntries.length > 0 ? (
          displayedEntries.map((entry) => (
            <div key={entry.id} className="entry-item" role="listitem">
              <p className="entry-text">{entry.text}</p>
              <button
                className={`icon-button favorite-button ${entry.favorited ? 'favorited' : ''}`}
                onClick={() => handleToggleFavorite(entry.id)}
                aria-pressed={entry.favorited}
                aria-label={entry.favorited ? `Unmark as favorite` : `Mark as favorite`}
                title={entry.favorited ? `Unmark as favorite` : `Mark as favorite`}
              >
                <span className="material-icons">
                  {entry.favorited ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>
          ))
        ) : (
          <p className="placeholder-text">
            {sortOrder === 'favorites' ? 'No favorited notes yet.' : 'Your notes will appear here.'}
          </p>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
