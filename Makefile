# Administration Docker / déploiement local.
# Exécuter depuis la racine du dépôt : make <cible>

.PHONY: help dev-db-up dev-db-down dev-db-logs prod-up prod-down prod-build prod-logs prod-ps prod-prune-disk

DEPLOY := deployment
COMPOSE := docker compose
PROD_COMPOSE := -f $(DEPLOY)/docker-compose.prod.yml

# Compose lit par défaut le .env du « projet » (souvent deployment/), pas la racine Git.
# On passe explicitement --env-file .env si le fichier existe à la racine (ex. sur le VPS).
PROD_ENV :=
ifneq ($(wildcard .env),)
PROD_ENV := --env-file .env
endif

help:
	@echo "Cibles disponibles :"
	@echo "  make dev-db-up     — démarre PostgreSQL (dev, port hôte 5433)"
	@echo "  make dev-db-down   — arrête le stack dev DB"
	@echo "  make dev-db-logs   — suit les logs Postgres (dev)"
	@echo "  make prod-up       — build + démarre web + api + postgres (POSTGRES_PASSWORD dans .env racine ou export)"
	@echo "  make prod-down     — arrête le stack prod"
	@echo "  make prod-build    — rebuild des images prod"
	@echo "  make prod-logs     — suit les logs de tous les services prod"
	@echo "  make prod-ps       — état des conteneurs prod"
	@echo "  make prod-prune-disk — libère cache BuildKit + images inutilisées (à lancer sur le VPS si disque plein)"

dev-db-up:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml up -d

dev-db-down:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml down

dev-db-logs:
	$(COMPOSE) -f $(DEPLOY)/docker-compose.dev.yml logs -f postgres

prod-up:
	$(COMPOSE) $(PROD_ENV) $(PROD_COMPOSE) up -d --build

prod-down:
	$(COMPOSE) $(PROD_ENV) $(PROD_COMPOSE) down --remove-orphans

prod-build:
	$(COMPOSE) $(PROD_ENV) $(PROD_COMPOSE) build

prod-logs:
	$(COMPOSE) $(PROD_ENV) $(PROD_COMPOSE) logs -f

prod-ps:
	$(COMPOSE) $(PROD_ENV) $(PROD_COMPOSE) ps

# À exécuter sur la machine où tourne Docker (ex. VPS), depuis la racine du dépôt, stack arrêté si besoin.
prod-prune-disk:
	docker builder prune -af
	docker image prune -af
	docker system df
