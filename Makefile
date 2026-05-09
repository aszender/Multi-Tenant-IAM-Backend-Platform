install:
	npm install

db-up:
	docker compose up -d db

migrate:
	npm run prisma:migrate

seed:
	npm run prisma:seed

dev:
	npm run start:dev

verify:
	npm run lint
	npm run test
	npm run test:e2e
	npm run build
