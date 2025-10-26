# Cat bit - Game shop

### Kubernetes

- Convert container to kubernetes

  ```bash
  kompose convert -f docker-compose.yml
  ```

### Podman generate kube

- Generate kubernetes yaml

  ```bash
  podman generate kube -f cat-bit_deployment > docker-compose.yaml
  ```

### Gcloud kubernetes

- Create Kubunernetes cluster

  ```bash
  gcloud container clusters create cat-bit --num-nodes=1 --zone=us-central1-a
  ```

- Get kubectl credentials
  ```bash
  gcloud container clusters get-credentials cat-bit --zone=us-central1-a
  ```
