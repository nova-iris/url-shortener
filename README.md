# URL Shortener Web Application

## Description
URL Shortener Web Application is a user-friendly web-based tool that allows users to create shortened versions of long URLs, making them easier to share. This project is built using the MERN stack (MongoDB, Express, React, Node.js) and styled with Chakra UI for a visually appealing and responsive user interface.

## Features
- Shorten URLs: Convert long URLs into shortened versions with a single click.
- Custom Short URLs (Optional): Create personalized and memorable links for your URLs.
- Copy to Clipboard: Copy the shortened URL to the clipboard for easy sharing.
- User-friendly Interface: Intuitive and responsive UI design for a seamless user experience.

## Demo
![URL Shortener Demo](https://github.com/Akshay-Singh-Rajput/MERN-Stack-URL-Shortener/assets/97354310/8e5a29d2-1477-486d-bd9c-b9292fe8d224)

## Live Demo
Try out the live demo of the URL Shortener Web Application [here](https://lightlink.vercel.app).

## Installation

### Option 1: Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/nova-iris/url-shortener.git
cd url-shortener
```

2. Install dependencies for both frontend and backend:
   
```bash
cd server
npm install
cd ../client
npm install
```

3. Set up environment variables:
- Create a `.env` file in the root directory and add the following:
  ```
  MONGODB_URI=your-mongodb-uri
  PORT=your-port-number
  ```

4. Start the development server:

```bash
# For server
cd server
npm start

# For client
cd client
npm run dev
```

### Option 2: Docker Compose (Recommended)

This application is containerized with Docker, making it easy to run in any environment.

1. Clone the repository:

```bash
git clone https://github.com/nova-iris/url-shortener.git
cd url-shortener
```

2. Set up environment variables:

```bash
cd release/docker
cp .env.example .env
```

3. Edit the `.env` file to configure your environment:
   - Set `BACKEND_PUBLIC_URL` to the publicly accessible URL of your backend
   - Update MongoDB credentials if needed

4. Run the application with Docker Compose:

```bash
docker compose up -d
```

5. Access the application:
   - Frontend: http://localhost:4173
   - Backend API: http://localhost:5000

### Option 3: Kubernetes with Helm Chart

For Kubernetes deployment, we provide a Helm chart:

1. Clone the repository:

```bash
git clone https://github.com/nova-iris/url-shortener.git
cd url-shortener
```

2. Install the Helm chart:

```bash
helm install my-url-shortener ./release/helm-chart/url-shortener
```

3. For production with Ingress:

```bash
helm install my-url-shortener ./release/helm-chart/url-shortener \
  --set networking.useIngress=true \
  --set networking.ingress.enabled=true \
  --set networking.ingress.hosts[0].host=url-shortener.example.com
```

For detailed Helm installation and configuration instructions, see the [Helm Chart README](./release/helm-chart/url-shortener/README.md).

### Docker Container Information

The application consists of three services:
- **MongoDB** - Database container
- **Server** - Node.js backend container
- **Client** - React frontend container

Each container includes health checks, security hardening, and proper user permissions.

## Usage
1. Access the application in your web browser.
2. Enter the long URL you want to shorten in the input field.
3. Optionally, you can provide a custom short URL code for the link.
4. Click the "Shorten URL" button to generate the shortened version.
5. The shortened URL will be displayed in the output field, and it will be automatically copied to your clipboard for easy sharing.

## Deployment
- **Containerized Deployment**:
  - The application is packaged as Docker containers
  - Deployment-ready with Docker Compose
  - Kubernetes-ready with Helm charts

- **Alternative Platforms**:
  - Backend: [Render](https://render.com)
  - Frontend: [Vercel](https://vercel.com)

## Contributing
Contributions are welcome! If you find any bugs or have suggestions for improvements, please create a new issue or submit a pull request.

## Contact
For any inquiries or questions, feel free to reach out via [email](mailto:trongtruong2509@gmail.com).
