import axios from 'axios';
import { FREDResponse, YieldData, YieldError } from '@modernfi-takehome/shared';
import { TREASURY_SERIES, FRED_API_BASE_URL } from '../constants/fredConstants';
import { logger } from '../utils/logger';

export interface YieldsServiceResult {
    yields: YieldData[];
    errors: YieldError[];
    fromCache?: boolean;
}

// Cache structure for storing successful yields data as fallback
interface YieldsCache {
    data: YieldData[];
    timestamp: Date;
}

// In-memory cache for yields data (updated on successful API calls)
let yieldsCache: YieldsCache | null = null;

export const yieldsService = {
    /**
     * Fetches treasury yield data from FRED API for a specific series
     * Fetches last 10 observations to ensure we can find the most recent shared date
     */
    fetchFREDData: async (seriesId: string, apiKey: string): Promise<FREDResponse> => {
        try {
            /**
             * I am unfamiliar with the FRED API, so I'm not sure how reliable the data is or if data across the board is updated at the same time.
             * Therefore, just to be safe that the yields data that is returned is all on the same day, I fetch the last 10 observations and then find the shared most recent date in getAllYields().
             */
            const response = await axios.get(FRED_API_BASE_URL, {
                params: {
                    series_id: seriesId,
                    api_key: apiKey,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 10
                },
            });

            return response.data;
        } catch (error) {
            // Handle Axios-specific errors
            if (axios.isAxiosError(error)) {
                logger.error(`FRED API error for series ${seriesId}`, {
                    message: error.message,
                    status: error.response?.status,
                });
                throw {
                    message: error.message,
                    status: error.response?.status,
                    seriesId,
                };
            }
            // Handle unexpected errors
            logger.error(`Unexpected error fetching FRED data for ${seriesId}`, error);
            throw {
                message: error instanceof Error ? error.message : 'Unknown error',
                status: undefined,
                seriesId,
            };
        }
    },

    /**
     * Parses FRED API response into YieldData format
     * Filters out invalid values and converts dates to Date objects
     */
    parseFREDData: (fredData: FREDResponse, series_id: string, term: string): YieldData[] => {
        const parsed = fredData.observations
            // Filter out missing or invalid values
            .filter(obs => obs.value !== '.' && obs.value !== null)
            .map(obs => {
                // Parse date string (YYYY-MM-DD) to Date object (local midnight)
                const [year, month, day] = obs.date.split('-').map(Number);
                const date = new Date(year, month - 1, day);

                return {
                    date,
                    value: typeof obs.value === 'string' ? parseFloat(obs.value) : parseFloat(obs.value),
                    term,
                    series_id
                };
            })
            // Filter out any NaN values after parsing
            .filter(yieldData => !isNaN(yieldData.value));

        return parsed;
    },

    /**
     * Fetches all treasury yields from FRED API for all terms
     * Returns cached data if API calls fail, otherwise updates cache with fresh data
     */
    getAllYields: async (apiKey: string): Promise<YieldsServiceResult> => {
        const errors: YieldError[] = [];
        const yields: YieldData[] = [];

        // Fetch data for all treasury terms in parallel
        const fetchPromises = Object.entries(TREASURY_SERIES).map(async ([term, seriesId]) => {
            try {
                const fredData = await yieldsService.fetchFREDData(seriesId, apiKey);
                const parsedData = yieldsService.parseFREDData(fredData, seriesId, term);
                return { term, seriesId, data: parsedData, error: null };
            } catch (error) {
                // Extract error message and status code from error object
                let errorMessage = 'Failed to fetch yield data';
                let statusCode: number | undefined = undefined;

                if (error && typeof error === 'object') {
                    if ('message' in error && typeof (error as any).message === 'string') {
                        errorMessage = (error as any).message;
                    }
                    if ('status' in error) {
                        statusCode = (error as any).status;
                    }
                }

                logger.error(`Error fetching ${term} yield data`, {
                    error: errorMessage,
                    statusCode,
                    raw: error,
                });

                return {
                    term,
                    seriesId,
                    data: [],
                    error: {
                        term,
                        seriesId,
                        error: errorMessage,
                        statusCode,
                    },
                };
            }
        });

        const results = await Promise.all(fetchPromises);

        // Separate successful data and errors
        results.forEach(result => {
            if (result.error) {
                errors.push(result.error);
            } else {
                yields.push(...result.data);
            }
        });

        // Group yields by term and get most recent date for each term
        const yieldsByTerm = new Map<string, YieldData[]>();
        yields.forEach(yieldData => {
            if (!yieldsByTerm.has(yieldData.term)) {
                yieldsByTerm.set(yieldData.term, []);
            }
            yieldsByTerm.get(yieldData.term)!.push(yieldData);
        });

        // Find the most recent yield for each term
        const mostRecentYields = Array.from(yieldsByTerm.values()).map(termYields => {
            return termYields.reduce((latest, current) => {
                return new Date(current.date) > new Date(latest.date) ? current : latest;
            });
        });

        // Sort by date (newest first)
        const allYields = mostRecentYields.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Update cache only if all API calls succeeded
        if (errors.length === 0) {
            yieldsCache = {
                data: allYields,
                timestamp: new Date(),
            };
            logger.info(`Updated yields cache with ${allYields.length} data points`);
        }

        // Return cached data if API calls failed and cache exists
        if (errors.length > 0 && yieldsCache) {
            logger.warn('API fetch failed, returning cached yields data', {
                cacheAge: Math.round((Date.now() - yieldsCache.timestamp.getTime()) / 1000 / 60) + ' minutes',
            });
            return {
                yields: yieldsCache.data,
                errors: [], // Don't expose errors when using cache
                fromCache: true,
            };
        }

        return {
            yields: allYields,
            errors,
        };
    }
}