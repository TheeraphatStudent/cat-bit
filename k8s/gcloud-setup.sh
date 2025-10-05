#!/bin/bash

# GCloud Kubernetes Setup Script for Cat Bit
# This script sets up a GKE cluster and deploys the application

set -e

# Configuration
PROJECT_ID="lottocat"
while [ -z "$PROJECT_ID" ]; do
  read -p "Please enter your GCP Project ID: " PROJECT_ID
  if [ -z "$PROJECT_ID" ]; then
    echo "Error: Project ID is required"
  fi
done
CLUSTER_NAME="catbit-cluster"
REGION="us-central1"
ZONE="us-central1-a"
MACHINE_TYPE="e2-medium"
NUM_NODES=3

echo " Cat Bit GKE Deployment Script"
echo "=================================="

# Step 1: Set the project
echo " Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Step 2: Enable required APIs
echo " Enabling required APIs..."
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Step 3: Create GKE cluster
echo "  Creating GKE cluster..."
gcloud container clusters create $CLUSTER_NAME \
  --zone $ZONE \
  --machine-type $MACHINE_TYPE \
  --num-nodes $NUM_NODES \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --disk-size 20 \
  --disk-type pd-standard

# Step 4: Get cluster credentials
echo " Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE

# Step 5: Create namespace (optional)
echo " Setting up Kubernetes resources..."
kubectl create namespace catbit --dry-run=client -o yaml | kubectl apply -f -

# Step 6: Build and push Docker images
echo " Building Docker images..."

# Build Frontend
echo "Building frontend..."
docker build -t gcr.io/$PROJECT_ID/catbit-frontend:latest -f ../frontend/Dockerfile.frontend ../frontend

# Build Backend
echo "Building backend..."
docker build -t gcr.io/$PROJECT_ID/catbit-backend:latest -f ../backend/Dockerfile.backend ../backend

# Step 7: Push images to GCR
echo " Pushing images to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/catbit-frontend:latest
docker push gcr.io/$PROJECT_ID/catbit-backend:latest

# Step 8: Deploy to Kubernetes
echo "  Deploying to Kubernetes..."

# Deploy Database
kubectl apply -f postgres-data-persistentvolumeclaim.yaml
kubectl apply -f db-cm1-configmap.yaml
kubectl apply -f db-deployment.yaml
kubectl apply -f db-service.yaml

echo " Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-db --timeout=300s

# Deploy Backend
kubectl apply -f uploads-data-persistentvolumeclaim.yaml
kubectl apply -f api-cm0-configmap.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml

echo " Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-api --timeout=300s

# Deploy Frontend
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml

echo " Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=catbit-web --timeout=300s

# Step 9: Get external IP
echo " Getting external IP address..."
echo "Waiting for LoadBalancer IP..."
sleep 30

EXTERNAL_IP=$(kubectl get service catbit-web -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo ""
echo " Deployment Complete!"
echo "======================="
echo " Frontend URL: http://$EXTERNAL_IP"
echo " API URL: http://$(kubectl get service catbit-api -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo ""
echo " Check deployment status:"
echo "  kubectl get pods"
echo "  kubectl get services"
echo ""
echo " View logs:"
echo "  kubectl logs -l app=catbit-web"
echo "  kubectl logs -l app=catbit-api"
echo "  kubectl logs -l app=catbit-db"
echo ""
echo " Monitor resources:"
echo "  kubectl top nodes"
echo "  kubectl top pods"
