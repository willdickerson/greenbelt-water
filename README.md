# Barton Creek Water Levels

A real-time dashboard showing water levels at various points along Barton Creek in Austin, Texas. The app compares current water levels with historical medians to help visualize if water levels are higher or lower than usual.

## Features

- Real-time water level data from USGS monitoring stations
- Historical comparisons for each monitoring point
- Automatic updates every minute
- Mobile-responsive design
- Color-coded indicators for high/low water levels

## Data Sources

Data is sourced from the USGS Water Services API, specifically from the following monitoring stations:
- Barton Creek at SH 71 (08155200)
- Barton Creek at Lost Creek Blvd (08155240)
- Barton Creek at Loop 360 (08155300)
- Barton Creek above Barton Springs (08155400)

## Development

This project uses:
- React 18
- TypeScript
- Vite
- Tailwind CSS

To run locally:

```bash
npm install
npm run dev
```

## Deployment

Build the project:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.
