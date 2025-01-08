export interface USGSStats {
  median: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
}

export interface ParsedUSGSData {
  [key: string]: {
    month_nu: number;
    day_nu: number;
    p50_va: number;
    min_va: number;
    max_va: number;
    p25_va: number;
    p75_va: number;
  };
}

export const parseUSGSStats = (dataString: string): ParsedUSGSData => {
  const lines = dataString.split('\n')
    .filter(line => line && !line.startsWith('#'));
    
  // Find the header line with the actual column names
  const headerIndex = lines.findIndex(line => line.includes('agency_cd'));
  if (headerIndex === -1) {
    throw new Error('Invalid USGS data format: missing headers');
  }
  
  const headers = lines[headerIndex].split('\t');
  const data: ParsedUSGSData = {};
  
  // Start processing from the line after headers and data type line
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split('\t');
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        row[header] = isNaN(Number(value)) ? value : Number(value);
      });
      
      // Only include the row if it has valid numeric values
      if (!isNaN(row.month_nu) && !isNaN(row.day_nu)) {
        const key = `${row.month_nu.toString().padStart(2, '0')}-${row.day_nu.toString().padStart(2, '0')}`;
        data[key] = {
          month_nu: row.month_nu,
          day_nu: row.day_nu,
          p50_va: row.p50_va,
          min_va: row.min_va,
          max_va: row.max_va,
          p25_va: row.p25_va,
          p75_va: row.p75_va
        };
      }
    }
  }
  
  return data;
};

export const getStatsForDay = (data: ParsedUSGSData, month: number, day: number): USGSStats | null => {
  const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const row = data[key];
  
  if (!row) return null;
  
  return {
    median: row.p50_va,
    min: row.min_va,
    max: row.max_va,
    p25: row.p25_va,
    p75: row.p75_va
  };
};

export const fetchUSGSStats = async (siteId: string): Promise<ParsedUSGSData> => {
  const url = `https://waterservices.usgs.gov/nwis/stat/?format=rdb&sites=${siteId}&statReportType=daily&statTypeCd=all&parameterCd=00065`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    return parseUSGSStats(data);
  } catch (error) {
    console.error('Error fetching USGS stats:', error);
    throw error;
  }
};
