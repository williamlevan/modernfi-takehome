# Treasury Yield Curve Visualizer

A web application for visualizing real-time US Treasury yield curves and amanaging hypothetical bond allocation orders.

### Assumptions
1. Yield data meaning: "Treasury yields" refers to the US Treasury/Federal Reserve's published yield curve rates by maturity (1M, 3M, 6M, 1Y, ... 30Y). This app visualizes a singles day's curve with the most recent available data.
2. Data source reliability: The data presented by the US Treasury here [https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value=2026&type=daily_treasury_yield_curve&utm_source=chatgpt.com] seems to match the data provided by the FRED API. For live data, I chose to pull data from the FRED API. If the upstream source is temporarily unavailable, the API returns a clear error and the UI shows an error state.
3. Order definition: An "order" in this application is a symbolic intent to allocate liquidity to a chosen maturity for a user-provided dollar amount at a specific rate (provided from the yield rate for the most recent data upon submission). This value is stored as <rate_at_submission>.
4. Single-user / no auth: The app assumes a single local user and does not provide authentication. "User's historical orders" means the historical orders created in the running local instance.
5. Currency: Amounts are assumed to be USD. No multi-currency handling is provided and amounts are stored as <amount_in_cents>.

### In Scope
- Pulling up-to-date treasury yield data from the Federal Reserve Economic Data (FRED) API.
- D3 chart showing treasury yield curve with terms on x-axis and rates on y-axis for most recent information. This is powered by the yield data fetching and the GET /api/yields endpoint.
- Order submission via the POST /api/orders endpoint with term selection, amount input, and rate display
- Order history via GET /api/orders with pagination (10 orders per page)
- Idempotency - POST requests use Idempotency-Key header to prevent duplicate orders
- Simple rate limiting applied to /api/orders and /api/yields endpoints
- Error handling including error modals, snackbar notifications and error logging. Some of these could have fallen in the 'Out of Scope' section, but graceful failure is important.
- Simple in-memory cache for yields data as fallback when FRED API fails, updated whenever a successful API request goes through. Same as the previous point, this may be overkill and is truly just a band-aid in the absence of a production-grade database infrastructure.
- Very simple and responsive UI with SCSS styling and component-based architecture.

### Out of Scope / Tradeoffs
- Due to time-constraint and simplicity of a locally-run monorepo, no databasing, data persistence, or data backup/recovery is in place. Instead, I rely on a simple in-memory storage.
- There is also no user management or auth included for the same reasons as similarly to the point above, I felt it was out of scope.
- Order management (selling orders, order status, advanced order filtering) are also not included.
- I implemented a very simple and rudimentary UI as I felt the important and critical functionality existed in the API and data management.
- Other stuff such as accessibility, mobile-first design, rigorous testing, CI/CD, monitoring, WebSocket-powered real-time updates, dynamic charts with zooming as well as historical chart data were all deemed out of scope for this application.

### Looking Ahead
- See what was not completed above in Out of Scope. These are the things that I would prioritize in pushing a product like this to production improving/widening its features.

### Technical Stack
**Frontend**: Next.js, React, TypeScript, D3.js, SCSS  
**Backend**: Express.js, Node.js, TypeScript, Axios  
**Monorepo**: npm workspaces  
**External APIs**: FRED API (Federal Reserve Economic Data)  
**Development**: TypeScript, nodemon, concurrently

### TO RUN

### Prerequisites
- Node.js & npm
- A FRED API key (get one free at https://fred.stlouisfed.org/docs/api/api_key.html)
    - Alternatively, I can email you mine if you would prefer

### Setup
1. **Install dependencies** (from the root directory)
    npm install
2. **Configure environment variables**
    Create a `.env` file in `packages/api/` with your FRED API key:
    FRED_API_KEY=your_fred_api_key_here
    PORT=3001  # Optional, defaults to 3001
    NODE_ENV=development #Optional
3. **Build shared workspace

### Running the Application

**Option 1: Run everything together** (recommended):
    npm run dev
This will start:
- Shared package (TypeScript compilation)
- API server on `http://localhost:3001`
- Web application on `http://localhost:3000`

**Option 2: Run packages individually:**
# Terminal 1 - API server
npm run dev:api

# Terminal 2 - Web application
npm run dev:web

### Testing the Application

1. **Open the web application**: Navigate to `http://localhost:3000` in your browser

2. **Verify API health**: Visit `http://localhost:3001/api/health` - should return `{"status":"ok","message":"Application is running"}`

3. **Test yield data fetching**: The yield curve chart should automatically load treasury yield data from the FRED API

4. **Test order submission**:
   - Select a term (e.g., "1Y", "10Y")
   - Enter an amount
   - Click "Submit Order"
   - Verify the order appears in the Order History table

5. **Test pagination**: If you submit more than 10 orders, use the pagination controls to navigate between pages

6. **Test idempotency**: Submit the same order twice with the same `Idempotency-Key` header - the second request should return the same order without creating a duplicate

### Troubleshooting
- For simplicity, I didn't do any different port handling or abstraction of ports, so for easiest use, ensure you use 3001 for the backend and 3000 for the frontend.
- All commands should be entered from the root directory.
- I had a puzzling hiccup with the FRED API key while testing its rate limits and how the backend would handle those. This occurred when I tried to refresh the page many times consecutively and got a 403 error, which is not documented in their errors. I believe if you hit the rate limits a certain number of times, they disable that key and create a new one for you. So, if you also go down this road and hit 403 errors, you will just need to check out the FRED API Keys page and you should see a new and usable API Key waiting for you - at least that's what happened to me. 
- That should be all! Let me know if you have any issues.
