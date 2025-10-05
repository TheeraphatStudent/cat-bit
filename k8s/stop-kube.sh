#!/bin/bash

set -e

echo "Stopping port forwarding..."
pkill -f "kubectl port-forward" || true

echo "Deleting Kubernetes resources..."
kubectl delete -f . || true

echo "Cleaning up images..."
podman rmi cat-bit-api cat-bit-web || true
rm -f cat-bit-api.tar cat-bit-web.tar || true

echo "Stopping Minikube..."
minikube stop

echo "Minikube stopped."
