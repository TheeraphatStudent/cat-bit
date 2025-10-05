#!/bin/bash

# Auto Redeployment Script for Cat Bit Application
# This script rebuilds and redeploys the web, API, and database services to GKE

set -e

# Configuration
PROJECT_ID="lottocat"
REGION="us-central1"
ZONE="us-central1-a"
CLUSTER_NAME="catbit-cluster"

echo "🚀 Cat Bit Auto Redeployment Script"
echo "====================================="
echo "Project ID: $PROJECT_ID"
echo "Cluster: $CLUSTER_NAME ($ZONE)"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists podman && ! command_exists docker; then
    echo "❌ Error: Neither podman nor docker is installed"
    exit 1
fi

if ! command_exists kubectl; then
    echo "❌ Error: kubectl is not installed"
    exit 1
fi

if ! command_exists gcloud; then
    echo "❌ Error: gcloud CLI is not installed"
    exit 1
fi

# Step 2: Authenticate with GCR (if not already authenticated)
echo "🔐 Authenticating with Google Container Registry..."
gcloud auth configure-docker --quiet

# Step 3: Build and push Frontend Image
echo ""
echo "🏗️  Building Frontend Image..."
cd ../frontend
if command_exists podman; then
    podman build -t gcr.io/$PROJECT_ID/catbit-frontend:latest -f Dockerfile.frontend .
    echo "📤 Pushing Frontend Image..."
    podman push gcr.io/$PROJECT_ID/catbit-frontend:latest
elif command_exists docker; then
    docker build -t gcr.io/$PROJECT_ID/catbit-frontend:latest -f Dockerfile.frontend .
    echo "📤 Pushing Frontend Image..."
    docker push gcr.io/$PROJECT_ID/catbit-frontend:latest
fi
cd ../k8s

# Step 4: Build and push Backend Image
echo ""
echo "🏗️  Building Backend Image..."
cd ../backend
if command_exists podman; then
    podman build -t gcr.io/$PROJECT_ID/catbit-backend:latest -f Dockerfile.backend .
    echo "📤 Pushing Backend Image..."
    podman push gcr.io/$PROJECT_ID/catbit-backend:latest
elif command_exists docker; then
    docker build -t gcr.io/$PROJECT_ID/catbit-backend:latest -f Dockerfile.backend .
    echo "📤 Pushing Backend Image..."
    docker push gcr.io/$PROJECT_ID/catbit-backend:latest
fi
cd ../k8s

# Step 5: Apply Kubernetes Configurations
echo ""
echo "☸️  Applying Kubernetes Configurations..."

echo "📦 Applying Persistent Volume Claims..."
kubectl apply -f postgres-data-persistentvolumeclaim.yaml
kubectl apply -f uploads-data-persistentvolumeclaim.yaml

echo "🗄️  Applying Database Configurations..."
kubectl apply -f db-cm1-configmap.yaml
kubectl apply -f db-deployment.yaml
kubectl apply -f db-service.yaml

echo "⏳ Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-db --timeout=300s || echo "⚠️  Database readiness check timed out, continuing..."

echo "🔧 Applying API Configurations..."
kubectl apply -f api-cm0-configmap.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml

echo "⏳ Waiting for API to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-api --timeout=300s || echo "⚠️  API readiness check timed out, continuing..."

echo "🌐 Applying Web Configurations..."
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml

echo "⏳ Waiting for Web to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-web --timeout=300s || echo "⚠️  Web readiness check timed out, continuing..."

# Step 6: Display Status
echo ""
echo "📊 Deployment Status:"
echo "===================="

echo ""
echo "🔍 Pod Status:"
kubectl get pods -o wide

echo ""
echo "🌐 Service Status:"
kubectl get services -o wide

echo ""
echo "📈 Resource Usage:"
kubectl top pods 2>/dev/null || echo "⚠️  Metrics server not available"

echo ""
echo "✅ Redeployment Complete!"
echo "=========================="

# Get external IPs
echo "🌐 External URLs:"
WEB_IP=$(kubectl get service catbit-web -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
API_IP=$(kubectl get service catbit-api -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -n "$WEB_IP" ]; then
    echo "  Frontend: http://$WEB_IP"
    echo "  Test: curl -I http://$WEB_IP"
else
    echo "  Frontend: <pending - LoadBalancer not ready yet>"
fi

if [ -n "$API_IP" ]; then
    echo "  API: http://$API_IP"
    echo "  Test: curl -I http://$API_IP"
else
    echo "  API: <pending - LoadBalancer not ready yet>"
fi

echo ""
echo "🔧 Useful Commands:"
echo "  View logs: kubectl logs -l app=catbit-web"
echo "  View API logs: kubectl logs -l app=catbit-api"
echo "  View DB logs: kubectl logs -l app=catbit-db"
echo "  Check services: kubectl get services"
echo "  Check pods: kubectl get pods"
echo "  Debug DB: kubectl describe pod -l app=catbit-db"
echo ""
echo "🎉 Redeployment completed successfully!"
