# URL Shortener Helm Chart

This Helm chart deploys the URL Shortener application on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure (if persistence is enabled)

## Installation

### Add the repository (optional)

If the chart is hosted in a Helm repository:

```bash
helm repo add url-shortener https://example.com/helm-charts
helm repo update
```

### Install the chart

Create a custom `values.yaml` file or use the default values.

```bash
# Clone the repository if you don't have the chart locally
git clone https://github.com/nova-iris/url-shortener.git
cd url-shortener

# Install with default values
helm install my-url-shortener ./release/helm-chart/url-shortener

# Or with custom values file
helm install my-url-shortener ./release/helm-chart/url-shortener -f my-values.yaml

# For production with Ingress enabled
helm install my-url-shortener ./release/helm-chart/url-shortener \
  --set networking.useIngress=true \
  --set networking.ingress.enabled=true \
  --set networking.ingress.hosts[0].host=url-shortener.example.com
```

## Configuration

The following table lists the configurable parameters of the URL Shortener chart and their default values:

| Parameter | Description | Default |
| --------- | ----------- | ------- |
| `nameOverride` | Override the name of the chart | `""` |
| `fullnameOverride` | Override the full name of the chart | `""` |
| `image.localImages` | Use locally loaded images in Minikube | `false` |
| `image.registry` | Registry for images | `ghcr.io` |
| `image.organization` | Organization in registry | `nova-iris` |
| `networking.useIngress` | Use Ingress for external access | `false` |
| `networking.externalAccessHost` | Host to use for external access URLs | `localhost` |
| `networking.ingress.enabled` | Enable ingress | `false` |
| `networking.ingress.className` | Ingress class name | `nginx` |
| `networking.ingress.hosts[0].host` | Hostname for ingress | `url-shortener.local` |
| `mongodb.enabled` | Deploy MongoDB | `true` |
| `mongodb.image.repository` | MongoDB image repository | `mongo` |
| `mongodb.image.tag` | MongoDB image tag | `6.0` |
| `mongodb.persistence.enabled` | Enable MongoDB persistence | `true` |
| `mongodb.persistence.size` | MongoDB PVC size | `1Gi` |
| `mongodb.persistence.useTemporaryStorage` | Use emptyDir for MongoDB (non-persistent) | `false` |
| `mongodb.auth.rootUsername` | MongoDB root username | `admin` |
| `mongodb.auth.rootPassword` | MongoDB root password | `password` |
| `mongodb.auth.database` | MongoDB database name | `urlshortener` |
| `server.image.repository` | Server image repository | `urlshortener-server` |
| `server.image.tag` | Server image tag | `latest` |
| `server.replicaCount` | Number of server replicas | `1` |
| `client.image.repository` | Client image repository | `urlshortener-client` |
| `client.image.tag` | Client image tag | `latest` |
| `client.replicaCount` | Number of client replicas | `1` |

## Using with Minikube

For local development with Minikube:

```bash
# Start Minikube
minikube start

# Enable ingress addon (optional)
minikube addons enable ingress

# Build and load the images into Minikube
eval $(minikube docker-env)
docker build -t urlshortener-server:latest -f src/server/Dockerfile src/server
docker build -t urlshortener-client:latest -f src/client/Dockerfile src/client

# Install the chart using local images
helm install my-url-shortener ./release/helm-chart/url-shortener \
  --set image.localImages=true \
  --set networking.externalAccessHost=$(minikube ip)
```

## Upgrading the Chart

```bash
helm upgrade my-url-shortener ./release/helm-chart/url-shortener
```

## Uninstalling the Chart

```bash
helm uninstall my-url-shortener
```

## Persistence

The MongoDB data is persisted by default. To use ephemeral storage instead, set `mongodb.persistence.useTemporaryStorage=true`.

## Security

For production deployments, consider:
1. Setting proper MongoDB credentials
2. Enabling TLS for ingress 
3. Using Kubernetes secrets for sensitive data