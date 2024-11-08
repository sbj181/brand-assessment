# Brand Health Assessment Tool

A real-time brand analysis tool that aggregates and visualizes data from multiple sources to provide comprehensive brand health metrics.

## Features

- 📊 Overall brand health score calculation
- 🔍 Google Trends analysis with historical data visualization
- 📚 Wikipedia presence and information
- 🌐 DuckDuckGo search results analysis
- 📰 Recent news coverage tracking
- 🔖 Wikidata entity information
- 🌓 Dark/Light mode support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **Charts**: Recharts, react-circular-progressbar
- **Tooltips**: react-tippy
- **API Integration**: Multiple data sources including:
  - Google Trends API
  - Wikipedia API
  - DuckDuckGo API
  - News API
  - Wikidata API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Using npm
npm install
# Using pnpm
pnpm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your API keys as follows:
   ```env
   NEWS_API_KEY=your_news_api_key
   GOOGLE_TRENDS_API_KEY=your_google_trends_api_key
   # Add any other required API keys
   ```

4. Run the development server:
   ```bash
   # Using npm
   npm run dev

   # Using pnpm
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a brand name, term, or URL in the search field
2. Click "Analyze" to generate a comprehensive brand health report
3. View various metrics including:
   - Overall brand health score
   - Component scores breakdown
   - Historical search trends
   - Wikipedia information
   - News coverage
   - Search engine presence
   - Wikidata information

## API Endpoints

### POST `/api/brand-health`

Analyzes brand health based on provided term.

#### Request Body
```json
{
  "scores": {
    "overall": number,
    "searchTrend": number,
    "wikipedia": number,
    "searchResults": number,
    "newsCoverage": number,
    "wikidata": number
  },
  "data": {
    "trends": object,
    "wiki": object,
    "ddg": object,
    "news": object,
    "wikidata": object
  }
}
```


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

Copyright (c) 2024 The Grovery

## Acknowledgments

- Built with Next.js
- Styled with Tailwind CSS
- Charts powered by Recharts
- Progress visualization by react-circular-progressbar
- Tooltips by react-tippy