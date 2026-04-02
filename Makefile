# Administration Docker / déploiement local.
# Exécuter depuis la racine du dépôt : make <cible>

.PHONY: help dev-db-up dev-db-down dev-db-logs prod-up prod-down prod-build prod-logs prod-ps

DEPLOY := deployment
COMPOSE := docker compose

help:
	@echo "Cibles disponibles :"
	@echo "  make dev-db-up     — démarre PostgreSQL (dev, port hôte 5433)"
	@echo "  make dev-db-down   — arrête le stack dev DB"
	@echo "  make dev-db-logs   — suit les logs Postgres (dev)"
	@echo "  make prod-up       — build + démarre web + api + postgres (exportez POSTGRES_PASSWORD)"
	@echo "  make prod-down     — arrête le stack prod"
	@echo "  make prod-build    — rebuild des images prod"
	@echo "  make prod-logs     — suit les logs de tous les services prod"
	@echo "  make prod-ps       — état des conteneurs prod"

dev-db-up:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml up -d

dev-db-down:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml down

dev-db-logs:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml logs -f postgres

prod-up:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.prod.yml up -d --build

prod-down:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.prod.yml down --remove-orphans

prod-build:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.prod.yml build

prod-logs:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.prod.yml logs -f

prod-ps:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.prod.yml ps
