import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [url, setUrl] = useState('');
  const [traceData, setTraceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer;

    if (loading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev; // Cap at 95% until completion
          return prev + Math.random() * 5; // Increment gradually
        });
      }, 200);
    }

    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setTraceData([]);
    setDuration(0);

    const startTime = performance.now();

    try {
      const response = await axios.post('http://localhost:5000/trace', { url });
      const endTime = performance.now();
      setDuration(((endTime - startTime) / 1000).toFixed(2));
      setTraceData(response.data);
    } catch (err) {
      setError('⚠️ Failed to trace URL. Please try again.');
    } finally {
      setProgress(100);
      setTimeout(() => setLoading(false), 400); // Slight delay for smooth finish
    }
  };

  const handleReset = () => {
    setUrl('');
    setTraceData([]);
    setError('');
    setDuration(0);
    setProgress(0);
  };

  return (
    <div className="container">
      <h1>🔗 URL Trace Route Tool</h1>

      {!traceData.length && (
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL (e.g. http://bit.ly/xyz)"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Tracing...' : 'Trace'}
          </button>
        </form>
      )}

      {loading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p className="loader-text">Tracing route...</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {traceData.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>Status</th>
                <th>Scheme</th>
                <th>Host</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {traceData.map((step) => (
                <tr key={step.step}>
                  <td>{step.step}</td>
                  <td>{step.status}</td>
                  <td>{step.scheme}</td>
                  <td>{step.host}</td>
                  <td className="path-cell">{step.path}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="success-message">
            ✅ Trace completed successfully in <strong>{duration}s</strong>.
          </p>

          <button className="reset-button" onClick={handleReset}>
            🔁 Try Another URL
          </button>
        </>
      )}
    </div>
  );
};

export default App;
