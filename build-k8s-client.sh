#!/bin/bash
set -e

echo "Building Kubernetes-specific client image..."

# Extract Minikube IP for configuration
MINIKUBE_IP=$(minikube ip)
echo "Detected Minikube IP: ${MINIKUBE_IP}"

# Build the client image with correct configuration
docker build -t url-shortener-client:k8s \
  --build-arg BACKEND_URL=http://url-shortener-server:5000 \
  ./client

# Load the image into Minikube
echo "Loading image into Minikube..."
minikube image load url-shortener-client:k8s

echo "Creating values file with local image..."
cat > ./local-values.yaml << EOF
client:
  image:
    repository: url-shortener-client
    tag: k8s
    pullPolicy: Never
  env:
    BACKEND_URL: http://url-shortener-server:5000
    BROWSER_BACKEND_URL: "http://${MINIKUBE_IP}:30081"
    externalHostname: "${MINIKUBE_IP}"
    externalBackendPort: 30081
EOF

echo "Image built and loaded successfully!"
echo "Now you can deploy using:"
echo "helm upgrade --install url-shortener ./release/helm-chart/url-shortener -f ./release/helm-chart/url-shortener/values/nodeport-example.yaml -f ./local-values.yaml"