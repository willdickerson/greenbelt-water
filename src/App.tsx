import React, { useEffect, useState } from 'react';
import { fetchUSGSStats, getStatsForDay } from './usgs';

const SITE_IDS = [
  '08155200', // Barton Ck at SH 71
  '08155240', // Barton Ck at Lost Ck Blvd
  '08155300', // Barton Ck at Loop 360
  '08155400'  // Barton Ck abv Barton Spgs
];

function WaterLevelCard({ level, stats }) {
  if (!level || !stats?.currentStats) return null;
  
  const currentLevel = parseFloat(level.value);
  const { median } = stats.currentStats;
  const status = currentLevel < median ? 'Low' : 'High';
  const statusColor = currentLevel < median ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-medium text-gray-900 mb-3">
        <a 
          href={`https://waterdata.usgs.gov/monitoring-location/${level.siteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 hover:underline"
        >
          {level.siteName}
        </a>
      </h3>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">
          {currentLevel.toFixed(1)}'
        </span>
        <span className={`text-sm font-medium ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Updated {new Date(level.dateTime).toLocaleString()}
      </div>
    </div>
  );
}

function App() {
  const [waterLevels, setWaterLevels] = useState([]);
  const [siteStats, setSiteStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaterData = async () => {
      try {
        const response = await fetch(
          'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=' + 
          SITE_IDS.join(',') + '&parameterCd=00065'
        );
        const data = await response.json();
        
        const timeSeries = data.value.timeSeries;
        const levels = timeSeries.map(series => ({
          value: series.values[0].value[0].value,
          dateTime: series.values[0].value[0].dateTime,
          siteName: series.sourceInfo.siteName,
          siteId: series.sourceInfo.siteCode[0].value
        }));
        
        setWaterLevels(levels);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching water levels:', error);
        setError('Unable to load water levels');
        setIsLoading(false);
      }
    };

    const fetchAllUSGSStats = async () => {
      try {
        const statsPromises = SITE_IDS.map(siteId => fetchUSGSStats(siteId));
        const statsResults = await Promise.all(statsPromises);
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        const newSiteStats = {};
        SITE_IDS.forEach((siteId, index) => {
          const data = statsResults[index];
          newSiteStats[siteId] = {
            currentStats: getStatsForDay(data, currentMonth, currentDay)
          };
        });
        
        setSiteStats(newSiteStats);
      } catch (error) {
        console.error('Error fetching USGS stats:', error);
      }
    };

    fetchWaterData();
    fetchAllUSGSStats();

    const interval = setInterval(fetchWaterData, 900000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading water levels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          Barton Creek Water Levels
        </h1>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {waterLevels.map(level => (
            <WaterLevelCard
              key={level.siteId}
              level={level}
              stats={siteStats[level.siteId]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;