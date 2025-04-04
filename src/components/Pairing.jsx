import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Trophy, Clock, Wind, Users } from "lucide-react";
import { ENDPOINTS, makeApiRequest, API_CONFIG } from '../utils/api';
import { getCarImage } from '../utils/assets';
import { ENV } from '../utils/environment';

const Pairing = ({ selectedDate, category = 'SUPER_GAS' }) => {
  const [raceData, setRaceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    console.log("Pairing component - selectedDate:", selectedDate);
    console.log("Pairing component - category:", category);
    fetchPairings();
  }, [selectedDate, category]);

  const fetchPairings = async () => {
    try {
      console.log(`Fetching pairings data for category: ${category}`);
      const apiResponse = await makeApiRequest(ENDPOINTS.GET_ALL_RESULTS.PAIRING, category, selectedDate);
      
      // Transform API data to match our component's expected format
      const transformedData = apiResponse.msg.flatMap(categoryItem => 
        categoryItem.results.map(racer => ({
          name: racer.driver_name,
          car: getCarImage(racer.lane_choice === "Yes" ? "green" : "red"),
          position: racer.position === "Left" ? 1 : 2,
          team: `Team ${racer.car_number}`,
          points: 0,
          number: racer.car_number,
          time: racer.et,
          speed: racer.rt,
          ladderId: racer.ladder_id,
          pairNum: racer.pair_num,
          lane: racer.position,
          laneChoice: racer.lane_choice
        }))
      );

      console.log(`Received ${transformedData.length} pairing records`);
      setRaceData(transformedData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSwap = async (index) => {
    if (index % 2 === 0 && index + 1 < raceData.length) {
      try {
        setActiveIndex(index);
        const currentPair = [raceData[index], raceData[index + 1]];
        const ladderId = currentPair[0].ladderId;
        const pairNum = currentPair[0].pairNum;

        console.log('Attempting swap with:', {
          ladderId,
          pairNum,
          currentPair
        });
        
        // Updated URL construction with correct endpoint format
        const baseUrl = API_CONFIG.BASE_URL;
        const swapUrl = `${baseUrl}${ENDPOINTS.SWAP_PAIRING}/${ladderId}/${pairNum}`;
        console.log('Swap URL:', swapUrl);

        const response = await fetch(swapUrl, {
          method: "POST",
          headers: ENV.getApiHeaders()
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to swap pairing: ${response.status}`);
        }

        const responseData = await response.json().catch(e => {
          console.log('Response is not JSON:', e);
          return { success: response.ok };
        });
        console.log('Swap Response Data:', responseData);

        if (responseData.error) {
          throw new Error(`API Error: ${responseData.error}`);
        }

        // Update local state to reflect the swap
        const newRaceData = [...raceData];
        // Swap positions and maintain car colors based on lane choice
        newRaceData[index] = {
          ...currentPair[0],
          position: currentPair[1].position,
          lane: currentPair[1].lane,
          car: getCarImage(currentPair[0].laneChoice === "Yes" ? "green" : "red")
        };
        newRaceData[index + 1] = {
          ...currentPair[1],
          position: currentPair[0].position,
          lane: currentPair[0].lane,
          car: getCarImage(currentPair[1].laneChoice === "Yes" ? "green" : "red")
        };
        
        setRaceData(newRaceData);
        setActiveIndex(null);

        // Refresh the pairings from the server to ensure sync
        await fetchPairings();
      } catch (err) {
        console.error('Swap Error:', err);
        console.error('Error Details:', {
          message: err.message,
          stack: err.stack
        });
        setError(`Failed to swap: ${err.message}`);
        setActiveIndex(null);
      }
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-gray-300";
      case 3:
        return "bg-amber-600";
      default:
        return "bg-gray-700";
    }
  };

  const getTeamColor = (team) => {
    switch (team) {
      case "Red Racing":
        return "text-red-500";
      case "Blue Motors":
        return "text-blue-500";
      case "Green Tech":
        return "text-green-500";
      default:
        return "text-white";
    }
  };

  const RacerCard = ({ racer, isActive }) => (
    <div 
      className={`flex-1 bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg flex flex-col items-center border border-gray-700/50 hover:border-gray-500 ${isActive ? 'shadow-lg' : ''}`}
      style={{ backdropFilter: "blur(10px)", minWidth: '300px' }}
    >
      <div className={`absolute top-2 right-2 ${getPositionColor(racer.position)} px-3 py-1 text-white text-sm font-bold rounded-full flex items-center gap-1 shadow-md`}>
        {racer.position === 1 && <Trophy className="w-4 h-4" />}
        #{racer.position}
      </div>
      
      <div className="absolute top-2 left-2 bg-gray-800/80 px-3 py-1 text-white text-sm font-mono rounded-md border border-gray-700/50">
        {racer.number}
      </div>
      
      <div className="relative w-full h-40 mb-6 flex justify-center items-center">
        <img 
          src={racer.car} 
          alt={`${racer.name}'s car`} 
          className="w-48 h-36 object-contain relative z-10"
        />
      </div>
      
      <div className="text-white text-center w-full">
        <div className={`text-xl font-bold ${getTeamColor(racer.team)}`}>{racer.name}</div>
        <div className="text-base text-gray-300 mb-4">{racer.team}</div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-md p-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-base">{racer.time} sec</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-md p-2 text-gray-300">
            <Wind className="w-4 h-4" />
            <span className="text-base">{racer.speed} km/h</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-gray-700/80 text-white text-sm font-bold px-4 py-2 rounded-full shadow-inner flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        {racer.points} pts
      </div>
    </div>
  );

  const PairCard = ({ pair, index, onSwap }) => (
    <div className="relative flex gap-8 items-center mb-12">
      <RacerCard racer={pair[0]} isActive={activeIndex === index * 2} />

      <button
        onClick={onSwap}
        className="bg-red-500/90 text-white rounded-full p-4 shadow-lg z-10 hover:shadow-red-500/50 hover:scale-110 transition-all duration-300"
      >
        <ArrowLeftRight className="w-8 h-8" />
      </button>

      <RacerCard racer={pair[1]} isActive={activeIndex === index * 2 + 1} />
    </div>
  );

  // Group racers into pairs
  const racerPairs = [];
  for (let i = 0; i < raceData.length; i += 2) {
    if (i + 1 < raceData.length) {
      racerPairs.push([raceData[i], raceData[i + 1]]);
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="text-center mb-4 z-10">
        <div className="text-gray-400 text-sm flex items-center justify-center gap-2">
          <Users size={14} />
          <span>Drag to reorder racing matchups</span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl overflow-y-auto overflow-x-hidden px-4 py-2 z-10">
        {loading ? (
          <div className="text-white text-center">Loading pairings...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <AnimatePresence>
            {racerPairs.map((pair, index) => (
              <div key={`${pair[0].number}-${pair[1]?.number || 'bye'}`}>
                <PairCard 
                  pair={pair}
                  index={index}
                  onSwap={() => handleSwap(index * 2)}
                />
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Pairing;