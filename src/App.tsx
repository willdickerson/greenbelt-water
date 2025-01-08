import { useEffect, useState } from 'react';
import { fetchUSGSStats, getStatsForDay, USGSStats } from './usgs';

const SITE_IDS = [
  '08155200', // Barton Ck at SH 71
  '08155240', // Barton Ck at Lost Ck Blvd
  '08155300', // Barton Ck at Loop 360
  '08155400'  // Barton Ck abv Barton Spgs
];

type WaterLevel = {
  value: string;
  dateTime: string;
  siteName: string;
  siteId: string;
};

type SiteStatsMap = {
  [key: string]: { currentStats: USGSStats | null };
};

function WaterLevelCard({ level, stats }: { level: WaterLevel; stats: { currentStats: USGSStats | null } | undefined }) {
  if (!level || !stats?.currentStats) return null;

  const currentLevel = parseFloat(level.value);
  const { median } = stats.currentStats;
  const status = currentLevel < median ? 'Low' : 'High';

  return (
    <div className="bg-[#faf3e0] border border-[#c5a898] rounded-lg p-6">
      <h3 className="font-medium text-[#524343] mb-3">
        <a 
          href={`https://waterdata.usgs.gov/monitoring-location/${level.siteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#96624e]"
        >
          {level.siteName}
        </a>
      </h3>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-[#524343]">
          {currentLevel.toFixed(1)}'
        </span>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          currentLevel < median 
            ? 'bg-[#e6c9c9] text-[#96624e]' 
            : 'bg-[#c5dedd] text-[#2c4a52]'
        }`}>
          {status}
        </div>
      </div>
      <div className="text-xs text-[#96624e] mt-3">
        Updated {new Date(level.dateTime).toLocaleString()}
      </div>
    </div>
  );
}

function App() {
  const [waterLevels, setWaterLevels] = useState<WaterLevel[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaterData = async () => {
      try {
        const response = await fetch(
          'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=' + 
          SITE_IDS.join(',') + '&parameterCd=00065'
        );
        const data = await response.json();
        
        const timeSeries = data.value.timeSeries;
        const levels = timeSeries.map((series: any) => ({
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
        
        const newSiteStats: SiteStatsMap = {};
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

    const interval = setInterval(() => {
      fetchWaterData();
      fetchAllUSGSStats();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const allReadingsBelowAverage = waterLevels.every(level => {
    const stats = siteStats[level.siteId]?.currentStats;
    if (!stats) return false;
    return parseFloat(level.value) < stats.median;
  });

  return (
    <div className="min-h-screen bg-[#faf3e0] py-8 px-4">
      <header className="py-4 mb-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-semibold text-center text-[#524343]">Barton Creek Water Levels</h1>
        </div>
      </header>
      <div className="max-w-6xl mx-auto">
        <div className={`mb-6 p-4 rounded-lg text-center text-sm font-medium border border-[#c5a898] ${
          allReadingsBelowAverage 
            ? 'bg-[#e6c9c9] text-[#96624e]'
            : 'bg-[#c5dedd] text-[#2c4a52]'
        }`}>
          Water levels are currently {allReadingsBelowAverage ? 'below' : 'above'} historical averages
          <span className="block text-xs mt-1 opacity-75">
            Last updated: {
              waterLevels.length > 0 
                ? new Date(Math.max(...waterLevels.map(l => new Date(l.dateTime).getTime()))).toLocaleString()
                : 'Loading...'
            }
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-[#96624e]">Loading water levels...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-[#96624e]">{error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {waterLevels.map(level => (
              <WaterLevelCard 
                key={level.siteId} 
                level={level} 
                stats={siteStats[level.siteId]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;