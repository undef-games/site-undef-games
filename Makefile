.PHONY: help install-root install-lab stamp build-hugo build-lab build serve clean deploy deploy-preview preview test typecheck e2e
.NOTPARALLEL: clean build

SHELL := /bin/bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

stamp: ## Refresh data/build.json with current SHA + timestamp
	@bash scripts/stamp_build.sh

install-root: ## Install root tool dependencies
	@npm ci

install-lab: ## Install Vite lab dependencies
	@npm --prefix lab ci --include=dev

build-hugo: stamp ## Build Hugo into public/
	@rm -rf public/
	@hugo --minify

build-lab: build-hugo install-lab ## Build the Vite lab into public/lab/
	@npm --prefix lab run build
	@rm -rf public/lab
	@mkdir -p public/lab
	@cp -R lab/dist/. public/lab/

build: build-lab ## Build Hugo and lab into one public/ artifact

serve: stamp ## Serve Hugo locally on http://127.0.0.1:1780
	@hugo server --port 1780 --bind 127.0.0.1 --disableFastRender --noHTTPCache

clean: ## Remove build output
	@rm -rf public lab/dist

typecheck: ## Run lab TypeScript checks
	@npm --prefix lab run typecheck

test: install-lab ## Run lab unit tests
	@npm --prefix lab run test:run

e2e: install-root build ## Run the current Playwright suite
	@./node_modules/.bin/playwright test

deploy: install-root build ## Build then deploy public/ to Cloudflare Pages production
	@./node_modules/.bin/wrangler pages deploy public --project-name=undef-logos --branch=main

deploy-preview: install-root build ## Build then deploy public/ to a Cloudflare Pages staging preview URL
	@./node_modules/.bin/wrangler pages deploy public --project-name=undef-logos --branch=staging

preview: deploy-preview ## Alias for deploy-preview

