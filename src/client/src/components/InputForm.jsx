import React, { useState } from "react";
import axios from 'axios';
import {
    Box,
    FormControl,
    Input,
    FormHelperText,
    FormErrorMessage,
    FormLabel,
    Button,
    Flex,
    useClipboard,
    InputGroup,
    InputLeftAddon,
} from "@chakra-ui/react";
import styles from './InputForm.module.css';
import { logger } from '../utils/logger';

export const InputForm = () => {
    const [input, setInput] = useState(
        {
            longUrl: "",
            urlCode: ""
        }
    );
    const [url, setUrl] = useState("");
    const [isLoading, setIsloading] = useState(false);
    const [isError, setIsError] = useState(false);
    const { hasCopied, onCopy } = useClipboard(url);
    const clientBaseUrl = window.location.href;

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setInput({ ...input, [id]: value });
        setIsError(false);
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    const handleCopy = () => {
        onCopy();
        logger.logUserAction('copy', 'InputForm', { url });
    };

    const handleSubmit = () => {
        if (!input.longUrl) {
            setIsError(true);
            setUrl("Please add a URL");
            logger.warn('URL validation failed', { reason: 'empty_url', component: 'InputForm' });
            return;
        }

        setIsloading(true);
        logger.logUserAction('submit', 'InputForm', { hasCustomCode: !!input.urlCode });

        const apiUrl = '/api/url/shorten';
        const startTime = Date.now();

        axios.post(apiUrl, input)
            .then(res => {
                const duration = Date.now() - startTime;
                logger.logApiCall('POST', apiUrl, res.status, duration);
                
                if (res?.data) {
                    const shortenedUrl = clientBaseUrl + res.data.urlCode;
                    setUrl(shortenedUrl);
                    logger.info('URL shortened successfully', { 
                        urlCode: res.data.urlCode, 
                        isExisting: res.data.isExisting 
                    });
                }
                setIsloading(false);
            })
            .catch(error => {
                const duration = Date.now() - startTime;
                logger.logApiCall(
                    'POST', 
                    apiUrl, 
                    error.response?.status || 0, 
                    duration, 
                    error
                );

                const errorMsg = error?.response?.data?.error || 'Failed to connect to server';
                setUrl(errorMsg);
                setIsloading(false);
            });
    };

    return (
        <Box
            width={"40%"}
            margin={"auto"}
            boxShadow="dark-lg"
            p="6"
            rounded="2xl"
            bg="dark"
            className={styles.mainContainer} >
            <FormControl isInvalid={isError}>
                <FormLabel >Convert long URLs into shortened versions with a single click.</FormLabel>
                <Input
                    id="longUrl"
                    type="url"
                    value={input.longUrl}
                    placeholder="Paste here your long URL"
                    onChange={handleInputChange}
                    onKeyDown={handleEnter}
                />
                {!isError ? (
                    <FormHelperText>Enter your Long Url</FormHelperText>
                ) : (
                    <FormErrorMessage>URL is required.</FormErrorMessage>
                )}
            </FormControl>
            <FormLabel mt={7} fontSize='md'>Create personalized and memorable links for your URLs (Optional)</FormLabel>
            <InputGroup size='md' className={styles.InputGroup}>
                <InputLeftAddon children={`${clientBaseUrl}`} className={styles.BaseUrlAddon} w='50%' />
                <Input placeholder='your personalized code ' id="urlCode"
                    type="text"
                    value={input.urlCode}
                    onChange={handleInputChange}
                    w='50%'
                    onKeyDown={handleEnter}
                />
            </InputGroup>
            <Button type="submit"
                colorScheme="blue"
                m={5}
                onClick={handleSubmit}
                isLoading={isLoading}
                loadingText='Submitting'
            >
                Submit
            </Button>
            {url && <Flex mb={2}>
                <Input value={url} isReadOnly placeholder="Short Url" />
                <Button onClick={handleCopy} ml={2}>
                    {hasCopied ? "Copied" : "Copy"}
                </Button>
            </Flex>}
        </Box>
    );
};
