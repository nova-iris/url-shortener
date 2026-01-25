/**
 * Frontend Structured Logger
 * Outputs JSON-formatted logs to console for FluentD/FluentBit collection
 * 
 * Usage:
 *   import { logger } from './utils/logger';
 *   logger.info('User action', { action: 'click', component: 'InputForm' });
 */

// Log levels
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Get current log level from environment (Vite uses import.meta.env)
const getLogLevel = () => {
    const envLevel = import.meta.env?.VITE_LOG_LEVEL?.toLowerCase();
    return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
};

const currentLevel = getLogLevel();

/**
 * Generate a unique session ID for correlating logs
 */
const generateSessionId = () => {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
};

// Session ID remains constant for the browser session
const sessionId = generateSessionId();

/**
 * Format log entry as structured JSON
 */
const formatLog = (level, message, meta = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        service: 'urlshortener-client',
        sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...meta
    };

    return logEntry;
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level) => {
    return LOG_LEVELS[level] <= currentLevel;
};

/**
 * Output log to console in structured format
 */
const outputLog = (level, logEntry) => {
    const jsonLog = JSON.stringify(logEntry);
    
    switch (level) {
        case 'error':
            console.error(jsonLog);
            break;
        case 'warn':
            console.warn(jsonLog);
            break;
        default:
            console.log(jsonLog);
    }
};

/**
 * Logger object with level-specific methods
 */
export const logger = {
    error: (message, meta = {}) => {
        if (shouldLog('error')) {
            outputLog('error', formatLog('error', message, meta));
        }
    },
    warn: (message, meta = {}) => {
        if (shouldLog('warn')) {
            outputLog('warn', formatLog('warn', message, meta));
        }
    },
    info: (message, meta = {}) => {
        if (shouldLog('info')) {
            outputLog('info', formatLog('info', message, meta));
        }
    },
    debug: (message, meta = {}) => {
        if (shouldLog('debug')) {
            outputLog('debug', formatLog('debug', message, meta));
        }
    },
    
    /**
     * Log user interaction events
     */
    logUserAction: (action, component, details = {}) => {
        if (shouldLog('info')) {
            outputLog('info', formatLog('info', 'User action', {
                action,
                component,
                ...details
            }));
        }
    },
    
    /**
     * Log API request/response
     */
    logApiCall: (method, url, status, duration, error = null) => {
        const level = error || status >= 400 ? 'error' : 'info';
        if (shouldLog(level)) {
            outputLog(level, formatLog(level, 'API call', {
                method,
                apiUrl: url,
                status,
                durationMs: duration,
                ...(error && { error: error.message || String(error) })
            }));
        }
    },
    
    /**
     * Log navigation events
     */
    logNavigation: (from, to) => {
        if (shouldLog('info')) {
            outputLog('info', formatLog('info', 'Navigation', {
                from,
                to
            }));
        }
    },
    
    /**
     * Get current session ID
     */
    getSessionId: () => sessionId
};

export default logger;
