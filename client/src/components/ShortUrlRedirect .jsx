import { Heading, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function ShortUrlRedirect() {
  const { urlCode } = useParams();
  const [error, setError] = useState('');

  const redirect = async () => {
    try {
      const response = await axios.get(`/${urlCode}`);
      if (response.data.longUrl) {
        window.location.href = response.data.longUrl;
      }
    } catch (error) {
      console.error('Error redirecting:', error);
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
