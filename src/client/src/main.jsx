import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { CSSReset, theme, ChakraProvider, ColorModeProvider, ThemeProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Use the runtime configuration instead of build-time env variables
console.log('Runtime config:', window.RUNTIME_CONFIG);

// Get backend URL from runtime config
// Empty string means use relative paths (same origin) - the client server proxies /api requests
const serverBaseUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
console.log('Using backend URL:', serverBaseUrl || '(relative paths - proxied by client server)');

// Configure axios
axios.defaults.baseURL = serverBaseUrl;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ChakraProvider>
            <BrowserRouter>
                <ThemeProvider theme={theme}>
                    <ColorModeProvider>
                        <CSSReset />
                        <App />
                    </ColorModeProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ChakraProvider>
    </React.StrictMode>
);
