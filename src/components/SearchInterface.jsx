import React, { useState, useEffect } from 'react';
import videoSearchService from '../services/videoSearchService';
import VideoResultPlayer from './VideoResultPlayer';
import './SearchInterface.css';

const SearchInterface = ({ isConnected }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [enrichedResults, setEnrichedResults] = useState([]); // NEW
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [topK, setTopK] = useState(10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [dateFilter, setDateFilter] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  
  // Available dates and stats
  const [availableDates, setAvailableDates] = useState([]);
  const [stats, setStats] = useState(null);

  // Load available dates and stats on mount
  useEffect(() => {
    if (isConnected) {
      loadDatesAndStats();
    }
  }, [isConnected]);

  const loadDatesAndStats = async () => {
    try {
      const [datesData, statsData] = await Promise.all([
        videoSearchService.getAvailableDates(),
        videoSearchService.getStats()
      ]);
      
      setAvailableDates(datesData.dates || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dates/stats:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (!isConnected) {
      setError('Not connected to Colab backend');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      console.log('🔍 Searching for:', query);
      
      const response = await videoSearchService.search(query, {
        topK,
        similarityThreshold,
        dateFilter: dateFilter || undefined,
        namespaceFilter: namespaceFilter || undefined
      });
      
      setSearchResults(response.results || []);
      
      // Results already include cloudinary_url from Colab backend
      // No need to enrich separately since Cloudinary URL is stored in Pinecone metadata
      console.log(`✅ Found ${response.count} results`);
      setEnrichedResults(response.results || []);
      
    } catch (err) {
      setError(`Search failed: ${err.message}`);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setSearchResults([]);
    setEnrichedResults([]);
    setError(null);
    setDateFilter('');
    setNamespaceFilter('');
  };

  const formatConfidence = (score) => {
    return (score * 100).toFixed(1);
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    return '#17a2b8';
  };

  return (
    <div className="search-interface">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a8a8a8" />
          </linearGradient>
        </defs>
      </svg>

      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#searchGradient)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Video Search
      </h2>

      {!isConnected && (
        <div className="warning-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Please connect to Colab backend first
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Vectors:</span>
            <span className="stat-value">{stats.total_vectors?.toLocaleString() || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Index:</span>
            <span className="stat-value">{stats.index_name || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Dimension:</span>
            <span className="stat-value">{stats.dimension || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything in your videos... (e.g., 'person walking', 'black bag')"
            disabled={isSearching || !isConnected}
            className="search-input"
          />
          <button
            type="submit"
            disabled={isSearching || !isConnected || !query.trim()}
            className="search-btn"
          >
            {isSearching ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>

        {/* Advanced Options */}
        <div className="advanced-options">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-advanced-btn"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-fields">
              <div className="field-row">
                <div className="field-group">
                  <label>Results Count:</label>
                  <input
                    type="number"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    min="1"
                    max="100"
                    disabled={isSearching}
                    className="number-input"
                  />
                </div>

                <div className="field-group">
                  <label>Similarity Threshold:</label>
                  <input
                    type="number"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    step="0.1"
                    disabled={isSearching}
                    className="number-input"
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Filter by Date:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    disabled={isSearching}
                    className="select-input"
                  >
                    <option value="">All Dates</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label>Filter by Category:</label>
                  <select
                    value={namespaceFilter}
                    onChange={(e) => setNamespaceFilter(e.target.value)}
                    disabled={isSearching}
                    className="select-input"
                  >
                    <option value="">All Categories</option>
                    <option value="backpack">Backpack</option>
                    <option value="bag">Bag</option>
                    <option value="laptop">Laptop</option>
                    <option value="helmet">Helmet</option>
                    <option value="bottle">Bottle</option>
                    <option value="folder">Folder</option>
                    <option value="umbrella">Umbrella</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="reset-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Search Results with Video Players */}
      {enrichedResults.length > 0 && (
        <div className="search-results">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '8px'}}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Found {enrichedResults.length} result{enrichedResults.length !== 1 ? 's' : ''}
          </h3>

          <div className="results-list">
            {enrichedResults.map((result, index) => (
              <VideoResultPlayer key={index} result={result} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Fallback: Old-style results if no Firebase URLs available */}
      {searchResults.length > 0 && enrichedResults.length === 0 && (
        <div className="search-results">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '8px'}}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </h3>

          <div className="results-list">
            {searchResults.map((result, index) => (
              <div key={index} className="result-card">
              <div className="result-header">
                <span className="result-number">#{index + 1}</span>
                <span className="result-timestamp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {result.time_formatted}
                </span>
                  <span 
                    className="result-confidence"
                    style={{ 
                      background: getConfidenceColor(result.similarity_score),
                      color: 'white'
                    }}
                  >
                    {formatConfidence(result.similarity_score)}% match
                  </span>
                </div>

                              <div className="result-body">
                <p className="result-caption">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {result.caption}
                </p>
                
                <div className="result-meta">
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    {result.video_name}
                  </span>
                  {result.video_date && (
                    <span className="meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {result.video_date}
                    </span>
                  )}
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {result.frame_id}
                  </span>
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isSearching && searchResults.length === 0 && enrichedResults.length === 0 && query && (
        <div className="no-results">
          <p>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            No results found for "{query}"
          </p>
          <p className="suggestion">Try:</p>
          <ul>
            <li>Using different search terms</li>
            <li>More general queries</li>
            <li>Lowering the similarity threshold</li>
            <li>Removing filters</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;
