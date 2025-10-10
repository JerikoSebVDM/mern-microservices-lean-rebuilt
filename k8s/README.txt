Quick start (Docker Desktop Kubernetes)

1) Apply everything:
   kubectl apply -f namespace.yaml
   kubectl apply -f configmap.yaml
   kubectl apply -f mongo-deployment.yaml
   kubectl apply -f rabbitmq-deployment.yaml
   kubectl apply -f rabbitmq-exporter-deployment.yaml
   kubectl apply -f auth-deployment.yaml
   kubectl apply -f catalog-deployment.yaml
   kubectl apply -f cart-deployment.yaml
   kubectl apply -f order-deployment.yaml
   kubectl apply -f shipping-deployment.yaml
   kubectl apply -f gateway-deployment.yaml
   kubectl apply -f client-deployment.yaml
   kubectl apply -f prometheus-configmap.yaml
   kubectl apply -f prometheus-deployment.yaml
   kubectl apply -f grafana-deployment.yaml

2) Check status:
   kubectl get pods -n mern-ecommerce

3) Port-forward (open in browser):
   Gateway:   kubectl -n mern-ecommerce port-forward svc/gateway 8080:8080
   Client:    kubectl -n mern-ecommerce port-forward svc/client 5173:5173
   Prometheus:kubectl -n mern-ecommerce port-forward svc/prometheus 9090:9090
   Grafana:   kubectl -n mern-ecommerce port-forward svc/grafana 3000:3000

Notes:
- All services use ClusterIP and discover each other by service DNS names.
- Images reference your local Docker images with imagePullPolicy: IfNotPresent.
- Update JWT_SECRET in configmap.yaml for anything beyond local testing.
