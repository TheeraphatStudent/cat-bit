#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Minikube with Podman..."
minikube start --driver=podman --container-runtime=containerd

echo "Building images..."
podman build -f ../backend/Dockerfile.backend -t cat-bit-api ../backend
podman build -f ../frontend/Dockerfile.frontend -t cat-bit-web ../frontend

echo "Saving images..."
rm -f cat-bit-api.tar cat-bit-web.tar
podman save cat-bit-api -o cat-bit-api.tar
podman save cat-bit-web -o cat-bit-web.tar

echo "Loading images into Minikube..."
minikube image load cat-bit-api.tar
minikube image load cat-bit-web.tar

echo "Deploying to Kubernetes..."
for file in $(ls *.yaml | grep -v docker-compose); do
  kubectl apply -f "$file"
done

echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=300s

echo "Initializing database..."
kubectl exec $(kubectl get pods -l io.kompose.service=db -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -d catbit -f /docker-entrypoint-initdb.d/init.sql

echo "Port forwarding..."
kubectl port-forward service/web 4200:4200 &
kubectl port-forward service/api 3000:3000 &
kubectl port-forward service/db 5432:5432 &

echo "Deployment complete. Access web at http://localhost:4200"
