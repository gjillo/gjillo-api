
# Gjillo API

This repository contains only the API's code. For the main repository, see [Gjillo/gjillo-app](https://github.com/gjillo/gjillo-app)

## Tech Stack

<img src="https://img.shields.io/badge/Node.js-339933?logo=Node.js&logoColor=white&style=for-the-badge"/>
<img src="https://img.shields.io/badge/Express-000000?logo=Express&logoColor=white&style=for-the-badge"/>
<img src="https://img.shields.io/badge/Typescript-3178C6?logo=TypeScript&logoColor=white&style=for-the-badge"/>
<img src="https://img.shields.io/badge/GraphQL-E10098?logo=GraphQL&logoColor=white&style=for-the-badge"/>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=PostgreSQL&logoColor=white&style=for-the-badge"/>

## Installation

### Prerequisities

- PostgreSQL database
- Node.js

### Database

Import [database.sql](database.sql) into your PostgreSQL database

### API

Clone this repo on your local machine
```
git clone https://github.com/gjillo/gjillo-api.git
cd gjillo-api
```

Install node modules
```
npm install
```

Create `.env.local` file and fill in the database credentials, as described in the [.env](.env) file, for example:

```dotenv
DB_HOST="your-postgres-database.com"
DB_PORT=5432
DB_USER="postgres"
DB_DATABASE="gjillo"
DB_PASSWORD="your-password"
```

Start live server
```
npm run start
```

API will be available at [localhost:4000](http://localhost:4000).

GraphQL Playground will be available at [localhost:4000/graphql](http://localhost:4000/graphql).

## Docs

To generate docs start server and run

```
npm run docs
```

Docs will be available at [localhost:4000/docs/api/](http://localhost:4000/docs/api/)

## Authors

- [Filip Kowalski](https://github.com/Spookyless)
- [Krzysztof Wrona](https://github.com/rubikon02)
- [Michał Karpierz](https://github.com/ShatterPlayer)

## License

This project is licensed under [MIT](./LICENSE) license.