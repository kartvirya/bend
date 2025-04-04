import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, ChevronRight } from 'lucide-react';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, makeApiRequest } from '../utils/api';

const Ladder = ({ category = 'SUPER_GAS', selectedDate }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeTab, setActiveTab] = useState("Q1");
  const [namesData, setNamesData] = useState({});

  // Get today's date in YYYY-MM-DD format as default
  const defaultDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        setLoading(true);
        const displayDate = selectedDate || defaultDate;
        const apiUrl = buildApiUrl(ENDPOINTS.GET_ALL_RESULTS.LADDER, category, displayDate);
        console.log("Fetching ladder data from:", apiUrl);
        const response = await makeApiRequest(ENDPOINTS.GET_ALL_RESULTS.LADDER, category, displayDate);
        
        // Process the API data into the format needed for the bracket
        const processedRounds = processLadderData(response.msg);
        console.log("Processed rounds:", processedRounds);
        setRounds(processedRounds);
      } catch (err) {
        console.error('Error fetching rounds:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();

    // Calculate container width based on rounds
    const calculateWidth = () => {
      const roundWidth = 320; // Width of each round column
      const spacing = 128; // Space between rounds (32px * 4)
      const padding = 48; // Container padding (24px * 2)
      const totalWidth = Math.max((rounds.length * roundWidth) + ((rounds.length - 1) * spacing) + padding, 800);
      setContainerWidth(Math.max(totalWidth, window.innerWidth));
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);

    return () => window.removeEventListener('resize', calculateWidth);
  }, [rounds.length, category, selectedDate]);

  // Process the ladder data from API to match the component's required format
  const processLadderData = (apiData) => {
    // Sort by round number to ensure proper ordering (handle special case for Round 100)
    const sortedData = [...apiData].sort((a, b) => {
      // Special case for finals (Round 100)
      if (a.Round === "100") return Infinity;
      if (b.Round === "100") return -Infinity;
      return parseInt(a.Round) - parseInt(b.Round);
    });
    
    // Map the API data into our rounds format
    return sortedData.map(roundData => {
      const results = [...roundData.results];
      const matches = [];
      
      // Handle winner round (Round 100) specially
      if (roundData.Round === "100") {
        if (results.length > 0) {
          // Create a single entry for the winner
          matches.push({
            player1: {
              name: results[0].driver_name,
              id: results[0].car_number,
              score: results[0].et,
              rt: results[0].rt,
              lane_choice: results[0].lane_choice,
              raw: results[0]
            },
            player2: {
              name: "WINNER",
              id: "-",
              score: "-",
              rt: "-",
              lane_choice: "-"
            }
          });
        }
      } else {
        // For all other rounds, pair players in matches
        for (let i = 0; i < results.length; i += 2) {
          const player1 = results[i];
          const player2 = i + 1 < results.length ? results[i + 1] : { car_number: "BYE", driver_name: "BYE", rt: "0", et: "0" };
          
          matches.push({
            player1: {
              name: player1.driver_name || "BYE",
              id: player1.car_number,
              score: player1.et,
              rt: player1.rt,
              lane_choice: player1.lane_choice,
              raw: player1 // Store the full raw data
            },
            player2: {
              name: player2.driver_name || "BYE",
              id: player2.car_number,
              score: player2.et,
              rt: player2.rt,
              lane_choice: player2.lane_choice,
              raw: player2 // Store the full raw data
            }
          });
        }
      }
      
      // Store the original round information
      return {
        matches,
        roundInfo: {
          id: roundData.id,
          category: roundData.Category,
          round: roundData.Round,
          positions: roundData.Positions,
          qualifying_mode: roundData.Qualifying_Mode
        }
      };
    }).filter(round => round.matches.length > 0).map(round => round.matches); // Filter out empty rounds and extract matches
  };

  // Ensure we correctly identify when a round is the final round
  const getFinalRoundText = (roundIndex, totalRounds) => {
    if (roundIndex === totalRounds - 1) {
      // Only show "Winner" if there's more than one round
      return totalRounds > 1 ? "Winner" : "Round 1";
    }
    return `Round ${roundIndex + 1}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const displayDate = selectedDate || defaultDate;
        const response = await makeApiRequest(ENDPOINTS.GET_ALL_RESULTS.RESULTS, category, displayDate);

        const formattedData = response.msg.reduce((acc, session) => {
          acc[`Q${session.rnd}`] = session.results.map(result => ({
            id: result.id,
            main_id: result.main_id,
            timestamp: result.timestamp,
            car_number: result.car_number,
            name: result.name,
            dial_in: result.dial_in,
            rt: result.rt,
            ft60: result.ft60,
            ft330: result.ft330,
            ft660: result.ft660,
            mph660: result.mph660,
            ft1000: result.ft1000,
            mph1000: result.mph1000,
            ft1320: result.ft1320,
            mph1320: result.mph1320,
            mov: result.mov,
            dov: result.dov,
            win: result.win,
            flag: result.flag,
            position: result.position
          }));
          return acc;
        }, {});

        setNamesData(formattedData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, selectedDate]);

  if (loading) {
    return (
      <div className="m-4 font-sans bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-cyan-400">Loading tournament data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 font-sans bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg p-8">
        <div className="text-red-400 text-center">
          <p>Error loading tournament data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Skip rendering if no rounds data
  if (!rounds || rounds.length === 0) {
    return (
      <div className="m-4 font-sans bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg p-8">
        <div className="text-gray-400 text-center">
          <p>No tournament data available</p>
        </div>
      </div>
    );
  }

  const getMatchSpacing = (roundIndex) => {
    const baseSpacing = 200;
    const multiplier = Math.pow(2, roundIndex);
    return baseSpacing * multiplier;
  };

  const getMatchOffset = (roundIndex, matchIndex, totalMatches) => {
    // Get the spacing for this round
    const spacing = getMatchSpacing(roundIndex);
    
    // Calculate the total height needed for all matches in this round
    const totalHeight = spacing * (totalMatches - 1);
    
    // Calculate the position based on the match index
    const matchPosition = matchIndex * spacing;
    
    // For round 1, use a smaller offset to bring everything up
    const centerOffset = roundIndex === 0 
      ? 100 // Fixed smaller offset for first round
      : (window.innerHeight - totalHeight) / 6; // Reduced offset for subsequent rounds
      
    return matchPosition + centerOffset;
  };

  const ensureConsistentVerticalAlignment = (roundIndex, matchIndex, totalMatches) => {
    if (roundIndex === 0) {
      // First round positioning
      return getMatchOffset(roundIndex, matchIndex, totalMatches);
    } else {
      // For all subsequent rounds, position based on the connected matches from previous round
      const matchesPerRound = Math.pow(2, rounds.length - roundIndex - 1);
      const previousRoundMatchIndex = matchIndex * 2;
      
      // If we're at the last round before the winner, return the center position
      if (roundIndex === rounds.length - 2 && rounds.length > 1) {
        const firstMatchPos = ensureConsistentVerticalAlignment(roundIndex - 1, 0, rounds[roundIndex - 1].length);
        
        // If there's only one match in the previous round, center with it
        if (rounds[roundIndex - 1].length === 1) {
          return firstMatchPos;
        }
        
        // For the last match in previous round
        const lastMatchPos = ensureConsistentVerticalAlignment(
          roundIndex - 1, 
          rounds[roundIndex - 1].length - 1, 
          rounds[roundIndex - 1].length
        );
        
        // Return the middle point between first and last match
        return (firstMatchPos + lastMatchPos) / 2;
      }
      
      // For the winner round
      if (roundIndex === rounds.length - 1 && rounds.length > 1) {
        // Get the position of the finals match
        const finalsPosition = ensureConsistentVerticalAlignment(
          roundIndex - 1, 
          0, 
          rounds[roundIndex - 1].length
        );
        return finalsPosition;
      }
      
      // For other rounds, average the positions of the two connected matches in previous round
      if (previousRoundMatchIndex < rounds[roundIndex - 1].length) {
        const position1 = ensureConsistentVerticalAlignment(
          roundIndex - 1, 
          previousRoundMatchIndex, 
          rounds[roundIndex - 1].length
        );
        
        // If there's a second connected match, average the positions
        if (previousRoundMatchIndex + 1 < rounds[roundIndex - 1].length) {
          const position2 = ensureConsistentVerticalAlignment(
            roundIndex - 1, 
            previousRoundMatchIndex + 1, 
            rounds[roundIndex - 1].length
          );
          return (position1 + position2) / 2;
        }
        
        // If only one connected match, use its position
        return position1;
      }
      
      // Fallback to regular positioning
      return getMatchOffset(roundIndex, matchIndex, totalMatches);
    }
  };

  // Update the connector height calculation for proper line connections
  const getConnectorHeight = (roundIndex, matchIndex) => {
    // Make sure we have the next round
    if (roundIndex < rounds.length - 1) {
      // If we're connecting adjacent matches to form a single bracket in the next round
      if (matchIndex % 2 === 0 && matchIndex < rounds[roundIndex].length - 1) {
        const spacing = getMatchSpacing(roundIndex);
        
        // If we're in the semifinal round connecting to the final
        if (roundIndex === rounds.length - 3 && rounds.length > 2) {
          const firstMatchPos = ensureConsistentVerticalAlignment(roundIndex, 0, rounds[roundIndex].length);
          const secondMatchPos = ensureConsistentVerticalAlignment(roundIndex, 1, rounds[roundIndex].length);
          
          // Calculate the height based on match positions
          if (rounds[roundIndex].length > 1) {
            return Math.abs(secondMatchPos - firstMatchPos);
          }
        }
        
        return spacing;
      }
    }
    
    return 0;
  };

  const tableHeaders = [
    "id", "main_id", "timestamp", "car_number", "name", "dial_in", "rt", 
    "ft60", "ft330", "ft660", "mph660", "ft1000", "mph1000", "ft1320", 
    "mph1320", "mov", "dov", "win", "flag", "position"
  ];

  return (
    <div className="m-2 min-w-[320px] font-sans bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg h-[calc(100vh-5rem)] overflow-hidden">
      <div className="relative h-full overflow-x-auto overflow-y-auto custom-scrollbar">
        <div 
          className="absolute inset-0 flex space-x-32 p-4 pt-2"
          style={{ width: `${containerWidth}px`, minHeight: '100%' }}
        >
          {rounds.map((round, roundIndex) => {
            // Skip rendering the winner round if there's only one round
            if (rounds.length === 1 && roundIndex === rounds.length - 1) {
              return null;
            }
            return (
              <div 
                key={roundIndex}
                className="relative flex-shrink-0"
                style={{ width: '280px' }}
              >
                <div className="text-center mb-4 sticky top-0 z-10 bg-gradient-to-br from-gray-900 to-gray-950 pt-1 pb-2">
                  <span className="px-4 py-1 bg-gray-800 rounded-full text-cyan-400 text-sm font-semibold inline-flex items-center shadow-lg">
                    {getFinalRoundText(roundIndex, rounds.length)}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>

                {round.map((match, matchIndex) => {
                  // For Round 4 (winner), we need to calculate the exact position
                  // to align with the center point between the finalists in Round 3
                  let positionTop;
                  
                  if (roundIndex === rounds.length - 1) {
                    // For the winner card (Round 4), get position from the previous round
                    const prevRoundMatchTop = ensureConsistentVerticalAlignment(roundIndex - 1, 0, rounds[roundIndex - 1].length);
                    
                    // Center the winner card with the previous round match
                    positionTop = prevRoundMatchTop;
                    
                    // Adjust to align with the visual center of the previous match
                    // This offset helps account for the bracket heights
                    const verticalAdjustment = 0;
                    positionTop += verticalAdjustment;
                  } else {
                    // Normal positioning for other rounds
                    positionTop = ensureConsistentVerticalAlignment(roundIndex, matchIndex, round.length);
                  }
                  
                  return (
                    <motion.div
                      key={matchIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: matchIndex * 0.1 }}
                      className={`absolute left-0 right-0 ${
                        roundIndex === rounds.length - 1 ? 'winner-card' : ''
                      }`}
                      style={{
                        top: positionTop
                      }}
                    >
                      {/* Connection lines for all rounds including winner */}
                      {roundIndex < rounds.length && (
                        <>
                          {/* Horizontal connector line from each match to the next round */}
                          {roundIndex < rounds.length - 1 && (
                            <div 
                              className="absolute -right-16 top-[60px] w-16 h-[2px] z-10"
                              style={{
                                background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
                                boxShadow: '0 0 10px rgba(6,182,212,0.2)',
                              }}
                            />
                          )}
                          
                          {/* Special connection for last round to Winner */}
                          {roundIndex === rounds.length - 2 && matchIndex === 0 && rounds.length > 1 && (
                            <div className="absolute -right-[10px] z-20">
                              {/* Main horizontal connecting line */}
                              <div 
                                className="absolute top-[60px] w-32 left-[-10px] h-[2px] winner-connector"
                                style={{
                                  background: 'linear-gradient(90deg, #06b6d4 0%, #eab308 100%)',
                                  boxShadow: '0 0 10px rgba(6,182,212,0.3)',
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Vertical connector lines between adjacent matches */}
                          {matchIndex % 2 === 0 && matchIndex < round.length - 1 && roundIndex < rounds.length - 1 && (
                            <div 
                              className="absolute -right-16 w-[2px] z-5"
                              style={{
                                top: '60px',
                                height: getConnectorHeight(roundIndex, matchIndex),
                                background: 'linear-gradient(180deg, #06b6d4 0%, #0ea5e9 100%)',
                                boxShadow: '0 0 10px rgba(6,182,212,0.2)'
                              }}
                            >
                              {/* Horizontal connector to the next round's match */}
                              {rounds[roundIndex + 1] && rounds[roundIndex + 1][Math.floor(matchIndex / 2)] && (
                                <div
                                  className="absolute -left-0 w-16 h-[2px] z-10"
                                  style={{
                                    top: getConnectorHeight(roundIndex, matchIndex) / 2,
                                    background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
                                    boxShadow: '0 0 10px rgba(6,182,212,0.2)',
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <div className={`backdrop-blur-sm rounded-xl overflow-hidden border shadow-[0_4px_20px_rgba(6,182,212,0.15)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.25)] transition-all duration-300 ${
                        roundIndex === 3 
                          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/95 border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-border-pulse' 
                          : 'bg-gray-800/90 border-gray-700'
                      }`} style={{ width: '280px' }}>
                        {/* Special rendering for Winner (Round 4) */}
                        {roundIndex === rounds.length - 1 ? (
                          <div className="flex flex-col items-center justify-center h-full py-3 px-4 relative overflow-hidden" style={{ height: '120px' }}>
                            {/* Background effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20"></div>
                            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-yellow-500/10 blur-2xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-cyan-500/10 blur-2xl"></div>
                            
                            {/* Moving particles */}
                            <div className="absolute inset-0 opacity-30 overflow-hidden">
                              <div className="absolute top-[10%] left-[20%] w-1 h-1 rounded-full bg-yellow-300 animate-float-1"></div>
                              <div className="absolute top-[30%] left-[80%] w-1 h-1 rounded-full bg-yellow-300 animate-float-2"></div>
                              <div className="absolute top-[70%] left-[10%] w-1 h-1 rounded-full bg-cyan-300 animate-float-3"></div>
                              <div className="absolute top-[40%] left-[60%] w-1 h-1 rounded-full bg-cyan-300 animate-float-4"></div>
                            </div>
                            
                            {/* Trophy icon in background */}
                            <div className="absolute right-3 bottom-3 opacity-10">
                              <Trophy className="w-10 h-10 text-yellow-400" />
                            </div>
                            
                            {/* Content with z-index to appear above effects */}
                            <div className="relative z-10">
                              <div className="text-center mb-1">
                                <span className="font-bold text-cyan-300 text-md">{match.player1.name}</span>
                              </div>
                              <div className="text-center mb-2">
                                <span className="text-[10px] text-gray-400">Car No.: {match.player1.id}</span>
                              </div>
                              <div className="text-center mb-3">
                                <motion.span 
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                  transition={{ 
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 px-3 py-1 font-bold rounded-full text-xs inline-flex items-center shadow-lg"
                                >
                                  <Trophy className="w-3 h-3 mr-1" /> WINNER
                                </motion.span>
                              </div>
                              <div className="text-center flex flex-row gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 text-[10px]">ET:</span>
                                  <span className="text-cyan-400 font-semibold text-xs bg-cyan-900/30 px-2 py-0.5 rounded-full border border-cyan-800/30">{match.player1.score}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 text-[10px]">RT:</span>
                                  <span className="text-amber-400 font-semibold text-[10px] bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-800/30">{match.player1.rt}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Regular match rendering for Rounds 1-3
                          <div className="flex flex-col h-full" style={{ minHeight: '120px', height: '120px' }}>
                            {[match.player1, match.player2].map((player, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                className={`h-[60px] px-3 py-2 flex items-center ${index === 0 ? 'border-b border-gray-700' : ''} ${
                                  parseFloat(player.score) > parseFloat(match[index === 0 ? 'player2' : 'player1'].score)
                                    ? 'bg-gradient-to-r from-cyan-500/10 to-transparent'
                                    : ''
                                }`}
                              >
                                <div className={`flex items-center justify-between w-full ${player.name === "BYE" ? "opacity-50" : ""}`}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold text-white text-xs">{player.name}</span>
                                      {player.lane_choice === "Yes" && 
                                        <span className="bg-blue-500/30 text-blue-300 text-xs px-1 rounded text-[10px]">LC</span>
                                      }
                                    </div>
                                    <span className="text-[10px] text-gray-400">Car No.: {player.id || '-'}</span>
                                  </div>
                                  <div className="text-right flex flex-col gap-[2px]">
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-gray-400 text-[10px]">ET:</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        parseFloat(player.score) > parseFloat(match[index === 0 ? 'player2' : 'player1'].score)
                                          ? 'bg-cyan-500/20 text-cyan-400'
                                          : 'text-gray-400'
                                      }`}>
                                        {player.score !== "0" ? player.score : "-"}
                                      </span>
                                    </div>
                                    
                                    {player.rt && player.rt !== "0" && (
                                      <div className="flex items-center justify-end gap-1">
                                        <span className="text-gray-400 text-[10px]">RT:</span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-400">
                                          {player.rt}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-4 text-white bg-gray-900 rounded-lg shadow-lg mt-4 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 p-2 border-b border-gray-700 overflow-x-auto custom-scrollbar">
          {Object.keys(namesData).map((quarter) => (
            <button
              key={quarter}
              onClick={() => setActiveTab(quarter)}
              className={`px-8 py-4 rounded-t-lg font-semibold transition-all duration-300 ${
                activeTab === quarter ? 'bg-custom-pink text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } whitespace-nowrap flex-shrink-0`}
            >
              {quarter}
            </button>
          ))}
        </div>

        {/* Mobile indicator for horizontal scrolling */}
        <div className="md:hidden text-gray-400 text-sm mt-2 text-center">
          <span>← Swipe to view all data →</span>
        </div>

        {/* Table Container */}
        <div className="mt-4 rounded-lg shadow-lg bg-gray-800 relative overflow-hidden">
          {/* Scrollbar Indicator for Mobile */}
          <div className="h-1 w-full bg-gray-700 absolute bottom-0 left-0 md:hidden">
            <div className="h-full bg-custom-pink w-1/4 rounded-full"></div>
          </div>
          
          {/* Scrollable Table Wrapper */}
          <div className="custom-scrollbar overflow-x-auto overflow-y-auto max-h-[50vh] border border-gray-700 rounded-lg" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="min-w-full border-collapse table-auto">
              <thead className="sticky top-0 bg-gray-800 z-10">
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th
                      key={index}
                      className="border border-gray-700 p-3 text-white font-semibold text-sm uppercase tracking-wider whitespace-nowrap bg-gray-800"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {namesData[activeTab]?.map((row, index) => (
                  <tr
                    key={index}
                    className={`text-center transition-all duration-200 ${
                      index % 2 === 0 ? "bg-gray-700" : "bg-gray-600"
                    } hover:bg-gray-500`}
                  >
                    {Object.values(row).map((value, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-gray-700 p-3 text-sm whitespace-nowrap"
                      >
                        {cellIndex === tableHeaders.indexOf("position") && typeof value === "string"
                          ? value.toLowerCase() === "left" 
                            ? "L" 
                            : value.toLowerCase() === "right" 
                              ? "R" 
                              : value
                          : value !== null && value !== undefined 
                            ? value.toString() 
                            : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSS for custom scrollbars */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
          display: block;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a2235;
          border-radius: 0;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 0;
          border: 1px solid #1a2235;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1a2235;
        }
        
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #4b5563 #1a2235;
          -webkit-overflow-scrolling: touch;
        }

        /* Position adjustment for winner card */
        .winner-card {
          transform: translateY(-50%);
        }

        /* Mobile device styles */
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 7px;
            height: 7px;
          }
          
          .custom-scrollbar {
            scrollbar-width: thin;
            overflow: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          
          table {
            min-width: 800px;
          }
        }

        /* Animation for winner bracket border */
        @keyframes border-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
            border-color: rgba(234, 179, 8, 0.3);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.2);
            border-color: rgba(234, 179, 8, 0.6);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
            border-color: rgba(234, 179, 8, 0.3);
          }
        }

        .animate-border-pulse {
          animation: border-pulse 2s infinite;
        }
        
        /* Animations for connecting line effects */
        @keyframes flow-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(112px);
          }
        }
        
        @keyframes flow-right-slow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(112px);
          }
        }
        
        @keyframes pulse-slow {
          0% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }
        
        @keyframes pulse-slower {
          0% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }
        
        .animate-flow-right {
          animation: flow-right 2s infinite linear;
        }
        
        .animate-flow-right-slow {
          animation: flow-right-slow 3s infinite linear;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 4s infinite ease-in-out;
        }
        
        .shadow-glow {
          box-shadow: 0 0 8px currentColor;
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 4px currentColor);
        }
        
        /* Animations for floating particles */
        @keyframes float-1 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(8px, 10px); opacity: 1; }
          50% { transform: translate(16px, 0px); opacity: 0.6; }
          75% { transform: translate(8px, -10px); opacity: 1; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        
        @keyframes float-2 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(-10px, 8px); opacity: 1; }
          50% { transform: translate(-16px, 0px); opacity: 0.6; }
          75% { transform: translate(-10px, -8px); opacity: 1; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        
        @keyframes float-3 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          33% { transform: translate(12px, -8px); opacity: 1; }
          66% { transform: translate(-12px, -8px); opacity: 0.8; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        
        @keyframes float-4 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          33% { transform: translate(-10px, 10px); opacity: 1; }
          66% { transform: translate(10px, 10px); opacity: 0.8; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        
        .animate-float-1 {
          animation: float-1 8s infinite ease-in-out;
        }
        
        .animate-float-2 {
          animation: float-2 10s infinite ease-in-out;
        }
        
        .animate-float-3 {
          animation: float-3 9s infinite ease-in-out;
        }
        
        .animate-float-4 {
          animation: float-4 12s infinite ease-in-out;
        }
        
        /* Winner connector animation */
        @keyframes winner-glow {
          0% { box-shadow: 0 0 5px rgba(6,182,212,0.3); }
          50% { box-shadow: 0 0 10px rgba(234,179,8,0.5); }
          100% { box-shadow: 0 0 5px rgba(6,182,212,0.3); }
        }
        
        .winner-connector {
          animation: winner-glow 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Ladder;