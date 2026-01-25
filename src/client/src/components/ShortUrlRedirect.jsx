import { Heading, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { logger } from '../utils/logger';

export default function ShortUrlRedirect() {
    const { urlCode } = useParams();
    const [error, setError] = useState('');

    const redirect = async () => {
        const startTime = Date.now();
        try {
            logger.info('Redirect initiated', { urlCode });
            const response = await axios.get(`/${urlCode}`);
            const duration = Date.now() - startTime;
            
            if (response.data.longUrl) {
                logger.logApiCall('GET', `/${urlCode}`, response.status, duration);
                logger.logNavigation(window.location.href, response.data.longUrl);
                window.location.href = response.data.longUrl;
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.logApiCall('GET', `/${urlCode}`, error.response?.status || 0, duration, error);
            setError(error.response?.data?.error || 'Failed to redirect');
        }
    };

    useEffect(() => {
        if (urlCode) {
            redirect();
        }
    }, [urlCode]);

    return (
        <div>
            <Heading as="h3" size="xl" m={'3% 0% 2% 0%'}>
                {error || 'Redirecting...'}
            </Heading>
        </div>
    );
}