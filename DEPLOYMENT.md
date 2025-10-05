# Cat Bit - GCloud Kubernetes Deployment Guide

## Prerequisites

1. **Google Cloud Platform Account**

   - Active GCP project
   - Billing enabled
   - Owner or Editor role

2. **Required Tools**

   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL

   # Install kubectl
   gcloud components install kubectl

   # Install Docker
   # Follow: https://docs.docker.com/engine/install/
   ```

3. **Authentication**
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

## Manual Deployment

### Step 1: Configure Project

Edit `k8s/gcloud-setup.sh` and update:

```bash
PROJECT_ID="your-gcp-project-id"
CLUSTER_NAME="catbit-cluster"
REGION="us-central1"
ZONE="us-central1-a"
```

### Step 2: Run Deployment Script

```bash
cd k8s
./gcloud-setup.sh
```

### Step 3: Verify Deployment

```bash
# Check pods
kubectl get pods

# Check services
kubectl get services

# View logs
kubectl logs -l app=catbit-web --tail=50
kubectl logs -l app=catbit-api --tail=50
kubectl logs -l app=catbit-db --tail=50
```

### Step 4: Access Application

```bash
# Get external IP
kubectl get service catbit-web

# Access at: http://<EXTERNAL-IP>
```

## GitHub Actions Auto-Deployment

### Setup GitHub Secrets

1. **Create Service Account**

   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions"

   # Grant permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/container.developer"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   # Create key
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Add GitHub Secrets**

   Go to: `Settings` → `Secrets and variables` → `Actions`

   Add these secrets:

   - `GKE_PROJECT`: Your GCP project ID
   - `GKE_SA_KEY`: Contents of `key.json` file

### Trigger Deployment

Push to `dev` branch:

```bash
git add .
git commit -m "Deploy to GKE"
git push origin dev
```

Or manually trigger:

- Go to `Actions` tab in GitHub
- Select `Deploy to GKE` workflow
- Click `Run workflow`

## Monitoring

### View Resources

```bash
# Pod status
kubectl get pods -o wide

# Service endpoints
kubectl get services

# Resource usage
kubectl top nodes
kubectl top pods

# Describe pod
kubectl describe pod <pod-name>
```

### View Logs

```bash
# Real-time logs
kubectl logs -f deployment/catbit-web
kubectl logs -f deployment/catbit-api
kubectl logs -f deployment/catbit-db

# Last 100 lines
kubectl logs deployment/catbit-api --tail=100

# Logs from specific container
kubectl logs <pod-name> -c catbit-api
```

### Debug Issues

```bash
# Get pod events
kubectl get events --sort-by='.lastTimestamp'

# Shell into pod
kubectl exec -it <pod-name> -- /bin/bash

# Port forward for local testing
kubectl port-forward service/catbit-web 8080:80
kubectl port-forward service/catbit-api 3000:3000
```

## Update Deployment

### Update Images

```bash
# Build new images
docker build -t gcr.io/$PROJECT_ID/catbit-frontend:v2 -f frontend/Dockerfile.frontend frontend/
docker push gcr.io/$PROJECT_ID/catbit-frontend:v2

# Update deployment
kubectl set image deployment/catbit-web catbit-web=gcr.io/$PROJECT_ID/catbit-frontend:v2

# Check rollout status
kubectl rollout status deployment/catbit-web
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/catbit-web

# Rollback to specific revision
kubectl rollout undo deployment/catbit-web --to-revision=2

# View rollout history
kubectl rollout history deployment/catbit-web
```

## Security Best Practices

1. **Use Secrets for Sensitive Data**

   ```bash
   kubectl create secret generic db-secret \
     --from-literal=password=your-password
   ```

2. **Enable Network Policies**

   ```bash
   kubectl apply -f k8s/network-policy.yaml
   ```

3. **Use Private GKE Cluster**
   ```bash
   gcloud container clusters create catbit-cluster \
     --enable-private-nodes \
     --enable-ip-alias \
     --master-ipv4-cidr 172.16.0.0/28
   ```

## Cost Optimization

### Scale Down (Development)

```bash
# Scale to 1 replica
kubectl scale deployment catbit-web --replicas=1
kubectl scale deployment catbit-api --replicas=1

# Or delete cluster when not in use
gcloud container clusters delete catbit-cluster --zone us-central1-a
```

### Auto-scaling (Production)

```bash
# Horizontal Pod Autoscaler
kubectl autoscale deployment catbit-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10
```

## Cleanup

### Delete Deployment

```bash
# Delete all resources
kubectl delete -f k8s/

# Delete cluster
gcloud container clusters delete catbit-cluster --zone us-central1-a

# Delete images
gcloud container images delete gcr.io/$PROJECT_ID/catbit-frontend
gcloud container images delete gcr.io/$PROJECT_ID/catbit-backend
```

## Troubleshooting

### Common Issues

**1. ImagePullBackOff**

```bash
# Check image exists
gcloud container images list --repository=gcr.io/$PROJECT_ID

# Verify credentials
kubectl get secret default-token-xxxxx -o yaml
```

**2. CrashLoopBackOff**

```bash
# Check logs
kubectl logs <pod-name> --previous

# Check pod events
kubectl describe pod <pod-name>
```

**3. Service Not Accessible**

```bash
# Check service
kubectl get service catbit-web -o yaml

# Check endpoints
kubectl get endpoints catbit-web

# Test from within cluster
kubectl run test --rm -it --image=busybox -- wget -O- http://catbit-web
```
