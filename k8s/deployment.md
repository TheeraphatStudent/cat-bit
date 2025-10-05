## Deployment kube

### 1. Start Minikube Cluster with Podman

```bash
minikube start --driver=podman --container-runtime=containerd
```

### 2. Build Docker Images with Podman

Build the backend API and frontend web images using Podman:

```bash
podman build -f backend/Dockerfile.backend -t cat-bit-api ./backend
podman build -f frontend/Dockerfile.frontend -t cat-bit-web ./frontend
```

### 3. Save Images to Tar Files

Save the built images as tar archives for loading into Minikube:

```bash
podman save cat-bit-api -o cat-bit-api.tar
podman save cat-bit-web -o cat-bit-web.tar
```

### 4. Load Images into Minikube

Load the tar files into the Minikube cluster:

```bash
minikube image load cat-bit-api.tar
minikube image load cat-bit-web.tar
```

### 5. Update Kubernetes Manifests (if necessary)

Ensure the deployment YAML files use the correct image names and have `imagePullPolicy: Never` to use local images:

- `api-deployment.yaml`: image: cat-bit-api, imagePullPolicy: Never
- `web-deployment.yaml`: image: cat-bit-web, imagePullPolicy: Never

### 6. Deploy to Kubernetes

Apply the Kubernetes manifests to deploy the application:

```bash
kubectl apply -f k8s/
```

### 7. Verify Deployment

Check that all pods are running:

```bash
kubectl get pods
```

### 8. Access the Application

Port-forward the web and API services to access them locally:

```bash
kubectl port-forward service/web 4200:4200
kubectl port-forward service/api 3000:3000
```

Web: `http://localhost:4200`

API: `http://localhost:3000`
