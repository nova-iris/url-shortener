# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . ./

# Create .env file from environment variables
RUN echo "VITE_APP_URI=$VITE_APP_URI" > .env

# Build the Vite application
RUN npm run build

# Expose the port the app runs on
EXPOSE 4173

# Start the application in preview mode with host exposed
CMD ["npm", "run", "preview", "--", "--host"]