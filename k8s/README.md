## Convert container to kube with kompose

```
kompose convert -f docker-compose.yaml
```

## Kube

### Check version

```
kubectl version -o json
```

### Cluster

```
kubectl cluster-info
```

### Get nodes

```
kubectl get nodes -v=10
```

### Deploy to k8s

do this after setup minikube & service

```
kubectl apply -f .
```

## Run kube with minikube + podman

```
minikube start --driver=podman --container-runtime=containerd
```

## Build images

```
podman build -f backend/Dockerfile.backend -t cat-bit-api ./backend
podman build -f frontend/Dockerfile.frontend -t cat-bit-web ./frontend
```

## Load images

```
podman save cat-bit-api -o cat-bit-api.tar
podman save cat-bit-web -o cat-bit-web.tar
minikube image load cat-bit-api.tar
minikube image load cat-bit-web.tar
```

## Deploy

```
kubectl apply -f k8s/
```

## Port forward

```
kubectl port-forward service/web 4200:4200
kubectl port-forward service/api 3000:3000
```

## Runn kube with podman

```
podman run -d --name k3s-server -p 6443:6443 -p 8080:8080 --privileged rancher/k3s:latest server --https-listen-port 6443 --http-listen-port 8080
```

### Check cluster

```
podman exec -it k3s-server kubectl cluster-info
```

### Get nodes

```
podman exec -it k3s-server kubectl get nodes -v=10
```

## Mini kube

- Start with podman

  ```
  minikube start --driver=podman
  ```

  ```
  minikube start --driver=podman --container-runtime=containerd
  ```

- Fix permission

  ```
  echo '<username> ALL=(ALL) NOPASSWD: /usr/bin/podman' | sudo tee /etc/sudoers.d/podman
  ```

---

- Config

  ```
  minikube config set rootless true
  ```

- Stop

  ```
  minikube stop
  ```

- Delete

  ```
  minikube delete
  ```

- Load image
  ```
  minikube image load <image_name>
  ```
